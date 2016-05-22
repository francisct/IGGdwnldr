// Copyright (c) 2016 Francis Cote-Tremblay

//GLOBALS and data functions*********************************************************

//downloads contains multiple download. A download is a game downlad currently in progress
//this is just an example of what the storage looks like
var downloadExample = {
	"id" : 1,
	"gameName" : "iggGame1",
	"progress" : 0,
	"status" : "downloading", //status can be either downloading or paused
	"shortenerLinks" : []
};

function persistDownloads() {
	chrome.storage.local.set({
		downloads : downloads
	}, function () {
		var views = chrome.extension.getViews({
				type : "popup"
			});
		if (views[0] != undefined) {
			views[0].buildDownloadList();
		}
	});
}

function addNewDownload(request, sender, sendResponse) {
	var nextId = Object.keys(downloads).length;
	downloads[nextId] = {
		id : nextId,
		gameName : request.gameName,
		progress : 0,
		status : "downloading",
		shortenerLinks : JSON.parse(request.shortenerLinks)
	};
	downloads.current = nextId;
	persistDownloads();
}

downloads = {};

var nextShortenerTabId;
var nextDownloadTabId;
var downloadInProgressId;
var tabToClose;
initStorage();

//END GLOBALS and data functions*********************************************************


//HANDLERS********************************************************


//message listeners are initialized here to prevent multiple instance of the listener to be instantiated
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

	if (request.action == 'handleShortenerLinksAction') {
		console.log("calling handleShortenerLinks..");
		addNewDownload(request, sender, sendResponse);
		openNextShortenerLink(downloads[downloads.current]);
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
		tabToClose = undefined;
	}
});

chrome.downloads.onChanged.addListener(function (downloadItem) {
	//if there is a filename, it means that the download was created
	if (downloadItem.filename != undefined && downloadItem.filename.current.indexOf("IGG")) {
		downloadInProgressId = downloadItem.id
			//if there is a state, it means that the download is either interrupted or complete
	} else if (downloadItem.state != undefined && downloadInProgressId == downloadItem.id) {

		if (downloadItem.state.current == "complete") {
			var currentId = downloads.current;

			downloads[currentId].progress = downloads[currentId].progress + 1;

			//if there are still other parts to download
			if (downloads[currentId].progress < downloads[currentId].shortenerLinks.length) {
				openNextShortenerLink(downloads[currentId]);
			} else {
				alert(downloads[currentId].gameName + " download is complete.");
				downloads[currentId].status = "complete";
				downloads.current = undefined;
			}

			persistDownloads();
		} else if (downloadItem.state.current == "interrupted") {
			//simulate pause button
			pauseDownloads();
			alert("Your download will be paused due to a download interruption.")
		}

	}
	//else the download is not from iggdwnldr
});

chrome.tabs.onUpdated.addListener(function (tabId, info) {
	if (info.status == "complete") {

		//if shortener link: let the shortener timer run out. It is important to let the timer here in the background page because if there are any redirections we want to load the scripts afterward
		//if download link: mega loads some content dynamically and drive have some redirects, so let a few seconds to make sure everything is loaded properly


		if (tabId == nextShortenerTabId) {
			setTimeout(function () {
				getDownloadLinkFromShortener(tabId);
			}, 10000);
		} else if (tabId == nextDownloadTabId) {
			setTimeout(function () {
				startDownload(tabId);
			}, 10000);
		}

	}
});

//END HANDLERS********************************************************


function initStorage() {
	chrome.storage.local.get('downloads', function (data) {
		downloads = data.downloads;

		if (downloads == undefined) {
			downloads = {};
		}
		var views = chrome.extension.getViews({
				type : "popup"
			});
		if (views[0] != undefined) {
			views[0].buildDownloadList();
		}
	});
}

function pauseDownloads() {
	for (var key in downloads) {
		if (downloads.hasOwnProperty(key) && downloads[key].id != undefined) {
			if (downloads[key].status != "complete") {
				downloads[key].status = "paused";
			}
		}
	}
	chrome.downloads.cancel(downloadInProgressId);
	chrome.tabs.remove([nextShortenerTabId, nextDownloadTabId, tabToClose]);
	downloads.current = undefined;
	persistDownloads();
}

function openNextShortenerLink(download) {
	if (download.shortenerLinks != undefined && download.shortenerLinks.length > 0 && download.status != "paused") {

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
	if (downloads[downloads.current].status != "paused") {
		chrome.tabs.executeScript(shortenerTabId, {
			file : 'thirdParty/jquery-2.2.3.min.js'
		}, function () {
			chrome.tabs.executeScript(shortenerTabId, {
				file : 'getDownloadLinkFromShortener.js'
			});
		});
	}
}

function openNewDownloadLink(request, sender, sendResponse) {
	chrome.tabs.remove(sender.tab.id, null);
	console.log("open next download link");
	if (request.downloadLink != undefined && downloads[downloads.current].status != "paused") {

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
	if (downloads[downloads.current].status != "paused") {
		chrome.tabs.executeScript(downloadTabId, {
			file : 'thirdParty/jquery-2.2.3.min.js'
		}, function () {
			chrome.tabs.executeScript(downloadTabId, {
				file : 'startDownload.js'
			});
		});
	}
}
