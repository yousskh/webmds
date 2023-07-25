const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const JSONdb = require('simple-json-db');
const db = new JSONdb('public/data/eleves.json');
const fs = require('fs');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

io.on('connection', (socket) => {
    console.log("utilisateur connecté");
    socket.on("disconnect", () => {
        console.log('user disconnected');
    });
    socket.on("new-eleve", function (data, res) {
        if (addEleve(data)) {
            res(null);
        } else {
            let err = new Error("Erreur avec le serveur");
            err.name = "DataPullError";
            err.value = "Données non sauvegardées";
            res(err);
        }
    });
    socket.on("refresh-list", function (data, res) {
        let elist = getListElts();
        if (elist.length > 0) {
            res(null, elist);
        } else {
            let err = new Error("Erreur avec le serveur");
            err.name = "GetListError";
            err.value = "Impossible d'obtenir la liste du serveur";
            res(err);
        }
    });
    socket.on("downloadfile", function (data, res) {
        if (data === "csv") {
            console.log("received request for csv downloading");
            /* fs.readFile("public/data/eleves.json", (err, file) => {
                console.log("download initialized, file returned");
                res(null,);
            }); */
        } else {
            res("erreur assignement");
        }
    });
});

function addEleve(eleve) {
    let val = JSON.stringify(eleve).split("\"");
    db.set(db.get("length"), {"prenom": val[3], "nom": val[7], "age": val[11], "classe": val[15]})
    db.set("length", db.get("length") + 1);
    return true;
}

function getListElts() {
    let prenom = []; let nom = []; let age = []; let classe = [];
    let data = JSON.stringify(db).split("\"");
    for (let i= 3; i < data.length; i++) {
        switch (data[i-2]) {
            case "prenom":
                prenom.push(data[i]);
                break;
            case "nom":
                nom.push(data[i]);
                break;
            case "age":
                age.push(data[i]);
                break;
            case "classe":
                classe.push(data[i]);
                break;
        }
    }
    return [prenom, nom, age, classe];
}