
"use strict";

class Server {
	constructor (server) {
		var self = this;
		this.isEnabled = server.isEnabled;
		this.host = server.configuration.host;
		this.port = server.configuration.port;
		this.apikey = server.configuration.apikey;
		this.auth = server.configuration.isAuth;
		this.user = server.configuration.auth.user;
		this.password = server.configuration.auth.password;
	}

	constructBaseUrl() {
		var regex = new RegExp("https{0,1}:\/\/");

		if (!regex.exec(this.host)) {
			this.host = "http://" + this.host;
		}
		if (this.port === "") {
			return this.host;
		} else {
			return this.host + ":" + this.port;
		}
	}

	get(endpoint, params) {
		var self = this;
		return new Promise(function(resolve, reject) {
			var http = new XMLHttpRequest();
			var url = self.constructBaseUrl() + endpoint + "?" + params;

			http.open("GET", url, true);
			http.timeout = 5000;
			if (self.auth === "true") http.setRequestHeader("Authorization", "Basic " + btoa(self.user + ":" + self.password));
			http.setRequestHeader("X-Api-Key", self.apikey);

			http.onload = function() {
				if (http.status === 200) {
					var results = {
						"text": JSON.parse(http.responseText),
						"status": http.status
					};
					self.isEnabled = true;
					resolve(results);
				} else {
					switch (http.status) {
						case 401:
						self.isEnabled = false;
						reject(self.name + " Unauthorised! Please check your API key or server authentication.");
						break;
						case 500:
						self.isEnabled = false;
						reject("Failed to find movie or series! Please check you are on a valid IMDB page.");
						break;
						default:
						self.isEnabled = false;
						reject(Error("(" + http.status + ")" + http.statusText));
					}
				}
			};

			http.ontimeout = function(error) {
				self.isEnabled = false;
				reject(Error(self.name + " server took too long to respond. Please check configuration."));
			};

			http.onerror = function() {
				if (self.name === undefined) {
					self.isEnabled = false;
					reject(Error(self.name + " could not resolve host. Please check your configuration and network settings."));
				} else {
					self.isEnabled = false;
					reject(Error("Could not resolve " + self.name + " host. Please check your configuration and network settings."));
				}
			};

			http.send();
		});
	}
}

var pulsarrConfig = {
	"radarr": {
		"isEnabled": false,
		"configuration": {
			"host": "",
			"port": "",
			"apikey": "",
			"isAuth": false,
			"auth": {
				"user": "",
				"password": "",
			}
		},
		"preferences": {
			"monitored": true,
			"minAvail": "announced",
			"qualityProfileId": 1
		}
	},
	"sonarr": {
		"isEnabled": false,
		"configuration": {
			"host": "",
			"port": "",
			"apikey": "",
			"isAuth": false,
			"auth": {
				"user": "",
				"password": "",
			}
		},
		"preferences": {
			"monitored": true,
			"seriesType": "standard",
			"qualityProfileId": 1
		}
	}
};

var tooltips = [
	{title: "IP address or domain name of your Radarr server.", placement: "right", animation: true, delay: {show: 500, hide: 100}},
	{title: "Enable if your server requires basic http authentication.", placement: "right", animation: true, delay: {show: 500, hide: 100}},
	{title: "Port number that Radarr is accessible on. Radarr > Settings > General", placement: "right", animation: true, delay: {show: 500, hide: 100}},
	{title: "Radarr API Key. Radarr > Settings > General", placement: "right", animation: true, delay: {show: 500, hide: 100}},
	{title: "IP address or domain name of your Sonarr server.", placement: "right", animation: true, delay: {show: 500, hide: 100}},
	{title: "Enable if your server requires basic http authentication.", placement: "right", animation: true, delay: {show: 500, hide: 100}},
	{title: "Port number that Sonarr is accessible on. Sonarr > Settings > General", placement: "right", animation: true, delay: {show: 500, hide: 100}},
	{title: "Sonarr API Key. Sonarr > Settings > General", placement: "right", animation: true, delay: {show: 500, hide: 100}},
];

var radarrServer = new Server(pulsarrConfig.radarr);
var sonarrServer = new Server(pulsarrConfig.sonarr);

$('#radarrAuth').on('change', function () {
	$('#optRadarrAuth').toggleClass('hidden');
	radarrServer.auth = !radarrServer.auth;
});

$('#sonarrAuth').on('change', function () {
	$('#optSonarrAuth').toggleClass('hidden');
	sonarrServer.auth = !sonarrServer.auth;
});

$(document).ready(function(){
	restoreConfig();
	if (!(pulsarrConfig.radarr.isEnabled || pulsarrConfig.sonarr.isEnabled)) {
		$("#status").text("Before you can use Pulsarr, please configure at least one server.");
	}
	var tool_list = $('[data-toggle="tooltip"]');
	for(var i = 0; i < tool_list.length; i++){
		tool_list.eq(i).tooltip(tooltips[i]);
	}
});

$('#save').click(function() {
	$("#popup").fadeTo("fast", 0.5);
	$("#spin").spin();
	$("#page *").prop('disabled', true);
	$("#save").toggleClass("unclickable");
	readInputs();

	testConfig(radarrServer.host !== "", sonarrServer.host !== "");
});

function testConfig(radarr, sonarr) {
	if (radarr || sonarr) {
		var testServers = [];
		if (radarr) {testServers.push(radarrServer.get("/api/system/status"));}
		if (sonarr) {testServers.push(sonarrServer.get("/api/system/status"));}
		Promise.all(testServers).then(function(response) {
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
	} else {
		$("#status").text("Please configure at least one server!");
		$("#page *").prop('disabled', false);
		$("#save").toggleClass("unclickable");
		$("#popup").stop(true).fadeTo('fast', 1);
		$("#spin").spin(false);
	}
}

function readInputs() {
	radarrServer.host = document.getElementById('radarrHost').value.trim();
	radarrServer.port = document.getElementById('radarrPort').value.trim();
	radarrServer.apikey = document.getElementById('radarrApiKey').value.trim();
	if (radarrServer.auth){
		radarrServer.user = document.getElementById('radarrUser').value.trim();
		radarrServer.password = document.getElementById('radarrPassword').value.trim();
	}

	sonarrServer.host = document.getElementById('sonarrHost').value.trim();
	sonarrServer.port = document.getElementById('sonarrPort').value.trim();
	sonarrServer.apikey = document.getElementById('sonarrApiKey').value.trim();
	if (sonarrServer.auth){
		sonarrServer.user = document.getElementById('sonarrUser').value.trim();
		sonarrServer.password = document.getElementById('sonarrPassword').value.trim();
	}
}

function saveConfig() {
	pulsarrConfig.radarr.isEnabled = radarrServer.isEnabled;
	pulsarrConfig.radarr.configuration.host = radarrServer.host;
	pulsarrConfig.radarr.configuration.port = radarrServer.port;
	pulsarrConfig.radarr.configuration.apikey = radarrServer.apikey;
	pulsarrConfig.radarr.configuration.isAuth = radarrServer.auth;
	pulsarrConfig.radarr.configuration.auth.user = radarrServer.user;
	pulsarrConfig.radarr.configuration.auth.password = radarrServer.password;

	pulsarrConfig.sonarr.isEnabled = sonarrServer.isEnabled;
	pulsarrConfig.sonarr.configuration.host = sonarrServer.host;
	pulsarrConfig.sonarr.configuration.port = sonarrServer.port;
	pulsarrConfig.sonarr.configuration.apikey = sonarrServer.apikey;
	pulsarrConfig.sonarr.configuration.isAuth = sonarrServer.auth;
	pulsarrConfig.sonarr.configuration.auth.user = sonarrServer.user;
	pulsarrConfig.sonarr.configuration.auth.password = sonarrServer.password;

	localStorage.setItem("pulsarrConfig", JSON.stringify(pulsarrConfig));

	$("#status").text("Sucess! Configuration saved.");
	$("#page *").prop('disabled', false);
	$("#save").toggleClass("unclickable");
	setTimeout(function() {
		$("#status").text("");
		window.close();
	}, 1500);
}

function restoreConfig() {
	if (localStorage.getItem("pulsarrConfig")) {
		pulsarrConfig = JSON.parse(localStorage.getItem("pulsarrConfig"));
	}

	$('#radarrHost').val(pulsarrConfig.radarr.configuration.host);
	$('#radarrPort').val(pulsarrConfig.radarr.configuration.port);
	$('#radarrApiKey').val(pulsarrConfig.radarr.configuration.apikey);
	$('#radarrAuth').prop('checked', pulsarrConfig.radarr.configuration.isAuth);
	if (pulsarrConfig.radarr.configuration.isAuth) $('#optRadarrAuth').removeClass('hidden');
	$('#radarrUser').val(pulsarrConfig.radarr.configuration.auth.user);
	$('#radarrPassword').val(pulsarrConfig.radarr.configuration.auth.password);


	$('#sonarrHost').val(pulsarrConfig.sonarr.configuration.host);
	$('#sonarrPort').val(pulsarrConfig.sonarr.configuration.port);
	$('#sonarrApiKey').val(pulsarrConfig.sonarr.configuration.apikey);
	$('#sonarrAuth').prop('checked', pulsarrConfig.sonarr.configuration.isAuth);
	if (pulsarrConfig.sonarr.configuration.isAuth) $('#optSonarrAuth').removeClass('hidden');
	$('#sonarrUser').val(pulsarrConfig.sonarr.configuration.auth.user);
	$('#sonarrPassword').val(pulsarrConfig.sonarr.configuration.auth.password);
}
