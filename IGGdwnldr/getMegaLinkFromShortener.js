var megaLink = $('a[href*="mega.nz"]').first();
var json = $(megaLink).attr('href');

chrome.runtime.sendMessage({action:'openNewMegaLink', megaLink: json}, function(text){
	
});