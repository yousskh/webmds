let socket = io();

let moreListInfos = false;

preSettings()
function preSettings() {
    if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)) {
        document.getElementById("main-frame").style.display = "none";
        document.getElementById("use-error").style.display = "flex";
    } else {
        if (window.screen.height < 800) {
            document.getElementById("avertissement-div").style.display = "flex";
        }

    }

    socket.emit("checkStoreSettings", {}, function (err, responseData) {
        if (err) {
            alert(err);
        } else {
            if (responseData[0]) {
                if (responseData[1]) {
                    document.getElementById("listDetailsSwitch").click();
                }
                if (responseData[2]) {
                    document.getElementById("dvpMenu").click();
                }
                document.getElementById("storeSettings").click();
            }
        }
    });
}

setInterval(checkStatus, 3000);

function checkStatus() {
    document.getElementById("refreshServerLoad").style.display = "block";
    if (socket.connected) {
        document.getElementById("co-status-on").style.display = "flex";
        document.getElementById("co-status-off").style.display = "none";
    } else {
        document.getElementById("co-status-on").style.display = "none";
        document.getElementById("co-status-off").style.display = "flex";
    }
    setTimeout(() => {
        document.getElementById("refreshServerLoad").style.display = "none";
    }, 100);
}

const menus = document.querySelectorAll(".page-frame");
function hidePages() {
    for (let i = 0; i < menus.length; i++) {
            menus[i].style.display = "none"
    }
}

document.getElementById("b-inscriptions").addEventListener("click", function (){
    hidePages();
    document.getElementById("inscriptions").style.display = "flex"; });

document.getElementById("b-eleves").addEventListener("click", function (){
    hidePages();
    refreshElist();
    document.getElementById("eleves").style.display = "flex"; });

document.getElementById("b-params").addEventListener("click", function (){
    hidePages();
    document.getElementById("params").style.display = "flex"; });

document.getElementById("b-dvp").addEventListener("click", function (){
    hidePages();
    document.getElementById("dvp").style.display = "flex"; });


document.getElementById("download").addEventListener("click", function () {
    switch (document.getElementById("exportFormat").value) {
        case "csv":
            socket.emit("downloadfile", "csv", function(err){
                if (err) {
                    alert(err.value);
                } else {
                    downloadFile("/data/eleves.csv", "eleves.csv");
                }
            });
            break;
        case "json":
            downloadFile("/data/eleves.json", "eleves.json");
            break;
        default:
            alert("Merci de choisir un format d'exportation.");
    }
});


function downloadFile(url, name) {
    let downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = name;
    downloadLink.target = "_blank";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}


document.getElementById("add-eleve").addEventListener("click", function() {addEleve() });

function addEleve() {
    if (document.getElementById("result-msg") != null) {
        document.getElementById("result-msg").remove();
    }
    let prenom = document.getElementById("i-prenom").value;
    let nom = document.getElementById("i-nom").value;
    let age = document.getElementById("i-age").value;
    let classe = document.getElementById("i-classe").value;
    let div = document.getElementById("div-result-msg");
    let elt = document.createElement("h5");
    if (prenom.length < 1 || nom.length < 1 || age.length < 1 || classe.length < 1) {
        elt.textContent = "Erreur : au moins un champ est manquant.";
        elt.style.color = "red";
    } else {
        socket.emit("new-eleve", {prenom, nom, age, classe}, function(err){
            if (err) {
                elt.textContent = `Erreur serveur : ${err.value}`;
                elt.style.color = "red";
            } else {
                elt.textContent = `${prenom} ${nom} a été ajouté à la liste des élèves.`;
                elt.style.color = "green";
                document.getElementById("i-prenom").value = "";
                document.getElementById("i-nom").value = "";
                document.getElementById("i-age").value = "";
                document.getElementById("i-classe").value = "";
            }
        });
    }
    elt.id = "result-msg";
    div.appendChild(elt);
}

document.getElementById("refresh-elist").addEventListener("click", function() {
    document.getElementById("sync-ok").style.display = "none";
    document.getElementById("sync-icon").style.display = "block";
    refreshElist();
});

function refreshElist() {
    let div = document.getElementById("elist");
    div.innerHTML = "";
    socket.emit("refresh-list", {}, function(err, responseData) {
        if (err || socket.connected === false) {
            document.getElementById("aucun-apercu").textContent = err.value;
            document.getElementById("aucun-apercu").style.color = "red";
        } else {
            for (let i = 0; i < responseData[0].length; i++) {
                let elt = document.createElement("h5");
                div.appendChild(elt);
                elt.id = `${i}`;
                elt.className = "eleveListElt";
                if (moreListInfos) {
                elt.textContent = responseData[0][i]+" "+responseData[1][i]+" | "+responseData[2][i]+" ans | Classe : "+responseData[3][i];
                } else {
                    elt.textContent = responseData[0][i]+" "+responseData[1][i]
                }
            }
            addElevesEvent(responseData);
            setTimeout(() => {
                document.getElementById("sync-icon").style.display = "none";
                document.getElementById("sync-ok").style.display = "block";
            }, 100)
        }
    });
}

function addElevesEvent(data) {
    let elevesButtons = document.querySelectorAll(".eleveListElt")
    for (let i = 0; i < elevesButtons.length; i++) {
        elevesButtons[i].addEventListener("click", function () {
            showEleveDetails(elevesButtons[i].id, data);
        });
    }
}
function showEleveDetails(id, data) {
    document.getElementById("aucun-apercu").style.display = "none";
    document.getElementById("div-apercu").style.display = "flex";
    document.getElementById("a-prenom").style.color = "#3c4043";
    document.getElementById("a-nom").style.color = "#3c4043";
    document.getElementById("a-age").style.color = "#3c4043";
    document.getElementById("a-classe").style.color = "#3c4043";
    document.getElementById("a-prenom").textContent = `Prénom : ${data[0][id]}`;
    document.getElementById("a-nom").textContent = `Nom : ${data[1][id]}`;
    document.getElementById("a-age").textContent = `Âge : ${data[2][id]}`;
    document.getElementById("a-classe").textContent = `Classe : ${data[3][id]}`;
    document.getElementById("a-id").textContent = `ID : ${id}`;
}

document.getElementById("listDetailsSwitch").addEventListener("click", function() {
    moreListInfos = document.getElementById("listDetailsSwitch").checked
});

document.getElementById("dvpMenu").addEventListener("click", function() {
    if (document.getElementById("dvpMenu").checked === true) {
        document.getElementById("b-dvp").style.display = "block";
    } else {
        document.getElementById("b-dvp").style.display = "none";
    }
});

document.getElementById("storeSettings").addEventListener("click", function() {
    socket.emit("storeSettings",
        [document.getElementById("storeSettings").checked,
        document.getElementById("listDetailsSwitch").checked,
        document.getElementById("dvpMenu").checked],
        function (err) {
            if (err) {
                alert(err.value);
            }
    });
});

document.getElementById("checkDir").addEventListener("click", function() {
    socket.emit("checkDir", document.getElementById("fileDir").value,
        function (err) {
            if (err) {
                document.getElementById("fileDir").style.backgroundColor = "rgba(255, 0, 0, 0.2)";
            } else {
                document.getElementById("fileDir").style.backgroundColor = "rgba(0, 255, 0, 0.2)";
            }
    });
});

document.getElementById("insertPath").addEventListener("click", function() {
    document.getElementById("fileDir").value = document.getElementById("pathList").value;
});

document.getElementById("showFile").addEventListener("click", function() {
    socket.emit("readFile", document.getElementById("fileDir").value, function (err, responseData) {
        document.getElementById("dataLines").innerHTML = "";
        if (err) {
            alert(err.value);
        } else {
            for (let i = 0; i < responseData.length; i++) {
                const line = document.createElement("h5");
                line.id = `ligne${i}`;
                line.textContent = `${i.toLocaleString('fr', {minimumIntegerDigits: 3, useGrouping: false})} | ` + `${responseData[i]}`;
                document.getElementById("dataLines").appendChild(line);
            }
        }
    });
});

document.getElementById("editValueButton").addEventListener("click", function () {
    let editValueName = document.getElementById("editValueName").value;
    let editValue = document.getElementById("editValue").value;
    let id = document.getElementById("a-id").textContent.split(" ")[2];
    if (editValueName !== "" && editValue !== "") {
        socket.emit("changeValue", [id, editValueName, editValue], function(err) {
            if (err === null) {
                document.getElementById("a-" + editValueName).style.color = "orange";
            }
        });
    }
});

document.getElementById("newpage").addEventListener("click", function () {
        document.location.href = "index.html"
});