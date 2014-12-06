//	Just load the neccesary javascripts

function loadfile(filename, filetype){
 if (filetype=="js"){ //if filename is a external JavaScript file
  var fileref=document.createElement('script')
  fileref.setAttribute("type","text/javascript")
  fileref.setAttribute("src", filename + '?TS=' + Number(new Date()))
 }
 else if (filetype=="css"){ //if filename is an external CSS file
  var fileref=document.createElement("link")
  fileref.setAttribute("rel", "stylesheet")
  fileref.setAttribute("type", "text/css")
  fileref.setAttribute("href", filename + '?TS=' + Number(new Date()))
 }
 if (typeof fileref!="undefined")
  document.getElementsByTagName("head")[0].appendChild(fileref)
}


function loadfiles(){
	//	Load the utility javascripts
	loadfile("/javascripts/utility.js",'js');
//	loadfile("/cache/FileSaver.min.js",'js');
	loadfile("/cache/rgbcolor.js",'js');
	loadfile("/cache/StackBlur.js",'js');
	loadfile("/cache/canvg.js",'js');

	//	Load the site specific javascripts
//	loadfile("/javascripts/d3.parcoords.js",'js');
	loadfile("/javascripts/d3.parcoords.js",'js');
	loadfile("/javascripts/d3.forcedlayout.js",'js');
	loadfile("/javascripts/d3.scatterplots.js",'js');
	loadfile("/javascripts/d3.multidscale.js",'js');
	loadfile("/javascripts/d3.forcedlayout2.js",'js'); //horrible hack
	loadfile("/javascripts/d3.scatterplots2.js",'js'); //horrible hack
	loadfile("/javascripts/d3.multidscale2.js",'js'); //horrible hack

	//	Load the site specific stylesheets
	loadfile("/stylesheets/d3.parcoords.css",'css');
	loadfile("/stylesheets/d3.forcedlayout.css",'css');
	loadfile("/stylesheets/d3.scatterplots.css",'css');
	loadfile("/stylesheets/d3.multidscale.css",'css');

	//	Load the client script
	loadfile("/javascripts/client.js",'js');

}

loadfiles();