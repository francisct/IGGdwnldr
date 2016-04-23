//hide any alert that could prevent progression
window.alert = function alert(msg) {
	console.log('Hidden Alert ' + msg);
};
//let the shortener timer run out
setTimeout(function () {
	var megaLink = $('a[href*="mega"]').first();
	//otherwise it might not be a shortener link
	if (megaLink != undefined) {
		var json = $(megaLink).attr('href');

		chrome.runtime.sendMessage({
			action : 'openNewMegaLinkAction',
			megaLink : json
		}, function (text) {});
	}
}, 8000);
