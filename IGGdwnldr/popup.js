// Copyright (c) 2016 Francis Cote-Tremblay

//GLOBALS *********************************************************

//downloads contains multiple download. A download is a game downlad currently in progress
//this is just an example of what the storage looks like

var currentDownload = {
	"id" : 1,
	"gameName" : "iggGame1",
	"progress" : 0,
	"shortenerLinks" : []
};

function updateCurrentDownload(id, gameName, progress, shortenerLinks) {
	currentDownload.id = id;
	currentDownload.gameName = gameName;
	currentDownload.progress = progress;
	currentDownload.shortenerLinks = shortenerLinks;
}

//this is an example of what a typical download list element should look like
function createDownloadLi(gameName, progress, numOfParts) {
	return '<li>'
	 + '<span class="progress">' + progress + '</span>'
	 + '<span class="numOfParts">' + numOfParts + '</span>'
	 + '<span class="gameName">' + gameName + '</span>'
	 + '</li>';
}

function getDownloads() {
	var downloads = {};

	chrome.storage.local.get('downloads', function (data) {
		downloads = data;
	});

	return downloads;
}

var nextShortenerTabId;
var nextDownloadTabId;

var tabToClose;

//END GLOBALS *********************************************************


//HANDLERS********************************************************

document.addEventListener('DOMContentLoaded', function () {

	document.getElementById("download").addEventListener('click', click);
	
	buildDownloadList();

	//message listeners are initialized here to prevent multiple instance of the listener to be instantiated
	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

		if (request.action == 'handleShortenerLinksAction') {
			console.log("calling handleShortenerLinks..");
			addNewDownload(request, sender, sendResponse);
			openNextShortenerLink(currentDownload);
		} else if (request.action == 'openNewDownloadLinkAction') {
			console.log("calling openNewDownloadLink..");
			openNewDownloadLink(request, sender, sendResponse);
		} else if (request.action == 'closeDownloadTabAction') {
			tabToClose = sender.tab.id;
		} else {
			alert("Action called from script undefined");
		}

	});

	chrome.downloads.onCreated.addListener(function (downloadItem) {
		if (tabToClose != undefined) {
			console.log("calling closeDownloadTab..");
			chrome.tabs.remove(tabToClose, null);
		}
	});

	chrome.downloads.onChanged.addListener(function (downloadItem) {
		if (downloadItem.status == "complete") {
			currentDownload.progress = currentDownload.progress + 1;
			persistDownload(currentDownload);
			if (currentDownload.progress <= currentDownload.shortenerLinks.length) {
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


});

//END HANDLERS********************************************************


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

function buildDownloadList() {

	var downloads = getDownloads();

	for (var key in downloads) {
		if (downloads.hasOwnProperty(key)) {
			$('#downloads').append(createDownloadLi(downloads[key].gameName, downloads[key].progress, downloads[key].shortenerLinks.length));
		}
	}
}

function persistDownload(download) {
	var downloads = getDownloads();
	downloads[download.id] = download;
	chrome.storage.local.set({
		downloads : downloads
	});
}

function addNewDownload(request, sender, sendResponse) {

	var downloads = getDownloads();

	updateCurrentDownload(Object.keys(downloads).length, request.gameName, 0, JSON.parse(request.shortenerLinks));
	persistDownload(currentDownload);
}

function openNextShortenerLink(download) {
	if (download.shortenerLinks != undefined && download.shortenerLinks.length > 0) {

		var shortenerLink = download.shortenerLinks[download.progress];

		if (shortenerLink != undefined) {
			console.log("opening next shortener link");
			chrome.tabs.create({
				url : shortenerLink,
				active : false
			}, function (tab) {
				nextShortenerTabId = tab.id;
				//the rest is handled by chrome tab listener
			});
		} else {
			alert("Shortener link in the shortener link list seems to be undefined. Website css selectors might have changed.");
		}

	} else {
		alert("Shortener Links not found. Are you on an igg-games.com page?");
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
