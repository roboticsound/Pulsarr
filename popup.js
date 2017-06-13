"use strict";
var pulsarr;
var radarr;
var sonarr;

const noMovie = {
    "status": 404,
    "text": [{
        "images": [{
            "coverType": "poster",
            "url": "/img/black-hole-poster.jpg"
        }],
        "overview": "Oh no! Pulsarr has colapsed into a black hole. Please check your configuration and that you are on a valid IMDB movie page (not TV series).",
        "title": "Black Hole",
        "year": 404
    }]
};

class Pulsarr {
    init(media) {
        var addPath;
        switch (media.type) {
            case "movie":
                $('#serverName').text("Add to Radarr");
                $("#optMonitored").removeClass("hidden");
                $("#optMinAvail").removeClass("hidden");
                $("#optProfile").removeClass("hidden");

                radarr.getPath().then(function(response) {addPath = response;});

                $('#description').html(media.movie.text[0].overview);
                if (media.movie.status == 200) {
                    radarr.profilesById();
                    if (localStorage.getItem("radarrSettings") !== null) radarr.restoreSettings();
                }
                $('body').changepanel(media.movie.text[0]);

                if (media.existingSlug !== "") {
                    $('#btnExists').removeClass('hidden');
                    $('#btnAdd').addClass('hidden');
                    $('#btnAddSearch').addClass('hidden');
                }

                $("#popup").stop(true).fadeTo('fast', 1);
                $("#popup").removeClass("unclickable");
                $("#options").removeClass("hidden");
                $("#buttons").removeClass("hidden");
                $(".spinner").remove();

                $('#btnExists').on('click', function() {
                    chrome.tabs.create({
                        url: radarr.constructBaseUrl() + "/movies/" + media.existingSlug
                    });
                    return false;
                });

                $('#btnAdd').on('click', function() {
                    radarr.addMovie(
                        media.movie.text[0],
                        $('#profile').val(),
                        $("#monitored").prop('checked'),
                        $('#minAvail').val(),
                        false,
                        addPath
                    );
                });

                $('#btnAddSearch').on('click', function() {
                    radarr.addMovie(
                        media.movie.text[0],
                        $('#profile').val(),
                        $("#monitored").prop('checked'),
                        $('#minAvail').val(),
                        true,
                        addPath
                      );
                });
            break;

            case "series":
                $('#serverName').text("Add to Sonarr");
                $("#optMonitored").removeClass("hidden");
                $("#optProfile").removeClass("hidden");
                $("#optSeriesType").removeClass("hidden");

                sonarr.getPath().then(function(response) {addPath = response;});

                $('#description').html(media.series.text[0].overview);
                if (media.series.status == 200) {
                    sonarr.profilesById();
                    if (localStorage.getItem("sonarrSettings") !== null) sonarr.restoreSettings();
                }
                $('body').changepanel(media.series.text[0]);

                if (media.existingSlug !== "") {
                    $('#btnExists').removeClass('hidden');
                    $('#btnAdd').addClass('hidden');
                    $('#btnAddSearch').addClass('hidden');
                }

                $("#popup").stop(true).fadeTo('fast', 1);
                $("#popup").removeClass("unclickable");
                $("#options").removeClass("hidden");
                $("#buttons").removeClass("hidden");
                $(".spinner").remove();

                $('#btnExists').on('click', function() {
                    chrome.tabs.create({
                        url: sonarr.constructBaseUrl() + "/series/" + media.existingSlug
                    });
                    return false;
                });

                $('#btnAdd').on('click', function() {
                    sonarr.addSeries(
                    media.series.text[0],
                        $('#profile').val(),
                        "standard",
                        $("#monitored").prop('checked'),
                        $('#minAvail').val(),
                        false,
                        addPath
                    );
                });

                $('#btnAddSearch').on('click', function() {
                    sonarr.addSeries(
                        media.series.text[0],
                        $('#profile').val(),
                        "standard",
                        $("#monitored").prop('checked'),
                        $('#minAvail').val(),
                        true,
                        addPath
                      );
                });
                break;

            default:
                pulsarr.init(noMovie);
        }
    }

    requestComplete() {
        $("#popup").fadeTo("fast", 1);
        $(".spinner").remove();
        $("#popup").removeClass("unclickable");
    }

    info(text) {
        pulsarr.requestComplete();
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
}

class Server {
    constructor (host, port, apikey, auth, user, password, rootpath) {
        var self = this;
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
    constructor() {
        super(
            JSON.parse(localStorage.getItem("radarrConfig")).host,
            JSON.parse(localStorage.getItem("radarrConfig")).port,
            JSON.parse(localStorage.getItem("radarrConfig")).apikey,
            JSON.parse(localStorage.getItem("radarrConfig")).auth,
            JSON.parse(localStorage.getItem("radarrConfig")).user,
            JSON.parse(localStorage.getItem("radarrConfig")).password,
            JSON.parse(localStorage.getItem("radarrConfig")).rootpath
        );
    }

    saveSettings(monitored, qualityId, minAvail) {
        var radarrSettings = {
            "monitored": monitored,
            "profile": qualityId,
            "minAvail": minAvail
        };
        localStorage.setItem("radarrSettings", JSON.stringify(radarrSettings));
    }

    restoreSettings() {
        var radarrSettings = JSON.parse(localStorage.getItem("radarrSettings"));
        if (radarrSettings.monitored == "true") {
            $('#monitored').bootstrapToggle('on');
        } else {
            $('#monitored').bootstrapToggle('off');
        }

        if (radarrSettings.minAvail !== null) $('#minAvail').val(radarrSettings.minAvail);
    }

    addMovie(movie, qualityId, monitored, minAvail, addSearch, folderPath) {
        $("#popup").toggleClass("unclickable");
        $("#popup").fadeTo("fast", 0.5);
        $("#serverResponse").removeClass("hidden");
        $("#serverResponse").spin('large');
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
            radarr.saveSettings(monitored, qualityId, minAvail);
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
        var radarrSettings = JSON.parse(localStorage.getItem("radarrSettings"));

        this.get("/api/profile", "").then(function(response) {
            var profiles = response.text;
            for (var i = 0; i < profiles.length; i++) {
                $('#profile')
                    .append($('<option>', { value: profiles[i].id })
                    .text(profiles[i].name));
            }
            if (radarrSettings.profile !== null && (radarrSettings.profile <= $('#profile').children('option').length)) {
                $('#profile').prop('selectedIndex', radarrSettings.profile - 1);
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
    constructor() {
        super(
            JSON.parse(localStorage.getItem("sonarrConfig")).host,
            JSON.parse(localStorage.getItem("sonarrConfig")).port,
            JSON.parse(localStorage.getItem("sonarrConfig")).apikey,
            JSON.parse(localStorage.getItem("sonarrConfig")).auth,
            JSON.parse(localStorage.getItem("sonarrConfig")).user,
            JSON.parse(localStorage.getItem("sonarrConfig")).password,
            JSON.parse(localStorage.getItem("sonarrConfig")).rootpath
        );
    }

    saveSettings(monitored, qualityId, minAvail) {
        var sonarrSettings = {
            "monitored": monitored,
            "profile": qualityId,
            // "minAvail": minAvail
        };
        localStorage.setItem("sonarrSettings", JSON.stringify(sonarrSettings));
    }

    restoreSettings() {
        var sonarrSettings = JSON.parse(localStorage.getItem("sonarrSettings"));
        if (sonarrSettings.monitored == "true") {
            $('#monitored').bootstrapToggle('on');
        } else {
            $('#monitored').bootstrapToggle('off');
        }

        // if (sonarrSettings.minAvail !== null) $('#minAvail').val(sonarrSettings.minAvail);
    }

    addSeries(series, qualityId, seriesType, monitored, addSearch, folderPath) {
        $("#popup").toggleClass("unclickable");
        $("#popup").fadeTo("fast", 0.5);
        $("#serverResponse").removeClass("hidden");
        $("#serverResponse").spin('large');
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
                "searchForMovie": addSearch
            }
        };

        this.post("/api/movie", newSeries).then(function(response) {
            radarrExt.popup.saveSettings(monitored, qualityId);
            $("#popup").stop(true).fadeTo('fast', 1);
            $('#serverResponse').text("Series added to Sonarr!");
            $("#serverResponse").removeClass("hidden");
            setTimeout(function() {
                window.close();
            }, 1500);
            $("#popup").removeClass("unclickable");
        }).catch(function(error) {
            $("#popup").stop(true).fadeTo('fast', 1);
            pulsarr.info(error);
            $("#popup").toggleClass("unclickable");
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
                $('#profile')
                    .append($('<option>', { value: profiles[i].id })
                    .text(profiles[i].name));
            }
            if (localStorage.getItem("profile") !== null && (localStorage.getItem("profile") <= $('#profile').children('option').length)) {
                $('#profile').prop('selectedIndex', localStorage.getItem("profile") - 1);
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
    $("#popup").fadeTo("fast", 0.5);
    $("#spin").spin('large');
    pulsarr = new Pulsarr();
    radarr = new RadarrServer();
    sonarr = new SonarrServer();
}

init();

getCurrentTabUrl(function(url) {
    // important note: catch and then are reversed in this section
    if (radarr.host === null || radarr.host === "") {
        chrome.runtime.openOptionsPage();
    } else if (pulsarr.isImdb(url)) {
        var imdbid = pulsarr.extractIMDBID(url);
        pulsarr.TvdbidFromImdbid(imdbid).then(function(response) {
            var tvdbid = response;
            Promise.all([radarr.lookupMovie(imdbid), sonarr.lookupSeries(tvdbid)]).then(function(error) {
                pulsarr.info(error);
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

    $('#config').on('click', function() {
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

var radarrExt = {

    popup: {

        saveSettings: function(monitored, qualityId, minAvail) {
            localStorage.setItem("monitored", monitored);
            localStorage.setItem("profile", qualityId);
            localStorage.setItem("minAvail", minAvail);
        },

        // restoreSettings: function() {
        //     if (localStorage.getItem("monitored") == "true") {
        //         $('#monitored').bootstrapToggle('on');
        //     } else {
        //         $('#monitored').bootstrapToggle('off');
        //     }
        //
        //     if (localStorage.getItem("minAvail") !== null) $('#minAvail').val(localStorage.getItem("minAvail"));
        // },
    },
};
