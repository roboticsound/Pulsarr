"use strict";

function handlePageAction(tabInfo) {
  chrome.tabs.query({active:true,currentWindow:true},function(tabArray){
    if (tabArray[0].url.match(/\/\/www\.imdb.com\/.+\/tt\d{7}\//)) {
        chrome.pageAction.show(tabInfo.tabId);
    } else {
        chrome.pageAction.hide(tabInfo.tabId);
    }
  });
};

chrome.tabs.onActivated.addListener(handlePageAction);

chrome.webNavigation.onCommitted.addListener(handlePageAction);
