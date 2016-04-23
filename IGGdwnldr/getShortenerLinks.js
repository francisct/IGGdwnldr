 
var getLinks = function(anchors){
	var links = [];
     $.each(anchors, function(index, value){
		 links.push($(value).attr('href'));
	 });
	 return links;
}

var megaDiv = $('b:contains("Mega.co.nz")').first().parent();
var megaAnchors = megaDiv.find('a');

var links = getLinks(megaAnchors);
var json = JSON.stringify(links);

chrome.runtime.sendMessage({action: 'handleShortenerLinksAction', shortenerLinks: json}, function(text){
	
});