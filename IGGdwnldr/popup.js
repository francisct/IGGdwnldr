// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//downloads contains multiple download. A download is a game downlad currently in progress 
//this is just an example of what the storage looks like
var download1 = {"name":"iggGame1", "numOfParts":20, "progression":0};
var download2 = {"name":"iggGame2", "numOfParts":20, "progression":0};
var downloads = [download1, download2];

var progress = 0;
var shortenerLinks = [];

var nextShortenerTabId;
var nextDownloadTabId;

var tabToClose;

document.addEventListener('DOMContentLoaded', function () {

	document.getElementById("download").addEventListener('click', click);

	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

		if (request.action == 'handleShortenerLinksAction') {
			console.log("calling handleShortenerLinks..");
			handleShortenerLinks(request, sender, sendResponse);
		} else if (request.action == 'openNewDownloadLinkAction') {
			console.log("calling openNewDownloadLink..");
			openNewDownloadLink(request, sender, sendResponse);
		} else if (request.action == 'closeDownloadTabAction') {
			tabToClose = sender.tab.id;
		} else {
			alert("Action called from script undefined");
		}

	});

});

chrome.downloads.onCreated.addListener(function (downloadItem) {
	if (tabToClose != undefined) {
		console.log("calling closeDownloadTab..");
		chrome.tabs.remove(tabToClose, null);
	}
});

chrome.downloads.onChanged.addListener(function (downloadItem) {
	if (downloadItem.status == "complete") {
		progress++;
		if (progress <= shortenerLinks.length) {
			openNextShortenerLink();
		}
	}
});

chrome.tabs.onUpdated.addListener(function (tabId, info) {
	if (info.status == "complete") {

		//if shortener link: let the shortener timer run out. It is important to let the timer here in the background page because if there are any redirections we want to load the scripts afterward
		//if download link: mega loads some content dynamically and drive have some redirects, so let a few seconds to make sure everything is loaded properly
		setTimeout(function () {

			if (tabId == nextShortenerTabId) {
				getDownloadLinkFromShortener(tabId);
			} else if (tabId == nextDownloadTabId) {
				startDownload(tabId);
			}

		}, 10000);
	}
});

function click(e) {
	console.log("click function called");
	chrome.tabs.executeScript(null, {
		file : 'thirdParty/jquery-2.2.3.min.js'
	}, function () {
		chrome.tabs.executeScript(null, {
			file : 'getShortenerLinks.js'
		});
	});

}

function handleShortenerLinks(request, sender, sendResponse) {
	shortenerLinks = JSON.parse(request.shortenerLinks);
	if (shortenerLinks != undefined && shortenerLinks.length > 0) {
		openNextShortenerLink();
	} else {
		alert("Shortener Links not found. Are you on an igg-games.com page?");
	}
}

function openNextShortenerLink() {

	var shortenerLink = shortenerLinks[progress];

	if (shortenerLink != undefined) {
		console.log("opening next shortener link");
		chrome.tabs.create({
			url : shortenerLink,
			active : false
		}, function (tab) {
			nextShortenerTabId = tab.id;
			//the rest is handled by chrome tab listener
		});
	}
}

function getDownloadLinkFromShortener(shortenerTabId) {
	chrome.tabs.executeScript(shortenerTabId, {
		file : 'thirdParty/jquery-2.2.3.min.js'
	}, function () {
		chrome.tabs.executeScript(shortenerTabId, {
			file : 'getDownloadLinkFromShortener.js'
		});
	});
}

function openNewDownloadLink(request, sender, sendResponse) {
	chrome.tabs.remove(sender.tab.id, null);
	console.log("open next download link");
	if (request.downloadLink != undefined) {

		chrome.tabs.create({
			url : request.downloadLink,
			active : false
		}, function (tab) {
			nextDownloadTabId = tab.id;
			//the rest is handled by chrome tab listener
		});
	} else {
		alert("Download link undefined. Shortener type might have changed.")
	}
}

function startDownload(downloadTabId) {

	chrome.tabs.executeScript(downloadTabId, {
		file : 'thirdParty/jquery-2.2.3.min.js'
	}, function () {
		chrome.tabs.executeScript(downloadTabId, {
			file : 'startDownload.js'
		});
	});

}
