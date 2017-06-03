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
    init(movie, slug) {
        var addPath;
            radarr.getPath().then(function(response) {addPath = response;});
        $('#description').html(movie.text[0].overview);
        if (movie.status == 200) {
            radarr.profilesById();
            radarrExt.popup.restoreSettings();
        }
        $('body').changepanel(movie.text[0]);

        if (slug !== "") {
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
                url: radarr.constructBaseUrl() + "/movies/" + slug
            });
            return false;
        });

        $('#btnAdd').on('click', function() {
            radarr.addMovie(
            movie.text[0],
                $('#profile').val(),
                $("#monitored").prop('checked'),
                $('#minAvail').val(),
                false,
                addPath
            );
        });

        $('#btnAddSearch').on('click', function() {
            radarr.addMovie(
                movie.text[0],
                $('#profile').val(),
                $("#monitored").prop('checked'),
                $('#minAvail').val(),
                true,
                addPath
              );
        });
    }

    info(text) {
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
                // test = $(result).find("seriesid")[0].textContent;
                // return test;
                resolve($(result).find("seriesid").text());

                // //console.log($(result).find("seriesid")[0].textContent);
                // return ($(result).find("seriesid")[0].textContent).toString();
                // // var tvdbid = $(result).find("seriesid")[0].textContent;
                // // return tvdbid;
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
                reject(Error("Server took too long to respond"));
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
            "images": [
                {
                    "coverType": "poster",
                    "url": null
                },
                {
                    "coverType": "banner",
                    "url": null
                }
            ],
            "tmdbid": movie.tmdbId,
            "rootFolderPath": folderPath,
            "monitored": monitored,
            "minimumAvailability": minAvail,
            "addOptions": {
                "searchForMovie": addSearch
            }
        };

        this.post("/api/movie", newMovie).then(function(response) {
            radarrExt.popup.saveSettings(monitored, qualityId, minAvail);
            $("#popup").stop(true).fadeTo('fast', 1);
            $('#serverResponse').text("Movie added to Radarr!");
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
                    // pulsarr.init(noMovie);
                    // $("#options").addClass("hidden");
                    // $("#btnBar").addClass("hidden");
                    // pulsarr.info(error);
                });
            }
        });
    }

    // lookupMovie(imdbid) {
    //     var existingSlug = this.isExistingMovie(imdbid);
    //     var lookup = this.get("/api/movies/lookup", "term=imdbid%3A%20" + imdbid);
    //     Promise.all([lookup, existingSlug]).then(function(response) {
    //         pulsarr.init(response[0], response[1]);
    //     }).catch(function(error) {
    //         pulsarr.init(noMovie);
    //         $("#options").addClass("hidden");
    //         $("#btnBar").addClass("hidden");
    //         pulsarr.info(error);
    //     });
    // }

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

    isExistingMovie(imdbid) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.get("/api/movie", "").then(function(response) {
                for (var i = 0; i < response.text.length; i++) {
                    if (imdbid === response.text[i].imdbId) {
                        resolve()(response.text[i].titleSlug);
                    }
                }
                resolve("");
            }).catch(function(error) {
                reject(error);
                // pulsarr.init(noMovie);
                // $("#options").addClass("hidden");
                // $("#btnAdd").addClass("hidden");
                // pulsarr.info(error);
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
            "images": [
                {
                    "coverType": "poster",
                    "url": null
                },
                {
                    "coverType": "banner",
                    "url": null
                }
            ],
            "tmdbid": movie.tmdbId,
            "rootFolderPath": folderPath,
            "monitored": monitored,
            "minimumAvailability": minAvail,
            "addOptions": {
                "searchForMovie": addSearch
            }
        };

        this.post("/api/movie", newMovie).then(function(response) {
            radarrExt.popup.saveSettings(monitored, qualityId, minAvail);
            $("#popup").stop(true).fadeTo('fast', 1);
            $('#serverResponse').text("Movie added to Radarr!");
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
                    // pulsarr.init(noMovie);
                    // $("#options").addClass("hidden");
                    // $("#btnBar").addClass("hidden");
                    // pulsarr.info(error);
                });
            }
        });
    }

    // lookupSeries(tvdbid) {
    //     var existingSlug = this.isExistingSeries(tvdbid);
    //     var lookup = this.get("/api/series/lookup", "term=tvdb%3A%20" + tvdbid);
    //     Promise.all([lookup, existingSlug]).then(function(response) {
    //         pulsarr.init(response[0], response[1]);
    //     }).catch(function(error) {
    //         pulsarr.init(noMovie);
    //         $("#options").addClass("hidden");
    //         $("#btnBar").addClass("hidden");
    //         pulsarr.info(error);
    //     });
    // }

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
                // pulsarr.init(noMovie);
                // $("#options").addClass("hidden");
                // $("#btnAdd").addClass("hidden");
                // pulsarr.info(error);
            });
        });
    }
}

function init() {
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
        var tvdbid = pulsarr.TvdbidFromImdbid(imdbid).then(function(response) {
            Promise.all([radarr.lookupMovie(imdbid), sonarr.lookupSeries(tvdbid)]).then(function(error) {
                window.alert(error);
                console.log(error);
            }).catch(function(response) {
                window.alert(response.type);
                console.log(response.type);
                        // pulsarr.init(noMovie);
                        // $("#options").addClass("hidden");
                        // $("#btnBar").addClass("hidden");
                        // pulsarr.info(error);
            });
        });
    } else if (pulsarr.isTvdb(url)) {
        sonarr.lookupSeries(pulsarr.extractTVDBID(url)).then(function(error) {
            window.alert(error);
            console.log(error);
        }).catch(function(response) {
            window.alert(response.type);
            console.log(response.type);
        });
    }


    //     if (pulsarr.isImdb(url)) {
    //         Promise.all([radarr.lookupMovie(pulsarr.extractIMDBID(url)), sonarr.lookupSeries(pulsarr.extractTVDBID(url))]).then(function(error) {
    //             window.alert(error);
    //         }).catch(function(response) {
    //             window.alert(response.type);
    //             // pulsarr.init(noMovie);
    //             // $("#options").addClass("hidden");
    //             // $("#btnBar").addClass("hidden");
    //             // pulsarr.info(error);
    //         });
    //     }
    //     // antipattern: catch is resolve case and then is reject case
    //     Promise.all([radarr.lookupMovie(pulsarr.extractIMDBID(url)), sonarr.lookupSeries(pulsarr.extractTVDBID(url))]).then(function(error) {
    //         window.alert(error);
    //     }).catch(function(response) {
    //         window.alert(response.type);
    //         // pulsarr.init(noMovie);
    //         // $("#options").addClass("hidden");
    //         // $("#btnBar").addClass("hidden");
    //         // pulsarr.info(error);
    //     });
    //     //sonarr.lookupSeries(pulsarr.extractTVDBID(url));

    $('#config').on('click', function() {
        chrome.runtime.openOptionsPage();
    });
});

jQuery.fn.changepanel = function(movie) {
    $('#image').attr("src", movie.images[0].url);
    $('#title').html(movie.title + "<span> (" + movie.year + ")</span>");
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

        restoreSettings: function() {
            if (localStorage.getItem("monitored") == "true") {
                $('#monitored').bootstrapToggle('on');
            } else {
                $('#monitored').bootstrapToggle('off');
            }

            if (localStorage.getItem("minAvail") !== null) $('#minAvail').val(localStorage.getItem("minAvail"));
        },
    },
};
