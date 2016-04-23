//hide any alert that could prevent progression
window.alert = function alert(msg) {
	console.log('Hidden Alert ' + msg);
};
//mega loads some content dynamically, so let a few seconds to make sure everything is loaded properly
setTimeout(function () {
	var downloadButton = $('.throught-browser');
	downloadButton.click();
}, 8000);
