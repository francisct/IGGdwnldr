// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var progress = 0;
var shortenerLinks = [];
var nextShortenerLink;
var nextMegaLink;

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("download").addEventListener('click', click);
});

chrome.downloads.onCreated.addListener(function (downloadItem) {

	progress++;
	if (progress <= shortenerLinks.length) {
		openNextShortenerLink();
	}

});

chrome.tabs.onUpdated.addListener(function (tabId, info) {
	if (nextShortenerLink != undefined && tabId == nextShortenerLink.id && info.status == "complete") {
		getMegaLinkFromShortener(tabId);
	} else if (nextMegaLink != undefined && tabId == nextMegaLink.id && info.status == "complete") {
		startMegaDownload(tab);
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
	alert("salut");
	shortenerLinks = JSON.parse(request.shortenerLinks);
	if (shortenerLinks != undefined && shortenerLinks.length > 0) {
		openNextShortenerLink();
	}
}

function openNextShortenerLink() {

	var shortenerLink = shortenerLinks[progress];

	if (shortenerLink != undefined) {

		chrome.tabs.create({
			url : shortenerLink,
			active : false
		}, function (tab) {
			nextShortenerLink = tab;
		});

	}
}

function getMegaLinkFromShortener(shortenerTabId) {
	//let the shortener timer run out
	setTimeout(function () {
		chrome.tabs.executeScript(shortenerTabId, {
			file : 'thirdParty/jquery-2.2.3.min.js'
		}, function () {
			chrome.tabs.executeScript(shortenerTabId, {
				file : 'getMegaLinkFromShortener.js'
			});
		});
	}, 8000);
}

function openNewMegaLink(request, sender, sendResponse) {
	chrome.tabs.remove(sender.tab.id, null);
	if (request.megaLink != undefined) {

		chrome.tabs.create({
			url : request.megaLink,
			active : false
		}, function (tab) {
			nextMegaLink = tab;
		});
	}
}

function startMegaDownload(megaTab) {
	//mega loads some content dynamically, so let a few seconds to make sure everything is loaded properly
	setTimeout(function () {
		chrome.tabs.executeScript(megaTab.id, {
			file : 'thirdParty/jquery-2.2.3.min.js'
		}, function () {
			chrome.tabs.executeScript(megaTab.id, {
				file : 'startMegaDownload.js'
			});
		});
	}, 3000);

}
