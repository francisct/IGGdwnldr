//hide any alert that could prevent progression
window.alert = function alert(msg) {
	console.log('Hidden Alert ' + msg);
};

	//check for a google link first
	var downloadLink = $('a[href*="google"]').first();
	
	//if no googleLink are found, try to find mega links
	if (downloadLink.size() < 1) {
		downloadLink = $('a[href*="mega"]').first();
	}
	
	//check if undefined otherwise there might not be a shortener link
	if (downloadLink != undefined) {
		var json = $(downloadLink).attr('href');

		chrome.runtime.sendMessage({
			action : 'openNewDownloadLinkAction',
			downloadLink : json
		}, function (text) {});
	}
