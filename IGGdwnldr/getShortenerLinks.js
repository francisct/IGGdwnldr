var DRIVE = 'b:contains("Link Google Drive")';
var MEGA = 'b:contains("Link Mega.co.nz")';

var getAnchors = function(selector){
	var div = $(selector).first().parent();
    var anchors = div.find('a');
	return anchors;
} 
 
var getLinks = function(anchors){
	var links = [];
     $.each(anchors, function(index, value){
		 links.push($(value).attr('href'));
	 });
	 return links;
}

//try if there exist google drive links first
var anchors = getAnchors(DRIVE);

//if there are no google drive links, use mega
if (anchors.size() < 1){
	anchors = getAnchors(MEGA);
}

var links = getLinks(anchors);
var json = JSON.stringify(links);

chrome.runtime.sendMessage({action: 'handleShortenerLinksAction', shortenerLinks: json}, function(text){
	
});