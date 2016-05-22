// Copyright (c) 2016 Francis Cote-Tremblay

//GLOBALS and data functions*********************************************************

//this is used to create a typical download list element
function createDownloadLi(download) {
	return '<li>'
	 + '<input class="downloadSelector" type="checkbox" value="' + download.id + '">'
	 + '<span>Part</span>'
	 + '<span class="progress">' + download.progress + '</span>'
	 + '<span>of</span>'
	 + '<span class="numOfParts">' + download.shortenerLinks.length + '</span>'
	 + '<span>(</span>'
	 + '<span>' + download.status + '</span>'
	 + '<span>)</span>'
	 + '<span>:</span>'
	 + '<span class="gameName">' + download.gameName + '</span>'
	 + '</li>';
}

//END GLOBALS and data functions*********************************************************


//HANDLERS********************************************************

document.addEventListener('DOMContentLoaded', function () {
	buildDownloadList();
	document.getElementById("download").addEventListener('click', downloadOnClick);
	document.getElementById("resume").addEventListener('click', resumeOnClick);
	document.getElementById("pause").addEventListener('click', pauseOnClick);
	document.getElementById("delete").addEventListener('click', deleteOnClick);

});

//END HANDLERS********************************************************


function downloadOnClick(e) {
	chrome.runtime.getBackgroundPage(function (background) {

		console.log("click function called");
		if (background.downloads.current == undefined) {
			chrome.tabs.executeScript(null, {
				file : 'thirdParty/jquery-2.2.3.min.js'
			}, function () {
				chrome.tabs.executeScript(null, {
					file : 'getShortenerLinks.js'
				});
			});
		} else {
			alert("There is an ongoing download. Only one download at a time is allowed.");
		}
	});
}

function resumeOnClick(e) {

	chrome.runtime.getBackgroundPage(function (background) {

		if ($(".downloadSelector").size() > 1) {
			alert("Please select only one download to resume.");
		} else if (background.downloads.current == undefined) {
			$(".downloadSelector").each(function (index, element) {
				if ($(element).prop("checked")) {
					if (background.downloads[$(element).val()].status == "complete") {
						alert("Download is complete.")
					} else {
						background.downloads.current = $(element).val();
						background.downloads[$(element).val()].status = "downloading";
						background.openNextShortenerLink(background.downloads[background.downloads.current]);
					}
				}
			});
			background.persistDownloads();
		} else {
			alert("There is an ongoing download. Only one download at a time is allowed.");
		}
	});
}

function pauseOnClick(e) {
	chrome.runtime.getBackgroundPage(function (background) {
		background.pauseDownloads();
	});
}

function deleteOnClick(e) {
	chrome.runtime.getBackgroundPage(function (background) {
		$(".downloadSelector").each(function (index, element) {
			if ($(element).prop("checked")) {

				if (background.downloads.current == $(element).val()) {
					background.downloads.current = undefined;
				}
				delete background.downloads[$(element).val()];
			}
		});
		background.persistDownloads();
	});
}

function buildDownloadList() {
	chrome.runtime.getBackgroundPage(function (background) {
		$("#downloads").html("");

		for (var key in background.downloads) {
			if (background.downloads.hasOwnProperty(key) && background.downloads[key].id != undefined) {
				var newLi = createDownloadLi(background.downloads[key])
					$("#downloads").append(newLi);
			}
		}
	});
}
