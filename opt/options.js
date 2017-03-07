var host = "";
var port = "";
var apikey = "";

document.addEventListener('DOMContentLoaded', function () {
    restoreConfig();
    if (apikey == null) {
        $("#status").text("Before you can use Pulsarr, please enter the configuration from your Radarr server.");
    };
});

document.getElementById('save').addEventListener('click', function () {
    $("#popup").fadeTo("fast", 0.5);
    $("#spin").spin();
    $("#page *").prop('disabled', true);
    $("#save").toggleClass("unclickable");
    readInputs();
    url = host + ":" + port + "/api/system/status";

    testApi(url).then(function (response) {
        saveConfig();
        $("#popup").stop(true).fadeTo('fast', 1);
        $("#spin").spin(false);
    }).catch(function (error) {
        $("#status").text(error);
        $("#page *").prop('disabled', false);
        $("#save").toggleClass("unclickable");
        $("#popup").stop(true).fadeTo('fast', 1);
        $("#spin").spin(false);
    });
});


function readInputs() {
    host = httpHost(document.getElementById('host').value.trim());
    port = document.getElementById('port').value.trim();
    apikey = document.getElementById('radarrapikey').value.trim();
}


function testApi(url) {
    return new Promise(function (resolve, reject) {
        var http = new XMLHttpRequest();

        http.open("GET", url, true);
        http.setRequestHeader("X-Api-Key", apikey);

        http.onload = function () {
            if (this.status === 200) {
                resolve(http.statusText);
            }
            else {
                reject(Error(http.statusText));
            }
        };

        http.onerror = function () {
            reject(Error("Unable to communicate with server. Please check host/port."));
        };

        http.send();

    });

}


function httpHost(string) {
    var regex = new RegExp("https{0,1}:\/\/");

    if (regex.exec(string)) {
        return string;
    } else {
        return "http://" + string;
    }
}


function saveConfig() {   
    localStorage.setItem("host", host);
    localStorage.setItem("port", port);
    localStorage.setItem("apikey", apikey);
    
    $("#status").text("Sucess! Configuration saved.");
    setTimeout(function () {
        $("#status").text("");
        window.close();
    }, 1500);
}
    

function restoreConfig() {
    host = localStorage.getItem("host");
    port = localStorage.getItem("port");
    apikey = localStorage.getItem("apikey");

    document.getElementById('host').value = host;
    document.getElementById('port').value = port;
    document.getElementById('radarrapikey').value = apikey;
}
