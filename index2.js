const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const JsonDB = require('node-json-db').JsonDB;
const Config = require('node-json-db/dist/lib/JsonDBConfig').Config;
const fs = require('fs');

var db = new JsonDB(new Config("public/data/eleves.json", true, true, '/'));
var dbS = new JsonDB(new Config("public/data/settings.json", true, true, '/'));

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

io.on('connection', (socket) => {
    console.log("[CONNECTION] New user connected");
    socket.on("disconnect", () => {
        console.log("[CONNECTION] User disconnected");
    });
    socket.on("new-eleve", function (data, res) {
        console.log("[DATA ENTRY] [#1] [1/3] Received new-eleve data — pushing in database...");
        let success = addEleve(data);
        console.log("[DATA ENTRY] [#1] [2/3] New-eleve data push initialized");
        if (success) {
            console.log("[DATA ENTRY] [#1] [3/3] Successfully added new-eleve to database");
            res(null);
        } else {
            console.log("[DATA ENTRY] [#1] [*/3] ERROR: failed to add data to database");
            let err = new Error("Erreur avec le serveur");
            err.name = "DataPullError";
            err.value = "Données non sauvegardées";
            res(err);
        }
    });
    socket.on("refresh-list", async function (data, res) {
        console.log("[REQUEST] [#2] [1/3] Received request for ElevesList refresh");
        let elist = await getListElt("all");
        console.log("[REQUEST] [#2] [2/3] List function initialized with parameter All");
        if (elist[0].length > 0) {
            console.log("[REQUEST] [#2] [3/3] ElevesList successfully returned");
            res(null, elist);
        } else {
            console.log("[REQUEST] [#2] [*/3] ERROR : list not retrieved");
            let err = new Error("Erreur avec le serveur");
            err.name = "GetListError";
            err.value = "Impossible d'obtenir la liste du serveur";
            res(err);
        }
    });
    socket.on("downloadfile", async function (data, res) {
        if (data === "csv") {
            console.log("[REQUEST] [#3] [1/3] Received request for CSV download. Starting conversion...");
            let csv = convertToCSV(await getListElt("dl"));
            console.log("[REQUEST] [#3] [2/3] File converted in CSV. Saving result...");
            fs.writeFile("public/data/eleves.csv", csv, (err) => {
                if (err) {
                    res(err);
                } else {
                    console.log("[REQUEST] [#3] [2/3] File saved and transmitted successfully.");
                    res(null);
                }
            });
        } else {
            res("erreur assignement");
        }
    });
    socket.on("storeSettings", async function (data, res) {
        await dbS.push("/storeSettingsTrue", data);
        res(null);
    });
    socket.on("checkStoreSettings", async function (data, res) {
        let sett = await dbS.getData("/storeSettingsTrue");
        res(null, sett);
    });
    socket.on("checkDir", async function (data, res) {
        if (fs.existsSync(data)) {
            res(null);
        } else {
            let err = new Error("Erreur de fichier");
            err.name = "findFileError";
            err.value = "Le fichier n'existe pas.";
            res(err);
        }
    });
    socket.on("readFile", function (data, res) {
        fs.readFile(data, (err, fileData) => {
            if (err) {
                err.value = "Fichier non trouvé.";
                res(err);
            } else {
                const lignes = fileData.toString().split("\n");
                res(null, lignes);
            }
        });
    });
});

async function addEleve(eleve) {
    let len = await db.getData("/length");
    await db.push(`/eleves/${len}`,eleve);
    len++;
    await db.push("/length", len);
    return true;
}

async function getListElt(type) {
    if (type === "all" || type === "dl") {
        console.log("[FUNCTION] [getListElt] Parameter All has been passed");
        let prenom = []; let nom = []; let age = []; let classe = [];
        if (type === "dl") {
            prenom.push("Prénom :");
            nom.push("Nom :");
            age.push("Âge :");
            classe.push("Classe :");
        }
        let len = await db.getData("/length");
        for (let i = 0; i < len; i++) {
            prenom.push(await db.getData(`/eleves/${i}/prenom`));
            nom.push(await db.getData(`/eleves/${i}/nom`));
            age.push(await db.getData(`/eleves/${i}/age`));
            classe.push(await db.getData(`/eleves/${i}/classe`));
        }
        console.log("[FUNCTION] [getListElt] Data returned");
        return [prenom, nom, age, classe];
    } else {
        return("error");
    }
}

function convertToCSV(arr) {
    const array = [Object.keys(arr[0])].concat(arr)

    return array.map(it => {
        return Object.values(it).toString()
    }).join('\n')
}
