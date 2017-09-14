"use strict";
var pulsarr;
var pulsarrConfig;
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
    init(media) {
        var addPath;
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
                $('#lblAdd').text("Add Movie");
                $("#btnBar").removeClass("hidden");

                radarr.getPath().then(function(response) {addPath = response;});

                $('#description').html(media.movie.text[0].overview);
                if (media.movie.status == 200) {
                    radarr.profilesById();
                    radarr.restoreSettings();
                }
                $('body').changepanel(media.movie.text[0]);

                if (media.existingSlug !== "") {
                    $("#optMonitored").addClass("hidden");
                    $("#optMinAvail").addClass("hidden");
                    $("#optProfile").addClass("hidden");
                    $('#btnExists').removeClass('hidden');
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
                        $("#monitored").prop('checked'),
                        $('#lstMinAvail').val(),
                        false,
                        addPath
                    );
                });

                $('#btnAddSearch').on('click', function() {
                    radarr.addMovie(
                        media.movie.text[0],
                        $('#lstProfile').val(),
                        $("#monitored").prop('checked'),
                        $('#lstMinAvail').val(),
                        true,
                        addPath
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
                $("#optSeriesType").removeClass("hidden");
                $('#lblAdd').text("Add Series");
                $("#btnBar").removeClass("hidden");

                sonarr.getPath().then(function(response) {addPath = response;});

                $('#description').html(media.series.text[0].overview);
                if (media.series.status == 200) {
                    sonarr.profilesById();
                    sonarr.restoreSettings();
                }
                $('body').changepanel(media.series.text[0]);

                if (media.existingSlug !== "") {
                    $("#optMonitored").addClass("hidden");
                    $("#optProfile").addClass("hidden");
                    $("#optSeriesType").addClass("hidden");
                    $('#btnExists').removeClass('hidden');
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
                        $("#monitored").prop('checked'),
                        false,
                        addPath
                    );
                });

                $('#btnAddSearch').on('click', function() {
                    sonarr.addSeries(
                        media.series.text[0],
                        $('#lstProfile').val(),
                        $('#lstSeriesType').val(),
                        $("#monitored").prop('checked'),
                        true,
                        addPath
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

    isTvdb(url) {
        var regex = new RegExp(".*thetvdb.com\/");

        return regex.test(url);
    }

    extractIMDBID(url) {
        var regex = new RegExp("\/tt\\d{1,7}\/");
        var imdbid = regex.exec(url);

        return (imdbid) ? imdbid[0].slice(1, 10) : "";
    }

    extractTVDBID(url) {
        var regex = new RegExp("\&id\=\\d{1,7}");
        var tvdbid = regex.exec(url);

        return (tvdbid) ? tvdbid[0].slice(4) : "";
    }

    TvdbidFromImdbid(imdbid) {
        return new Promise(function(resolve, reject) {
            $.ajax({url: "http://thetvdb.com/api/GetSeriesByRemoteID.php?imdbid=" + imdbid, datatype: "xml", success:function(result){
                resolve($(result).find("seriesid").text());
            }});
        });
    }

    saveSettings() {
        localStorage.setItem("pulsarrConfig", JSON.stringify(pulsarrConfig));
    }

}

class Server {
    constructor (name, host, port, apikey, auth, user, password, rootpath) {
        var self = this;
        this.name = name;
    	this.host = host;
    	this.port = port;
    	this.apikey = apikey;
    	this.auth = auth;
    	this.user = user;
    	this.password = password;
    	this.rootpath = rootpath;
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
            if (self.rootpath !== "") {
                resolve(self.rootpath);
            } else {
                self.get("/api/rootfolder", "").then(function(response) {
                    resolve(response.text[0].path);
                });
            }
        });
    }

	get(endpoint, params) {
        var self = this;
		return new Promise(function(resolve, reject) {
			var http = new XMLHttpRequest();
			var url = self.constructBaseUrl() + endpoint + "?" + params;

			http.open("GET", url, true);
            http.timeout = 15000;
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
					  reject("Failed to find movie! Please check you are on a valid IMDB movie page (not TV series).");
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
            http.timeout = 5000;
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
    constructor(host, port, apikey, auth, user, password, rootpath) {
        super(
            "Radarr",
            host,
            port,
            apikey,
            auth,
            user,
            password,
            rootpath
        );
    }

    updatePreferences(monitored, qualityId, minAvail) {
        pulsarrConfig.radarr.preferences.monitored = monitored;
        pulsarrConfig.radarr.preferences.qualityProfileId = qualityId;
        pulsarrConfig.radarr.preferences.minAvail = minAvail;

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
            radarr.updatePreferences(monitored, qualityId, minAvail);
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
                var lookup = self.get("/api/movies/lookup", "term=imdbid%3A%20" + imdbid);
                Promise.all([lookup, existingSlug]).then(function(response) {
                    reject({"type": "movie", "movie": response[0], "existingSlug": response[1]});
                }).catch(function(error) {
                    resolve(error);
                });
            }
        });
    }

    profilesById() {
        this.get("/api/profile", "").then(function(response) {
            var profiles = response.text;
            for (var i = 0; i < profiles.length; i++) {
                $('#lstProfile')
                    .append($('<option>', { value: profiles[i].id })
                    .text(profiles[i].name));
            }
            if (pulsarrConfig.radarr.preferences.qualityProfileId <= $('#lstProfile').children('option').length) {
                $('#lstProfile').prop('selectedIndex', pulsarrConfig.radarr.preferences.qualityProfileId - 1);
            }
        }).catch(function(error) {
            pulsarr.info("profilesById Failed! " + error);
        });
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
}

class SonarrServer extends Server {
    constructor(host, port, apikey, auth, user, password, rootpath) {
        super(
            "Sonarr",
            host,
            port,
            apikey,
            auth,
            user,
            password,
            rootpath
        );
    }

    updatePreferences(monitored, qualityId, seriesType) {
        pulsarrConfig.sonarr.preferences.monitored = monitored;
        pulsarrConfig.sonarr.preferences.qualityProfileId = qualityId;
        pulsarrConfig.sonarr.preferences.seriesType = seriesType;

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
            sonarr.updatePreferences(monitored, qualityId, seriesType);
            pulsarr.info("Series added to Sonarr!");
            setTimeout(function() {
                window.close();
            }, 1500);
        }).catch(function(error) {
            pulsarr.info(error);
        });
    }

    lookupSeries(tvdbid) {
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

    profilesById() {
        this.get("/api/profile", "").then(function(response) {
            var profiles = response.text;
            for (var i = 0; i < profiles.length; i++) {
                $('#lstProfile')
                    .append($('<option>', { value: profiles[i].id })
                    .text(profiles[i].name));
            }
            if (pulsarrConfig.sonarr.preferences.qualityProfileId <= $('#lstProfile').children('option').length) {
                $('#lstProfile').prop('selectedIndex', pulsarrConfig.sonarr.preferences.qualityProfileId - 1);
            }
        }).catch(function(error) {
            pulsarr.info("profilesById Failed! " + error);
        });
    }

    isExistingSeries(tvdbid) {
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

}

function init() {
    pulsarr = new Pulsarr();
    pulsarr.loading();
    pulsarrConfig = JSON.parse(localStorage.getItem("pulsarrConfig"));

    if (pulsarrConfig.radarr.isEnabled) {
        radarr = new RadarrServer(
            pulsarrConfig.radarr.configuration.host,
            pulsarrConfig.radarr.configuration.port,
            pulsarrConfig.radarr.configuration.apikey,
            pulsarrConfig.radarr.configuration.isAuth,
            pulsarrConfig.radarr.configuration.auth.user,
            pulsarrConfig.radarr.configuration.auth.password,
            pulsarrConfig.radarr.configuration.rootpath
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
            pulsarrConfig.sonarr.configuration.auth.password,
            pulsarrConfig.sonarr.configuration.rootpath
        );
    } else {
        sonarr = new SonarrServer("","","",false,"","","");
    }

    if (!(pulsarrConfig.radarr.isEnabled || pulsarrConfig.sonarr.isEnabled)) {
        chrome.runtime.openOptionsPage();
    }
}

init();

getCurrentTabUrl(function(url) {
    // important note: catch and then are reversed in this section
    if (pulsarr.isImdb(url)) {
        var imdbid = pulsarr.extractIMDBID(url);
        pulsarr.TvdbidFromImdbid(imdbid).then(function(response) {
            var tvdbid = response;
            Promise.all([radarr.lookupMovie(imdbid), sonarr.lookupSeries(tvdbid)]).then(function(error) {
                if (pulsarrConfig.radarr.isEnabled && pulsarrConfig.sonarr.isEnabled) {
                    pulsarr.info(error);
                } else if (pulsarrConfig.radarr.isEnabled && !pulsarrConfig.sonarr.isEnabled) {
                    pulsarr.info("Unable to find movie. If this is a series, please configure a Sonarr server.");
                } else if (!pulsarrConfig.radarr.isEnabled && pulsarrConfig.sonarr.isEnabled) {
                    pulsarr.init(blackhole);
                    pulsarr.info("Unable to find series. If this is a movie, please configure a Radarr server.");
                } else {
                    chrome.runtime.openOptionsPage();
                }
            }).catch(function(response) {
                pulsarr.init(response);
            });
        });
    } else if (pulsarr.isTvdb(url)) {
        sonarr.lookupSeries(pulsarr.extractTVDBID(url)).then(function(error) {
            pulsarr.info(error);
        }).catch(function(response) {
            pulsarr.init(response);
        });
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

$("#btnAddSearch").on('mouseover', function() {
    $("#btnAdd").addClass('dualHover');
});

$("#btnAddSearch").on('mouseout', function() {
    $("#btnAdd").removeClass('dualHover');
});

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

jQuery(document).ready(function(){
    jQuery('.scrollbar-inner').scrollbar();
});
