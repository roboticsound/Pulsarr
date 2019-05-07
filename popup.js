"use strict";
var pulsarr;
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
            "qualityProfileId": 1,
            "folderPath": ""
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
            "qualityProfileId": 1,
            "folderPath": ""
		}
	}
};
var radarr;
var sonarr;

const blackhole = {
    "type": "blackhole",
    "blackhole":{
        "status": 404,
        "text": [{
            "images": [{
                "coverType": "poster",
                "url": "/img/black-hole-poster.jpg"
            }],
            "overview": "Oh no! Pulsarr has colapsed into a black hole. Please check your configuration and that you are on a valid IMDB or TVDB page.",
            "title": "Black Hole",
            "year": 404
        }]
    }
};

class Pulsarr {
    async init(media) {
        var addPath = '';
        switch (media.type) {
            case "movie":
                $('#serverName').text("Add to Radarr");
                $('#logo').attr("src", "/img/icons/radarr/32.png");
                $('#logo').attr("title", "Open Radarr");
                $('#serverHome').attr("href", radarr.constructBaseUrl());
                $("#optSmConfig").removeClass("hidden");
                $("#optMonitored").removeClass("hidden");
                $("#optMinAvail").removeClass("hidden");
                $("#optProfile").removeClass("hidden");
                $("#optFolderPath").removeClass("hidden");
                $('#lblAdd').text("Add Movie");
                $("#btnBar").removeClass("hidden");

                $('#description').html(media.movie.text[0].overview);
                if (media.movie.status == 200) {
                    radarr.profilesById();
                    radarr.folderPathsByPath();
                    radarr.restoreSettings();
                }
                $('body').changepanel(media.movie.text[0]);

                if (media.existingSlug !== "") {
                    $("#optMonitored").addClass("hidden");
                    $("#optMinAvail").addClass("hidden");
                    $("#optProfile").addClass("hidden");
                    $("#optFolderPath").addClass("hidden");
                    $('#btnExists').removeClass('hidden');
                    $('#btnExists').prop('title', 'View in Radarr');
                    $('#btnAdd').addClass('hidden');
                    $('#btnAddSearch').addClass('hidden');
                }

                pulsarr.loaded();

                $('#btnExists').on('click', function() {
                    chrome.tabs.create({
                        url: radarr.constructBaseUrl() + "/movies/" + media.existingSlug
                    });
                    return false;
                });

                $('#btnAdd').on('click', function() {
                    radarr.addMovie(
                        media.movie.text[0],
                        $('#lstProfile').val(),
                        $('#monitored').prop('checked'),
                        $('#lstMinAvail').val(),
                        false,
                        $('#lstFolderPath').val() ? $('#lstFolderPath').val() : addPath
                    );
                });

                $('#btnAddSearch').on('click', function() {
                    radarr.addMovie(
                        media.movie.text[0],
                        $('#lstProfile').val(),
                        $('#monitored').prop('checked'),
                        $('#lstMinAvail').val(),
                        true,
                        $('#lstFolderPath').val() ? $('#lstFolderPath').val() : addPath
                    );
                });
            break;

            case "series":
                $('#serverName').text("Add to Sonarr");
                $('#logo').attr("src", "/img/icons/sonarr/32.png");
                $('#logo').attr("title", "Open Sonarr");
                $('#serverHome').attr("href", sonarr.constructBaseUrl());
                $("#optSmConfig").removeClass("hidden");
                $("#optMonitored").removeClass("hidden");
                $("#optProfile").removeClass("hidden");
                $("#optFolderPath").removeClass("hidden");
                $("#optSeriesType").removeClass("hidden");
                $('#lblAdd').text("Add Series");
                $("#btnBar").removeClass("hidden");

                $('#description').html(media.series.text[0].overview);
                if (media.series.status == 200) {
                    sonarr.profilesById();
                    sonarr.folderPathsByPath();
                    sonarr.restoreSettings();
                }
                $('body').changepanel(media.series.text[0]);

                if (media.existingSlug !== "") {
                    $("#optMonitored").addClass("hidden");
                    $("#optProfile").addClass("hidden");
                    $("#optFolderPath").addClass("hidden");
                    $("#optSeriesType").addClass("hidden");
                    $('#btnExists').removeClass('hidden');
                    $('#btnExists').prop('title', 'View in Sonarr');
                    $('#btnAdd').addClass('hidden');
                    $('#btnAddSearch').addClass('hidden');
                }

                pulsarr.loaded();

                $('#btnExists').on('click', function() {
                    chrome.tabs.create({
                        url: sonarr.constructBaseUrl() + "/series/" + media.existingSlug
                    });
                    return false;
                });

                $('#btnAdd').on('click', function() {
                    sonarr.addSeries(
                        media.series.text[0],
                        $('#lstProfile').val(),
                        $('#lstSeriesType').val(),
                        $('#monitored').prop('checked'),
                        false,
                        $('#lstFolderPath').val() ? $('#lstFolderPath').val() : addPath
                    );
                });

                $('#btnAddSearch').on('click', function() {
                    sonarr.addSeries(
                        media.series.text[0],
                        $('#lstProfile').val(),
                        $('#lstSeriesType').val(),
                        $('#monitored').prop('checked'),
                        true,
                        $('#lstFolderPath').val() ? $('#lstFolderPath').val() : addPath
                    );
                });
                break;

            default:
                $("#optLgConfig").removeClass("hidden");
                $('body').changepanel(media.blackhole.text[0]);
                $('#description').html(media.blackhole.text[0].overview);
        }
    }

    loading() {
        $("#popup").fadeTo("fast", 0.5);
        $("#spin").spin('large');
        $("#popup").addClass("unclickable");
    }

    loaded() {
        $("#popup").fadeTo("fast", 1);
        $(".spinner").remove();
        $("#popup").removeClass("unclickable");
    }

    info(text) {
        pulsarr.loaded();
        $('#serverResponse').text(text);
        $("#serverResponse").removeClass("hidden");
    }

    isImdb(url) {
        var regex = new RegExp("\/\/www\.imdb.com\/");
        return regex.test(url);
    }

    isSensCritique(url){
        var regex = new RegExp("\/\/www\.senscritique.com\/")
        return regex.test(url);
    }

    isTvdb(url) {
        var regex = new RegExp(".*thetvdb.com\/");
        return regex.test(url);
    }

	isTrakt(url) {
		var regex = new RegExp(".*trakt.tv\/");
		return regex.test(url);
	}
	
	isRotten(url) {
		var regex = new RegExp(".*rottentomatoes.com\/");
		return regex.test(url);
	}
	
	isTMB(url) {
		var regex = new RegExp(".*themoviedb.org\/");
		return regex.test(url);
	}

    extractIMDBID(url) {
        var regex = new RegExp("\/tt\\d{1,7}");
        var imdbid = regex.exec(url);

        return (imdbid) ? imdbid[0].slice(1, 10) : "";
    }

    extractTVDBID(url) {
        var regex = new RegExp("(&|\\?)(id|seriesid)=\\d{1,7}");
        var tvdbid = regex.exec(url);

        return (tvdbid) ? tvdbid[0].split("=")[1]:"";
    }

    async TvdbidFromImdbid(imdbid) {
		let result = await $.ajax({url: "http://thetvdb.com/api/GetSeriesByRemoteID.php?imdbid=" + imdbid, datatype: "xml"});

		return $(result).find("seriesid").text();
    }
	
	async ImdbidFromTitle(title,ismovie) {
		if (ismovie){
			var url = "http://www.imdb.com/find?s=tt&ttype=ft&ref_=fn_ft&q=" + title;
		} else {
			var url = "http://www.imdb.com/find?s=tt&&ttype=tv&ref_=fn_tv&q=" + title;
		}
        let result = await $.ajax({url: url, datatype: "xml"});
		var regex = new RegExp("\/tt\\d{1,7}");
		let imdbid = await regex.exec($(result).find(".result_text").find("a").attr("href"));

		return (imdbid) ? imdbid[0].slice(1, 10) : "";

	}
	
    saveSettings() {
        localStorage.setItem("pulsarrConfig", JSON.stringify(pulsarrConfig));
    }

    portConfigToV2() {
        pulsarrConfig.radarr.isEnabled = true;
    	pulsarrConfig.radarr.configuration.host = localStorage.getItem("host");
        localStorage.removeItem("host");
    	pulsarrConfig.radarr.configuration.port = localStorage.getItem("port");
        localStorage.removeItem("port");
    	pulsarrConfig.radarr.configuration.apikey = localStorage.getItem("apikey");
        localStorage.removeItem("apikey");
    	pulsarrConfig.radarr.configuration.isAuth = localStorage.getItem("auth") == "true";
        localStorage.removeItem("auth");
    	pulsarrConfig.radarr.configuration.auth.user = localStorage.getItem("user");
        localStorage.removeItem("user");
    	pulsarrConfig.radarr.configuration.auth.password = localStorage.getItem("password");
        localStorage.removeItem("password");
        localStorage.removeItem("moviePath");
        localStorage.setItem("pulsarrConfig", JSON.stringify(pulsarrConfig));
    }
}

class Server {
    constructor (name, host, port, apikey, auth, user, password) {
        var self = this;
        this.name = name;
    	this.host = host;
    	this.port = port;
    	this.apikey = apikey;
    	this.auth = auth;
    	this.user = user;
    	this.password = password;
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

    getPath() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.get("/api/rootfolder", "").then(function(response) {
                resolve(response.text[0].path);
            });
        });
    }

	get(endpoint, params) {
        var self = this;
		return new Promise(function(resolve, reject) {
			var http = new XMLHttpRequest();
			var url = self.constructBaseUrl() + endpoint + "?" + params;

			http.open("GET", url, true);
			if (self.auth === "true") http.setRequestHeader("Authorization", "Basic " + btoa(self.user + ":" + self.password));
			http.setRequestHeader("X-Api-Key", self.apikey);

			http.onload = function() {
				if (http.status === 200) {
					var results = {
						"text": JSON.parse(http.responseText),
						"status": http.status
					};
					resolve(results);
				} else {
				  switch (http.status) {
					case 401:
					  reject("Unauthorised! Please check your API key or server authentication.");
					  break;
					case 500:
					  reject("Failed fetch media info! Please check you are on a valid IMDB/TVDB movie or series page (not episode page).");
					  break;
					default:
					  reject(Error("(" + http.status + ")" + http.statusText));
				  }
				}
			};

            http.ontimeout = function(error) {
                reject(Error(self.name + " took too long to respond"));
            };

			http.onerror = function() {
				reject(Error("Network Error"));
			};

			http.send();
		});
	}

    post(endpoint, params) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var http = new XMLHttpRequest();
            var url = self.constructBaseUrl() + endpoint;

            http.open("POST", url, true);
            if (self.auth == "true") http.setRequestHeader("Authorization", "Basic " + btoa(self.user + ":" + self.password));
            http.setRequestHeader("X-Api-Key", self.apikey);

            http.onload = function() {
                if (http.status === 201) {
                    var results = {
                        "text": JSON.parse(http.responseText),
                        "status": http.status
                    };
                    resolve(results);
                } else {
                  switch (http.status) {
                    case 400:
                      reject("Failed to add movie! Please check it is not already in your collection.");
                      break;
                    case 401:
                      reject("Unauthorised! Please check your API key or server authentication.");
                      break;
                    default:
                      reject(Error("(" + http.status + ")" + http.statusText));
                  }
                }
            };

            http.ontimeout = function(error) {
                reject(Error("Server took too long to respond"));
            };

            http.onerror = function() {
                console.log(http);
                reject(Error("Network Error"));
            };

            http.send(JSON.stringify(params));
        });
    }
}

class RadarrServer extends Server {
    constructor(host, port, apikey, auth, user, password) {
        super(
            "Radarr",
            host,
            port,
            apikey,
            auth,
            user,
            password
        );
    }

    updatePreferences(monitored, qualityId, minAvail, folderPath) {
        pulsarrConfig.radarr.preferences.monitored = monitored;
        pulsarrConfig.radarr.preferences.qualityProfileId = qualityId;
        pulsarrConfig.radarr.preferences.minAvail = minAvail;
        pulsarrConfig.radarr.preferences.folderPath = folderPath;

        pulsarr.saveSettings();
    }

    restoreSettings() {
        if (pulsarrConfig.radarr.preferences.monitored) {
            $('#monitored').bootstrapToggle('on');
        } else {
            $('#monitored').bootstrapToggle('off');
        }

        $('#lstMinAvail').val(pulsarrConfig.radarr.preferences.minAvail);
    }

    addMovie(movie, qualityId, monitored, minAvail, addSearch, folderPath) {
        pulsarr.loading();
        var newMovie = {
            "title": movie.title,
            "year": movie.year,
            "qualityProfileId": qualityId,
            "titleSlug": movie.titleSlug,
            "images": movie.images,
            "tmdbid": movie.tmdbId,
            "rootFolderPath": folderPath,
            "monitored": monitored,
            "minimumAvailability": minAvail,
            "addOptions": {
                "searchForMovie": addSearch
            }
        };

        this.post("/api/movie", newMovie).then(function(response) {
            radarr.updatePreferences(monitored, qualityId, minAvail, folderPath);
            pulsarr.info("Movie added to Radarr!");
            setTimeout(function() {
                window.close();
            }, 1500);
        }).catch(function(error) {
            pulsarr.info(error);
        });
    }

    lookupMovie(imdbid) {
        var self = this;
        // antipattern: resolve acts as reject and vice versa
        return new Promise(function(resolve, reject) {
            if (imdbid === "") {
                resolve();
            } else {
                var existingSlug = self.isExistingMovie(imdbid);
                var lookup = self.get("/api/movie/lookup", "term=imdb%3A%20" + imdbid);
                Promise.all([lookup, existingSlug]).then(function(response) {
                    reject({"type": "movie", "movie": response[0], "existingSlug": response[1]});
                }).catch(function(error) {
                    resolve(error);
                });
            }
        });
    }

	async lookupMovieByTitleYear(title, year) {
		var self = this;
		var searchString = title + " " + year;
		searchString = encodeURI(searchString);
		// antipattern: resolve acts as reject and vice versa
		return new Promise(async function(resolve, reject) {
			if (title === "") {
				resolve();
			} else {
				var lookup = await self.get("/api/movie/lookup", "term=" + searchString)
				var existingSlug = await self.isExistingMovieByTitleSlug(lookup.text[0].titleSlug)
				if (lookup) {
					reject({"type": "movie", "movie": lookup, "existingSlug": existingSlug});
				} else {
					resolve(error);
				}
			};
		});
	}

    async profilesById() {
		try {
			let profiles = await this.get("/api/profile", "");

			for (let i = 0; i < profiles.text.length; i++) {
                $('#lstProfile')
                    .append($('<option>', { value: profiles.text[i].id })
                    .text(profiles.text[i].name));
            }
            if (pulsarrConfig.radarr.preferences.qualityProfileId <= $('#lstProfile').children('option').length) {
                $('#lstProfile').prop('selectedIndex', pulsarrConfig.radarr.preferences.qualityProfileId - 1);
            }
		} catch (err) {
			pulsarr.info("profilesById Failed! " + err);
		}
    }

    async folderPathsByPath() {
		try {
			let folderPaths = await this.get("/api/rootfolder", "")

			for (var i = 0; i < folderPaths.text.length; i++) {
                $('#lstFolderPath')
                    .append($('<option>', { value: folderPaths.text[i].path })
                    .text(folderPaths.text[i].path));
                if (pulsarrConfig.radarr.preferences.folderPath === folderPaths.text[i].path) {
                    $('#lstFolderPath').prop('selectedIndex', i);
                }
            }
		} catch (err) {
			pulsarr.info("folderPathsByPath Failed! " + err);
		}
    }

    isExistingMovie(imdbid) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.get("/api/movie", "").then(function(response) {
                for (var i = 0; i < response.text.length; i++) {
                    if (imdbid === response.text[i].imdbId) {
                        resolve(response.text[i].titleSlug);
                    }
                }
                resolve("");
            }).catch(function(error) {
                reject(error);
            });
        });
    }

	isExistingMovieByTitleSlug(titleSlug) {
		var self = this;
		return new Promise(function(resolve, reject) {
			self.get("/api/movie", "").then(function(response) {
				for (var i = 0; i < response.text.length; i++) {
					if (titleSlug === response.text[i].titleSlug) {
						resolve(response.text[i].titleSlug);
					}
				}
				resolve("");
			}).catch(function(error) {
				reject(error);
			});
		});
	}
}

class SonarrServer extends Server {
    constructor(host, port, apikey, auth, user, password) {
        super(
            "Sonarr",
            host,
            port,
            apikey,
            auth,
            user,
            password
        );
    }

    updatePreferences(monitored, qualityId, seriesType, folderPath) {
        pulsarrConfig.sonarr.preferences.monitored = monitored;
        pulsarrConfig.sonarr.preferences.qualityProfileId = qualityId;
        pulsarrConfig.sonarr.preferences.seriesType = seriesType;
        pulsarrConfig.sonarr.preferences.folderPath = folderPath;

        pulsarr.saveSettings();
    }

    restoreSettings() {
        if (pulsarrConfig.sonarr.preferences.monitored) {
            $('#monitored').bootstrapToggle('on');
        } else {
            $('#monitored').bootstrapToggle('off');
        }
        $('#lstSeriesType').val(pulsarrConfig.sonarr.preferences.seriesType);
    }

    addSeries(series, qualityId, seriesType, monitored, addSearch, folderPath) {
        pulsarr.loading();

        var newSeries = {
            "title": series.title,
            "year": series.year,
            "qualityProfileId": qualityId,
            "seriesType": seriesType,
            "titleSlug": series.titleSlug,
            "images": series.images,
            "tvdbId": series.tvdbId,
            "rootFolderPath": folderPath,
            "monitored": monitored,
            "addOptions": {
                "ignoreEpisodesWithFiles": false,
                "ignoreEpisodesWithoutFiles": false,
                "searchForMissingEpisodes": addSearch
            }
        };

        this.post("/api/series", newSeries).then(function(response) {
            sonarr.updatePreferences(monitored, qualityId, seriesType, folderPath);
            pulsarr.info("Series added to Sonarr!");
            setTimeout(function() {
                window.close();
            }, 1500);
        }).catch(function(error) {
            pulsarr.info(error);
        });
    }

    async lookupSeries(tvdbid) {
        var self = this;
        // antipattern: resolve acts as reject and vice versa
        return new Promise(function(resolve, reject) {
            if (tvdbid === "") {
                resolve();
            } else {
                var existingSlug = self.isExistingSeries(tvdbid);
                var lookup = self.get("/api/series/lookup", "term=tvdb%3A%20" + tvdbid);
                Promise.all([lookup, existingSlug]).then(function(response) {
                    reject({"type": "series", "series": response[0], "existingSlug": response[1]});
                }).catch(function(error) {
                    resolve(error);
                });
            }
        });
    }

	async lookupSeriesByTitleYear(title, year) {
		var self = this;
		var searchString = title + " " + year;
		searchString = encodeURI(searchString);
		// antipattern: resolve acts as reject and vice versa
		return new Promise(async function(resolve, reject) {
			if (title === "") {
				resolve();
			} else {
				var lookup = await self.get("/api/series/lookup", "term=" + searchString)
				var existingSlug = await self.isExistingSeriesByTitleSlug(lookup.text[0].titleSlug)
				if (lookup) {
					reject({"type": "series", "series": lookup, "existingSlug": existingSlug});
				} else {
					resolve(error);
				}
			};
		});
	}

    async profilesById() {
		try {
			let profiles = await this.get("/api/profile", "");

			for (var i = 0; i < profiles.text.length; i++) {
                $('#lstProfile')
                    .append($('<option>', { value: profiles.text[i].id })
                    .text(profiles.text[i].name));
            }
            if (pulsarrConfig.sonarr.preferences.qualityProfileId <= $('#lstProfile').children('option').length) {
                $('#lstProfile').prop('selectedIndex', pulsarrConfig.sonarr.preferences.qualityProfileId - 1);
            }
		} catch (err) {
			pulsarr.info("profilesById Failed! " + err);
		}
    }

    async folderPathsByPath() {
		try {
			let folderPaths = await this.get("/api/rootfolder", "");

            for (var i = 0; i < folderPaths.text.length; i++) {
                $('#lstFolderPath')
                    .append($('<option>', { value: folderPaths.text[i].path })
                    .text(folderPaths.text[i].path));
                if (pulsarrConfig.sonarr.preferences.folderPath === folderPaths.text[i].path) {
                    $('#lstFolderPath').prop('selectedIndex', i);
                }
            }
		} catch (err) {
			pulsarr.info("folderPathsByPath Failed! " + err);
		}
    }

    async isExistingSeries(tvdbid) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.get("/api/series", "").then(function(response) {
                for (var i = 0; i < response.text.length; i++) {
                    if (tvdbid == response.text[i].tvdbId) {
                        resolve(response.text[i].titleSlug);
                    }
                }
                resolve("");
            }).catch(function(error) {
                reject(error);
            });
        });
    }

	isExistingSeriesByTitleSlug(titleSlug) {
		var self = this;
		return new Promise(function(resolve, reject) {
			self.get("/api/series", "").then(function(response) {
				for (var i = 0; i < response.text.length; i++) {
					if (titleSlug === response.text[i].titleSlug) {
						resolve(response.text[i].titleSlug);
					}
				}
				resolve("");
			}).catch(function(error) {
				reject(error);
			});
		});
	}
}

function init() {
    pulsarr = new Pulsarr();
    pulsarr.loading();
    if (localStorage.getItem("host")) {
        pulsarr.portConfigToV2();
    }
    if (!localStorage.getItem("pulsarrConfig")) {
        chrome.runtime.openOptionsPage();
    }

    pulsarrConfig = JSON.parse(localStorage.getItem("pulsarrConfig"));

    // Cleanup of older config
    if (pulsarrConfig.radarr.configuration.rootpath !== undefined || pulsarrConfig.sonarr.configuration.rootpath !== undefined) {
        pulsarrConfig.radarr.configuration.rootpath = undefined;
        pulsarrConfig.sonarr.configuration.rootpath = undefined;
        localStorage.setItem("pulsarrConfig", JSON.stringify(pulsarrConfig));
    }

    if (pulsarrConfig.radarr.isEnabled) {
        radarr = new RadarrServer(
            pulsarrConfig.radarr.configuration.host,
            pulsarrConfig.radarr.configuration.port,
            pulsarrConfig.radarr.configuration.apikey,
            pulsarrConfig.radarr.configuration.isAuth,
            pulsarrConfig.radarr.configuration.auth.user,
            pulsarrConfig.radarr.configuration.auth.password
        );
    } else {
        radarr = new RadarrServer("","","",false,"","","");
    }

    if (pulsarrConfig.sonarr.isEnabled) {
        sonarr = new SonarrServer(
            pulsarrConfig.sonarr.configuration.host,
            pulsarrConfig.sonarr.configuration.port,
            pulsarrConfig.sonarr.configuration.apikey,
            pulsarrConfig.sonarr.configuration.isAuth,
            pulsarrConfig.sonarr.configuration.auth.user,
            pulsarrConfig.sonarr.configuration.auth.password
        );
    } else {
        sonarr = new SonarrServer("","","",false,"","","");
    }

    if (!(pulsarrConfig.radarr.isEnabled || pulsarrConfig.sonarr.isEnabled)) {
        chrome.runtime.openOptionsPage();
    }
}

function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];
        var url = tab.url;

        callback(url);
    });
}

let loadFromImdbUrl = async (url) => {
	try {
		let imdbid = pulsarr.extractIMDBID(url);
		let tvdbid = await pulsarr.TvdbidFromImdbid(imdbid);

		Promise.all([radarr.lookupMovie(imdbid), sonarr.lookupSeries(tvdbid)]).then(function(error) {
			if (pulsarrConfig.radarr.isEnabled && pulsarrConfig.sonarr.isEnabled) {
				pulsarr.info(error);
			} else if (pulsarrConfig.radarr.isEnabled && !pulsarrConfig.sonarr.isEnabled) {
				pulsarr.init(blackhole);
				$('#optLgConfig').removeClass("hidden");
				pulsarr.info("Unable to find movie. If this is a series, please configure a Sonarr server.");
			} else if (!pulsarrConfig.radarr.isEnabled && pulsarrConfig.sonarr.isEnabled) {
				pulsarr.init(blackhole);
				$('#optLgConfig').removeClass("hidden");
				pulsarr.info("Unable to find series. If this is a movie, please configure a Radarr server.");
			} else {
				chrome.runtime.openOptionsPage();
			}
		}).catch(function(response) {
			pulsarr.init(response);
		});
	} catch (err) {
		pulsarr.info(err);
	}
}

let loadFromTvdbUrl = async (url) => {
	try {
		let series = await sonarr.lookupSeries(pulsarr.extractTVDBID(url));

		if (series) {
			pulsarr.info(series);
		}
	} catch (err) {
		pulsarr.init(err);
	}
}

let loadFromTraktUrl = async (url) => {
	var regextv = new RegExp("trakt.tv\/shows\/");
	var regexmov = new RegExp("trakt.tv\/movies\/");
	if (regextv.test(url)) {
		$.ajax({
			url : url,
			success : function(result) {sonarr.lookupSeries(pulsarr.extractTVDBID(result)).then(function(error) {
				pulsarr.info(error);
			}).catch(function(response) {
				pulsarr.init(response);
			});}
		});
	} else if (regexmov.test(url)) {
		$.ajax({
			url : url,
			success : function(result) {radarr.lookupMovie(pulsarr.extractIMDBID(result)).then(function(error) {
				pulsarr.info(error);
			}).catch(function(response) {
				pulsarr.init(response);
			});}
		});
	} else {
		pulsarr.info("Could not find media. Are you on a valid TV Show or Movie page?");
	}
}

let loadFromRottenUrl = async (url) => {
	var regextv = new RegExp("rottentomatoes.com\/tv\/");
	var regexmov = new RegExp("rottentomatoes.com\/m\/");
	if (regextv.test(url)) {
		try {
			var title = url.split("/tv/")[1].split("/")[0].replace(/\_/g," ");
			let imdbid = await pulsarr.ImdbidFromTitle(title,0);
			let tvdbid = await pulsarr.TvdbidFromImdbid(imdbid);
			let series = await sonarr.lookupSeries(tvdbid);
			if (series) {
				pulsarr.info(series);
			}
		} catch (err) {
			pulsarr.init(err);
		}
	} else if (regexmov.test(url)) {
		try {
			let result = await $.ajax({url: url, datatype: "xml"});
			var title = $(result).find("#movie-title").text().trim();
			let imdbid = await pulsarr.ImdbidFromTitle(title,1);
			let movie = await radarr.lookupMovie(imdbid);
			if (movie) {
				pulsarr.info(movie);
			}
		} catch (err) {
			pulsarr.init(err);
		}
	} else {
		pulsarr.info("Could not find media. Are you on a valid TV Show or Movie page?");
	}
}

let loadFromTMBUrl = async (url) => {
	var regextv = new RegExp("themoviedb.org\/tv\/");
	var regexmov = new RegExp("themoviedb.org\/movie\/");
	if (regextv.test(url)) {
		try {
			let result = await $.ajax({url: url, datatype: "xml"});
			var title = $(result).find(".title").find("a").find("h2").text().trim();
			var date = $(result).find(".title").find(".release_date").text().trim();
			title = title + " " + date;
			let imdbid = await pulsarr.ImdbidFromTitle(title,0);
			let tvdbid = await pulsarr.TvdbidFromImdbid(imdbid);
			let series = await sonarr.lookupSeries(tvdbid);
			
			if (series) {
				pulsarr.info(series);
			}
		} catch (err) {
			pulsarr.init(err);
		}
	} else if (regexmov.test(url)) {
		try {
			let result = await $.ajax({url: url, datatype: "xml"});
			var title = $(result).find(".title").find("a").find("h2").text().trim();
			var date = $(result).find(".title").find(".release_date").text().trim();
			title = title + " " + date;
			let imdbid = await pulsarr.ImdbidFromTitle(title,1);
			let movie = await radarr.lookupMovie(imdbid);
			if (movie) {
				pulsarr.info(movie);
			}
		} catch (err) {
			pulsarr.init(err);
		}
	} else {
		pulsarr.info("Could not find media. Are you on a valid TV Show or Movie page?");
	}
}

let loadFromSensCritiqueUrl = async (url) => {
	var regextv = new RegExp("senscritique.com\/serie\/");
	var regexmov = new RegExp("senscritique.com\/film\/");
	if (regextv.test(url)) {
		try {
            let result = await $.ajax({url: url, datatype: "xml"});
			var title = $(result).find(".title").find("a").find("h2").text().trim();
			var date = $(result).find(".title").find(".release_date").text().trim();
			title = title + " " + date;
			let imdbid = await pulsarr.ImdbidFromTitle(title,0);
			let tvdbid = await pulsarr.TvdbidFromImdbid(imdbid);
			let series = await sonarr.lookupSeries(tvdbid);
			
			if (series) {
				pulsarr.info(series);
			}
		} catch (err) {
			pulsarr.init(err);
		}
	} else if (regexmov.test(url)) {
		try {
            let result = await $.ajax({url: url, datatype: "xml"});
            var title = $(result).find(".pvi-product-originaltitle").text().trim();
            
            if(title.trim() == '') {
                title = $(result).find(".pvi-product-title").text().trim();
            }
            // No use for date since senscritiques shows the french date and it may differ from the one on imdb (us date)
            var date = '';
			let imdbid = await pulsarr.ImdbidFromTitle(title,1);
			let movie = await radarr.lookupMovie(imdbid);
			if (movie) {
				pulsarr.info(movie);
			}
		} catch (err) {
			pulsarr.init(err);
		}
	} else {
		pulsarr.info("Could not find media. Are you on a valid TV Show or Movie page?");
	}
}

getCurrentTabUrl(async (url) => {
    if (pulsarr.isImdb(url)) {
		loadFromImdbUrl(url);
    } else if (pulsarr.isSensCritique(url)){
        loadFromSensCritiqueUrl(url);
    } else if (pulsarr.isTvdb(url)) {
		loadFromTvdbUrl(url);
	} else if (pulsarr.isTrakt(url)) {
		loadFromTraktUrl(url);
	} else if (pulsarr.isRotten(url)) {
		loadFromRottenUrl(url);
    } else if (pulsarr.isTMB(url)) {
		loadFromTMBUrl(url);
    } else {
        pulsarr.info("Pulsarr does not recognise this as a valid website. Please check if that you are on either IMDB or TVDB.");
    }

    $('#btmSmConfig').on('click', function() {
        chrome.runtime.openOptionsPage();
    });

    $('#btmLgConfig').on('click', function() {
        chrome.runtime.openOptionsPage();
    });
});

jQuery.fn.changepanel = function(media) {
    for (var i = 0; i < media.images.length; i++) {
        if (media.images[i].coverType === "poster") {
            $('#image').attr("src", media.images[i].url);
        }
    }
    $('#title').html(media.title + "<span> (" + media.year + ")</span>");
    $('#description').each(function() {
        var content = $(this).html(),
            char = 140;
        if (content.length > char) {
            var tmpmaincontent = content.substr(0, char);
            var last = tmpmaincontent.lastIndexOf(' ');
            var maincontent = content.substr(0, last);
            var pluscontent = content.substr(last, content.length - last);
            var html = maincontent + '<p class="more">' + pluscontent + '&nbsp;</p><button id="dotdotdot" class="dotbutton">(...)&nbsp;</button>';
            $(this).html(html);
        }
    });
    $("#dotdotdot").on('click', function() {
        var moreText = "(...)";
        var lessText = "(less)";
        var $this = $(this);
        $this.text($this.text() == lessText ? moreText : lessText);
        $(".more").slideToggle();
    });
};

init();

$("#btnAddSearch").on('mouseover', function() {
    $("#btnAdd").addClass('dualHover');
});

$("#btnAddSearch").on('mouseout', function() {
    $("#btnAdd").removeClass('dualHover');
});

jQuery(document).ready(function(){
    jQuery('.scrollbar-inner').scrollbar();
});
