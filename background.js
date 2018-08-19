"use strict";

function handlePageAction(tabInfo) {
  chrome.tabs.query({active:true,currentWindow:true},function(tabArray){
    if (tabArray[0].url.match(/\/\/www\.imdb.com\/.+\/tt\d{7}\//) || tabArray[0].url.match(/.*allocine.fr\/(film|series)\//) || tabArray[0].url.match(/.*thetvdb.com\/.*id\=\d{1,7}/) || tabArray[0].url.match(/.*trakt.tv\/(shows|movies)\//) || tabArray[0].url.match(/.*rottentomatoes.com\/(tv|m)\//) || tabArray[0].url.match(/.*themoviedb.org\/(tv|movie)\//) ) {
        chrome.pageAction.show(tabInfo.tabId);
    } else {
        chrome.pageAction.hide(tabInfo.tabId);
    }
  });
}

chrome.tabs.onActivated.addListener(handlePageAction);

chrome.webNavigation.onCommitted.addListener(handlePageAction);
