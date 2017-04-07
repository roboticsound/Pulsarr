"use strict";

var host = "";
var port = "";
var apikey = "";
var auth = false;
var user = "";
var password = "";

$('#chkAuth').on('change', function () {
	$('#optAuth').toggleClass('hidden');
	auth = !auth;
});


document.addEventListener('DOMContentLoaded', function() {
    restoreConfig();
    if (apikey == null) {
        $("#status").text("Before you can use Pulsarr, please enter the configuration from your Radarr server.");
    };
});

document.getElementById('save').addEventListener('click', function() {
    $("#popup").fadeTo("fast", 0.5);
    $("#spin").spin();
    $("#page *").prop('disabled', true);
    $("#save").toggleClass("unclickable");
    readInputs();
    var url = constructBaseUrl(host, port) + "/api/system/status";

    testApi(url).then(function(response) {
        saveConfig();
        $("#popup").stop(true).fadeTo('fast', 1);
        $("#spin").spin(false);
    }).catch(function(error) {
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
    if (auth){
    	user = document.getElementById('user').value.trim();
    	password = document.getElementById('password').value.trim();
    }
}

function constructBaseUrl(host, port) {
    if (port == "") {
        return httpHost(host);
    } else {
        return httpHost(host) + ":" + port;
    };
}


function testApi(url) {
    return new Promise(function(resolve, reject) {
        var http = new XMLHttpRequest();

        http.open("GET", url, true);
        if (auth) http.setRequestHeader("Authorization", "Basic " + btoa(user + ":" + password));
        http.setRequestHeader("X-Api-Key", apikey);

        http.onload = function() {
            if (this.status === 200) {
                resolve(http.statusText);
            } else {
                reject(Error(http.statusText));
            }
        };

        http.onerror = function() {
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
    localStorage.setItem("auth", auth);
    localStorage.setItem("user", user);
    localStorage.setItem("password", password);
  
    $("#status").text("Sucess! Configuration saved.");
    $("#page *").prop('disabled', false);
    $("#save").toggleClass("unclickable");
    setTimeout(function() {
        $("#status").text("");
        window.close();
    }, 1500);
}


function restoreConfig() {
    host = localStorage.getItem("host");
    port = localStorage.getItem("port");
    apikey = localStorage.getItem("apikey");
    auth = localStorage.getItem("auth") == "true";
    user = localStorage.getItem("user");
    password = localStorage.getItem("password");

    document.getElementById('host').value = host;
    document.getElementById('port').value = port;
    document.getElementById('radarrapikey').value = apikey;
    $('#chkAuth').prop('checked', auth);
    if (auth) $('#optAuth').removeClass('hidden');
    document.getElementById('user').value = user;
    document.getElementById('password').value = password;
    
}
