//hide any alert that could prevent progression
window.alert = function alert(msg) {
	console.log('Hidden Alert ' + msg);
};

setTimeout(function () {

	var downloadButton;
	//check if google drive link or mega link:
	if (window.location.href.indexOf("google") >= 0) {
		downloadButton = $('#uc-download-link');
	} else if (window.location.href.indexOf("mega") >= 0) {
		downloadButton = $('.throught-browser');
	}
	//using [0] forces to use th real dom element
	downloadButton[0].click();

	chrome.runtime.sendMessage({
		action : 'closeDownloadTabAction'
	}, function (text) {});

}, 10000);
