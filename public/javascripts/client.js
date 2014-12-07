var FrntView;
var PlanView;
var PlanView2;
var SideView;
var SideView2
var SectView;
var SectView2;

var data;
var keys;
var k = 0;


var datasets = new Object;
var md5sum;
var sltlSavedData = document.getElementById( 'sltlSavedData' );
var sql_textbox =  document.getElementById( 'sql_textbox' );
var sltlDeleteDims = document.getElementById( 'sltlDeleteDims' );

var sltBrushMode;

////////////////////////////////////////////////////////////////////////////////
function onSearchDims(e) {

  var key  = e.attributes.dimensionTitle.value;
  var kidx = FrntView.dimensions();
  var tidx = FrntView.dimensionTitles();

  var i = tidx.indexOf(key);
  var j = kidx.indexOf(i.toString());

  datasets[md5sum].k = i;
  renderSectView2(data,datasets[md5sum].k);
  return;
}
////////////////////////////////////////////////////////////////////////////////
function dimselect(e) {
  document.getElementsByClassName('label-selected')[0].setAttribute("class", "label");
  e.setAttribute("class", "label-selected");

  var kidx = FrntView.dimensions();

//    console.log('innerHTML is ',e.innerHTML);
  for (var i = 0; i < keys.length; i++) {
//    console.log('keys[kidx[i]] is ',keys[kidx[i]]);

    if (keys[kidx[i]] == e.innerHTML) {
        datasets[md5sum].k = i;
        renderSectView2(data,datasets[md5sum].k);
//        scatterplot(data, k);
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
function onDeleteDims(e) {

  var key  = e.attributes.dimensionTitle.value;

  var kidx = FrntView.dimensions();
  var tidx = FrntView.dimensionTitles();

  var i = tidx.indexOf(key);
  var j = kidx.indexOf(i.toString());

  if (j  < 0 ) return;
  if (i == datasets[md5sum].k ) {
      if ( datasets[md5sum].k == kidx.length -1) {
      datasets[md5sum].k = datasets[md5sum].k-1;
    } else {
      datasets[md5sum].k = datasets[md5sum].k+1;
    }
  }
  var del = j;

  PlanView2.deleteNode(key);

  // Rremove specified dimension
  FrntView.dimensions(FrntView.dimensions().filter(function(p,i) {
    return ( i != del );
  }));
  FrntView.render();
  FrntView.updateAxes();

  renderSectView(datasets[md5sum].frnt);

}
////////////////////////////////////////////////////////////////////////////////
function onResetDims(btn) {

  console.log('onResetDims');

  var kidx = FrntView.dimensions();
  var tidx = FrntView.dimensionTitles();

//    var del = kidx.indexOf(tidx.indexOf(key).toString());

  for (var i = 0; i < tidx.length; i++) {
    if (kidx.indexOf(i.toString()) == -1) {
      console.log(kidx[i]);
      kidx.push(i.toString());
    }
  }

  reRenderDataset(md5sum);

  return;

  delete datasets[md5sum];
  datasets[md5sum].selectedIds = undefined;
  runSQL(1);

}
////////////////////////////////////////////////////////////////////////////////
function onSelect(btn) {
  if ( datasets                     !== undefined &&
       datasets[md5sum]             !== undefined &&
       datasets[md5sum].selectedIds !== undefined) {    
    datasets[md5sum].selectedIds = undefined;
  }
  runSQL(1);
}
////////////////////////////////////////////////////////////////////////////////

function runAllAjaxSELECT(b) {
  var btn = document.getElementById( 'btnToggleUpdate' );

  switch(btn.innerHTML) {
      case "Auto Update":
          runSQL(0);
          break;
      case "Manual Update":
          btn.value = "dirty";
          btn.style.background='#FFFFCC';
          break;
      case "No Updates":
          break;
      default:
          break;
  }
}
////////////////////////////////////////////////////////////////////////////////
function testIfDatasetExists(md5sum) {
  return (md5sum in datasets)
}
////////////////////////////////////////////////////////////////////////////////
function initialiseDataset(md5sum,sql_orig) {
  var dataset = new Object;
  datasets[md5sum] = dataset;
  datasets[md5sum].sql_orig = sql_orig;

  s = sql_orig.replace(/\n\n*/g,' ').replace(/ *, */g,',').replace(/  */g,' ');
  cols = s.replace(/.*SELECT /,'').replace(/ FROM.*/,'').replace(/([, ])[^, ]* AS /,'$1').toLowerCase().split(',');

//  console.log(cols);

  //  The Dimension we are focused on
  datasets[md5sum].k = 0;

  var columns = {};

  // create the column list (with status)
  for (var i = 0; i < cols.length; i++) {
    columns[cols[i]] = 1;

  }

  datasets[md5sum].columns = columns;

  var i = (sltlSavedData.options[0].text == 'None') ? 0 : sltlSavedData.options.length;
  var idx = 1001 + i;

  sltlSavedData.options[i] = new Option(idx.toString().substr(1), md5sum);
  sltlSavedData.options[i].selected = true;

}
////////////////////////////////////////////////////////////////////////////////
function reRenderDataset(md5) {

  md5sum = md5;

  sql_textbox.value = datasets[md5sum].sql_orig;
//  populateSltlDeleteDims(md5sum);

  reRenderFrntView(md5sum);
  reRenderPlanView(md5sum);
  reRenderSideView(md5sum);
}
///////////////////////////////////////////////////////////////////////////////

function runSQL(b) {
  var btn = document.getElementById( 'btnSelect' );
  var onClick = btn.onClick; btn.onClick = '';
  var done = 0;

  var sql_orig = sql_textbox.value;

  var sql_text = sql_orig.replace(/\n\n*/g,' ').replace(/ *, */g,',').replace(/  */g,' ');

  md5sum = md5(sql_text);

//  console.log(md5sum);
  if ( ! testIfDatasetExists(md5sum)) {
//    console.log('new');
    initialiseDataset(md5sum, sql_orig);
    //TODO:SELECT NEW 
  } else {
//    console.log('old');
    reRenderDataset(md5sum);
  }


  if ( datasets[md5sum].selectedIds !== undefined && datasets[md5sum].selectedIds.length > 0 ) {    
    sql_text = sql_text.replace(/WHERE.*/,'WHERE ID IN (' + datasets[md5sum].selectedIds + ')');
  }

  if (document.getElementById('btnToggleMds').innerHTML == "MDS Calculate") {
    r_sidevw = 'r_sideview_a1';
  } else {
    r_sidevw = 'r_sideview_a2';
  }


  var sql = new Array();

  if ( b == 1) sql.push([renderFrntView,sql_text.replace(/(.*)/,"SELECT r_frntview_a('$1') AS D")]);
  sql.push([renderPlanView,sql_text.replace(/(.*)/,"SELECT r_planview_a('$1') AS D")]);
  sql.push([renderSideView,sql_text.replace(/(.*)/,"SELECT "+r_sidevw+"('$1') AS D")]);


  // Execute all SQL Queries in parrallel
  for (var n = 1; n <= sql.length; n++) {
    ajaxSELECT(n, sql[n-1][1], sql[n-1][0], function(err, res, cb1){ 
      done++;
      if (done >= sql.length) btn.onClick = onClick;
      if (err) return null;
      cb1(res);
    });
  }
 
}

////////////////////////////////////////////////////////////////////////////////
function ajaxSELECT(n, sql, cb1, cb2) {

 $.ajax({url:'/home.Ajax/?ACTION=SELECT'
      ,type:'POST'
      ,data: JSON.stringify({'SQL': sql })
      ,contentType: 'application/json; charset=utf-8'
      ,dataType: 'json'
      ,beforeSend: function () {
          $('#status'+n).html('<img class="select-status" src="../ajax-loader.gif" />').fadeIn(); // add a gif loader  
      }
      ,success: function (response) {
          $('#status'+n).html('<img class="select-status" src="../ajax-success.png" />').fadeIn();
          cb2(0,response,cb1);
      }
      ,error: function () {
          $('#status'+n).html('<img class="select-status" src="../ajax-failure.png" />').fadeIn();
          cb2(1,response,cb1);
      }
    });
}
////////////////////////////////////////////////////////////////////////////////
// Initialse the Parallel Coordinates Plot
function initFrntView() {

  FrntView = d3.parcoords()("#pcp")
    .margin({ top: 24, right: 4, bottom: 4, left: 4 })
    .ticks(4)
    .render()
    .reorderable();

  sltBrushMode = d3.select('#sltBrushMode')

  sltBrushMode.selectAll('option')
    .data(FrntView.brushModes())
    .enter()
      .append('option')
      .text(function(d) { return d; });

  sltBrushMode.on('change', function() {
    FrntView.brushMode(this.value);
    switch(this.value) {
    case 'None':
      d3.select("#pStrums").style("visibility", "hidden");
      d3.select("#lblPredicate").style("visibility", "visible");
      d3.select("#sltPredicate").style("visibility", "visible");
      d3.select("#btnReset").style("visibility", "visible");
//      d3.select("#lblPredicate").style("visibility", "hidden");
//      d3.select("#sltPredicate").style("visibility", "hidden");
//      d3.select("#btnReset").style("visibility", "hidden");
      break;
    case '2D-strums':
      d3.select("#pStrums").style("visibility", "visible");
      d3.select("#lblPredicate").style("visibility", "visible");
      d3.select("#sltPredicate").style("visibility", "visible");
      d3.select("#btnReset").style("visibility", "visible");
      break;
    case '1D-axes':
      d3.select("#pStrums").style("visibility", "hidden");
      d3.select("#lblPredicate").style("visibility", "visible");
      d3.select("#sltPredicate").style("visibility", "visible");
      d3.select("#btnReset").style("visibility", "visible");
      break;
    default:
      break;
    }
  });

  sltBrushMode.property('value', 'None');

  d3.select('#btnReset').on('click', function() {resetBrushes();});
  d3.select('#sltPredicate').on('change', function() {
    FrntView.brushPredicate(this.value);
  });

  $( '#pcp' ).on( 'strumsSelected', function( event, strumsSelected ) {
    datasets[md5sum].selectedIds = strumsSelected.ids;
    runAllAjaxSELECT(0);
    updateSideView(datasets[md5sum].selectedIds);
    updateSectView(datasets[md5sum].selectedIds);
  });

}
////////////////////////////////////////////////////////////////////////////////
function resetBrushes() {
  FrntView.brushReset();
  SideView2.brushReset();
  SectView2.brushReset();
}
////////////////////////////////////////////////////////////////////////////////
// Initialse the Multi Dimensional Scale of the data
function initSideView() {
  SideView = d3.multidscale()("#mds")
    .margin({ top: 4, right: 4, bottom: 0, left: 4 })
    .render();

  $( '#mds' ).on( 'idsSelected', function( event, idsSelected ) {
//    alert(sltBrushMode[0][0].value);

    if (sltBrushMode[0][0].value == 'None') {

      sltBrushMode.property('value', '2D-strums');
      FrntView.brushMode('2D-strums');
/*
      document.getElementById("sltBrushMode").onchange();
      var e = document.getElementById("sltBrushMode");
      e.childNodes[0];

      var val = '2D-strums';
      document.querySelector('#sltBrushMode [value="' + val + '"]').selected = true;
      var val = '2D-strums';  

      alert(val);

      $('sltBrushMode').each(function(){
         var $t = $(this);

        alert(val);
        if ($t.text() == val){            // method used is different
           alert(val);
           $t.prop('selected', true);
           return;
        }
      });


//      sltBrushMode.property('value', '1D-axes');
//      FrntView.brushMode('2D-strums');

//      $("#sltBrushMode").trigger("change");
//      document.getElementById("sltBrushMode").onchange();
*/

    }
    datasets[md5sum].selectedIds = idsSelected.ids;
    runAllAjaxSELECT(0);
    updateFrntView(datasets[md5sum].selectedIds);
    updateSectView(datasets[md5sum].selectedIds);
  });

}
////////////////////////////////////////////////////////////////////////////////
// Initialse the Multi Dimensional Scale of inverted global correlation coefficient(GCC)
function initPlanView() {
  PlanView = d3.forcedlayout()("#flo")
    .margin({ top: 4, right: 4, bottom: 0, left: 4 });
//    .render();
}
////////////////////////////////////////////////////////////////////////////////
// Initialse the Mutliple Scatter Plots
function initSectView() {
  SectView = d3.scatterplots()("#msp")
    .margin({ top: 4, right: 4, bottom: 4, left: 4 })
    .render();
}
////////////////////////////////////////////////////////////////////////////////
function renderFrntView(res) {
  datasets[md5sum].frnt = res;
  renderFrntViewNow(res);
}
////////////////////////////////////////////////////////////////////////////////
function reRenderFrntView(md5sum) {
  res = datasets[md5sum].frnt;
  renderFrntViewNow(res);
}
////////////////////////////////////////////////////////////////////////////////
function renderFrntViewNow(res) {

  keys = res.rows[0].d;
  data = res.rows[1].d;

  FrntView.removeAxes();
  FrntView.data(data)
         .dimensionTitles(keys)
         .reorderable()
         .autoscale();

  FrntView.render();
  FrntView.createAxes()
          .reorderable();

//  document.getElementsByClassName('label')[0].setAttribute("class", "label-selected");
  renderSectView(res);
}
////////////////////////////////////////////////////////////////////////////////
function renderSideView(res) {
  datasets[md5sum].side = res;
  renderSideViewNow(res);
}
////////////////////////////////////////////////////////////////////////////////
function reRenderSideView(md5sum) {
  res = datasets[md5sum].side;
  renderSideViewNow(res);
}
///////////////////////////////////////////////////////////////////////////////
function renderSideViewNow(res) {

  SideView2 = new multidscale(res.rows[0].d, res.rows[1].d);
  if (datasets[md5sum].selectedIds !== undefined) {
    updateSideView(datasets[md5sum].selectedIds);
  }
}
////////////////////////////////////////////////////////////////////////////////
function updateFrntView(ids) {
//  console.log(FrntView);
  FrntView.updateFrntView(ids);
}
////////////////////////////////////////////////////////////////////////////////
function updateSideView(ids) {
  SideView2.updateSideView(ids);
}
////////////////////////////////////////////////////////////////////////////////
function updateSectView(ids) {
  SectView2.updateSectView(ids);
}
////////////////////////////////////////////////////////////////////////////////
function renderPlanView(res) {
  datasets[md5sum].plan = res;
  renderPlanViewNow(res);
}
////////////////////////////////////////////////////////////////////////////////
function reRenderPlanView(md5sum) {
  res = datasets[md5sum].plan;
  renderPlanViewNow(res);
}
///////////////////////////////////////////////////////////////////////////////
function renderPlanViewNow(res) {
  PlanView2 = new forcedlayout(res.rows[1].d, res.rows[0].d);
  PlanView2.forcedlayoutRed();
}
///////////////////////////////////////////////////////////////////////////////
function renderSectView(res) {
  renderSectView2(res.rows[1].d,datasets[md5sum].k);
}
///////////////////////////////////////////////////////////////////////////////
function renderSectView2(data,k) {

  SectView2 = new scatterplot(data, k);
  if (datasets[md5sum].selectedIds !== undefined) {
    updateSectView(datasets[md5sum].selectedIds);
  }
}
////////////////////////////////////////////////////////////////////////////////
function onToggleMds(btn) {

  var btn1 = document.getElementById( 'btnToggleMds' );
  var btn2 = document.getElementById( 'btnToggleUpdate' );

  if (btn1.innerHTML == "MDS Calculate") {
    btn1.innerHTML = "MDS Preloaded";
    btn2.innerHTML = "No Updates";
    btn2.value = "clean"
    btn2.style.background='buttonface';
  } else {
    btn1.innerHTML = "MDS Calculate";
    btn2.innerHTML = "Manual Update";
    btn2.value = "clean"
    btn2.style.background='buttonface';
  }
}
////////////////////////////////////////////////////////////////////////////////
function onToggleUpdate(update) {

  var btn1 = document.getElementById( 'btnToggleMds' );
  var btn2 = document.getElementById( 'btnToggleUpdate' );

  if (btn1.innerHTML == "MDS Preloaded") {
    alert('No Database Updates Required in MDS Preloaded mode.');
    return;
  }

  if (btn2.innerHTML == "Auto Update") {
    btn2.innerHTML = "Manual Update";
  } else {
    if (btn2.value == "clean") {
      btn2.innerHTML = "Auto Update";
    } else {
      btn2.value = "clean"
      btn2.style.background='buttonface';
      runSQL(0);
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
function onRedraw(btn) {

  var md5sum = sltlSavedData.options[sltlSavedData.selectedIndex].value;
  reRenderDataset(md5sum);

}
////////////////////////////////////////////////////////////////////////////////
function onDownloadIDs() {

  if ( datasets                     !== undefined &&
       datasets[md5sum]             !== undefined &&
       datasets[md5sum].selectedIds !== undefined) {    

    var txt = 'Original SQL Query:\n';
    txt += datasets[md5sum].sql_orig + '\n\n';

    txt += 'Annotation:\n'; + '\n\n';
    txt += document.getElementById( 'ids_note' ).value + '\n\n';

    txt += 'Selected IDs:\n'; + '\n\n';
    txt += datasets[md5sum].selectedIds + '\n\n';

    var blob = new Blob([txt], {type: "text/plain;charset=utf-8"});

    var fname = "GraphLandscape" + getDateTime() + "_SelectedIDs.txt";

    saveAs(blob, fname);

  } else {
    alert('No IDs Selected');
  }

}
/*
////////////////////////////////////////////////////////////////////////////////
function binaryblob(){
  var byteString = atob(document.querySelector("canvas").toDataURL().replace(/^data:image\/(png|jpg);base64,/, ""));
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    var dataView = new DataView(ab);
  var blob = new Blob([dataView], {type: "image/png"});
  var DOMURL = self.URL || self.webkitURL || self;
  var newurl = DOMURL.createObjectURL(blob);
 
  var img = '<img src="'+newurl+'">'; 
  d3.select("#img").html(img);
}
////////////////////////////////////////////////////////////////////////////////

d3.select("#btnDownloadGraphs").on("click", function(){
  var html = d3.select("#pcp svg")
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

  //console.log(html);
  var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
  var img = '<img src="'+imgsrc+'">'; 
  d3.select("#svgdataurl").html(img);

  var canvas = document.querySelector("canvas"),
      context = canvas.getContext("2d");

  var image = new Image;
  image.src = imgsrc;
  image.onload = function() {
    context.drawImage(image, 0, 0);

    //save and serve it as an actual filename
    binaryblob();

    var a = document.createElement("a");
    a.download = "sample.png";
    a.href = canvas.toDataURL("image/png");

     var pngimg = '<img src="'+a.href+'">'; 
       d3.select("#pngdataurl").html(pngimg);

    a.click();
  };

});

////////////////////////////////////////////////////////////////////////////////
function onDownloadGraphs0() {
  var html = d3.select("#svgdata svg")
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

  console.log(html);
  var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
  var img = '<img src="'+imgsrc+'">'; 
  d3.select("#svgdataurl").html(img);

  var canvas = document.querySelector("canvas"),
      context = canvas.getContext("2d");

  var image = new Image;
  image.src = imgsrc;
  image.onload = function() {
    alert('foo');
    context.drawImage(image, 0, 0);

    //save and serve it as an actual filename
    binaryblob();

    var a = document.createElement("a");
    a.download = "sample.png";
    a.href = canvas.toDataURL("image/png");


     var pngimg = '<img src="'+a.href+'">'; 
       d3.select("#pngdataurl").html(pngimg);
    console.log(pngimg);

    a.click();
    };
}
*/
///////////////////////////////////////////////////////////////////////////////
/*
function onDownloadGraphs2() {

  d3.select("#save").on("click", function(){
    var html = d3.select("svg")
          .attr("version", 1.1)
          .attr("xmlns", "http://www.w3.org/2000/svg")
          .node().parentNode.innerHTML;
   
    //console.log(html);
    var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
    var img = '<img src="'+imgsrc+'">'; 
    d3.select("#svgdataurl").html(img);
   
   
    var canvas = document.querySelector("canvas"),
      context = canvas.getContext("2d");
   
    var image = new Image;
    image.src = imgsrc;
    image.onload = function() {
      context.drawImage(image, 0, 0);
   
      var canvasdata = canvas.toDataURL("image/png");
   
      var pngimg = '<img src="'+canvasdata+'">'; 
        d3.select("#pngdataurl").html(pngimg);
   
      var a = document.createElement("a");
      a.download = "sample.png";
      a.href = canvasdata;
      a.click();
    };
   
  });
}
////////////////////////////////////////////////////////////////////////////////
function onDownloadGraphs3() {

  var fname = "GraphLandscape" + getDateTime() + "_Graph.png";
  var svg = document.getElementById('flo').getElementsByTagName('svg')[0];


  console.log(svg);

  var html = d3.select("svg")
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

  console.log(html);

  var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
  var img = '<img src="'+imgsrc+'">'; 
  d3.select("#svgdataurl").html(img);

  return;

  var canvas  = e.getElementsByClassName('foreground')[0];
  var ctx = canvas.getContext("2d");

  canvas.toBlob(function(blob) {
      saveAs(blob, "pretty image.png");
  });

  return;


  var canvas = document.getElementById("canvas1"), ctx = canvas.getContext("2d");
  // draw to canvas...
  canvas.toBlob(function(blob) {
      saveAs(blob, "pretty image.png");
  });

  return;

  // draw to canvas...
  canvas1.toBlob(function(blob) {
      saveAs(blob, fname);
  });

  return;


  var canvas = document.createElement('canvas');
  canvas.height = e.getElementsByClassName('shadows')[0].height;
  canvas.width  = e.getElementsByClassName('shadows')[0].width;

  var DOMURL = window.URL || window.webkitURL || window;

  var ctx = canvas.getContext("2d");

//  var flo  = e.getElementsByClassName('forcedlayout')[0];

  var flo  = '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:40px">' +
             '<em>I</em> like' + 
             '<span style="color:white; text-shadow:0 0 2px blue;">' +
             'cheese</span>' +
           '</div>';

//  var data = '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="100%" height="100%">' + flo.parentNode.innerHTML + '</foreignObject></svg>';
  var data = '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="100%" height="100%">' + flo + '</foreignObject></svg>';
  console.log(data);

  var img = new Image();
  var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
  var url = DOMURL.createObjectURL(svg);


  img.onload = function () {
    ctx.drawImage(img, 0, 0);
    DOMURL.revokeObjectURL(url);
  }

  img.src = url;
  //ctx.drawImage(svg,0,0);

//  ctx.drawImage(e.getElementsByClassName('shadows')[0],0,0);
//ctx.drawImage(e.getElementsByClassName('marks')[0],0,0);
//ctx.drawImage(e.getElementsByClassName('foreground')[0],0,0);
//ctx.drawImage(e.getElementsByClassName('highlight')[0],0,0);

  // draw to canvas...
  canvas.toBlob(function(blob) {
      saveAs(blob, fname);
  });

}d3.select("svg")
*/

////////////////////////////////////////////////////////////////////////////////
window.onload = function(e){ 
  initFrntView();
  initPlanView();
  initSideView();
  initSectView();
}


////////////////////////////////////////////////////////////////////////////////


/*
canvas1 = document.getElementById('canvas1');
var ctx = canvas1.getContext('2d');

var data = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
           '<foreignObject width="100%" height="100%">' +
           '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:40px">' +
             '<em>I</em> like' + 
             '<span style="color:white; text-shadow:0 0 2px blue;">' +
             'cheese</span>' +
           '</div>' +
           '</foreignObject>' +
           '</svg>';

var DOMURL = window.URL || window.webkitURL || window;

var img = new Image();
var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
var url = DOMURL.createObjectURL(svg);
img.src = url;
var fname = "GraphLandscape" + getDateTime() + "_Graph.png";

img.onload = function () {
  ctx.drawImage(img, 0, 0);
  DOMURL.revokeObjectURL(url);

}

08 6444 4802

*/

/*


function getHTML (who, deep){
    if(!who || !who.tagName) return '';
    var txt, ax, el= document.createElement("div");
    el.appendChild(who.cloneNode(false));
    txt= el.innerHTML;
    if(deep){
        ax= txt.indexOf('>')+1;
        txt= txt.substring(0, ax)+who.innerHTML+ txt.substring(ax);
    }
    el= null;
    return txt;
}


function onDownloadGraphs() {

  var fname = "GraphLandscape" + getDateTime() + "_Graph.png";

//var svg = '<svg><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="green"></circle></svg>';

  var svg = getHTML(document.getElementById('flo').getElementsByTagName('svg')[0],true);
  console.log(svg);

  canvg('canvas', svg);

  var canvas = document.getElementById('canvas');

  // draw to canvas...
  canvas.toBlob(function(blob) {
      saveAs(blob, fname);
  });

  //load '../path/to/your.svg' in the canvas with id = 'canvas'
//  canvg('canvas', '../path/to/your.svg')

  //load a svg snippet in the canvas with id = 'drawingArea'
//  canvg(document.getElementById('drawingArea'), '<svg>...</svg>')

  //ignore mouse events and animation
//  canvg('canvas', 'file.svg', { ignoreMouse: true, ignoreAnimation: true }) 
}
*/
/*
var svgdata = document.getElementById("svgdata");

var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.height = 100;
svg.width = 100;
svg.innerHTML = '<circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />';

svgdata.appendChild(svg);
*/

  
