function multidscale(cols,data) {

var mdObj = new Object();

//console.log(data);

SideView.svg.selectAll(".multidscale").remove();


// define dimensions of graph
m = [4, 4, 4, 4]; // margins
w = SideView.width() - m[1] - m[3]; // width
h = SideView.height() - m[0] - m[2]; // height

// offsets
var offy = m[0]/2; //height + 150; // + (h + m[0] + m[2]);
var offx = m[1]/2; //100;


var width = w,
    size = h/4,
    padding = 4;

var xb = d3.scale.linear()
    .range([0, w]);

var yb = d3.scale.linear()
    .range([0, h]);


  xDom = d3.extent(data, function(d) { return parseFloat(d[1]); });
  yDom = d3.extent(data, function(d) { return parseFloat(d[2]); });

  xScale = d3.scale.linear()
            .domain(xDom)
            .range([0, w]);
  yScale = d3.scale.linear()
            .domain(yDom)
            .range([h, 0]);

  var brush = d3.svg.brush()
      .x(xScale)
      .y(yScale)
      .on("brushstart", brushstart)
      .on("brush", brushmove)
      .on("brushend", brushend);

  var iMap = function(d) {return d[0];};
  var xMap = function(d) {return xScale(parseFloat(d[1])); };
  var yMap = function(d) {return yScale(parseFloat(d[2])); };

  var graph = SideView.svg.append("svg:g")
      .attr("class",'multidscale')
      .attr("width", w)
      .attr("height", h)
      .attr("transform", "translate(" + offx + "," + offy + ")");

  graph.selectAll(".dot")
        .data(data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 1)
        .attr("mds_id", iMap)
        .attr("cx", xMap)
        .attr("cy", yMap);

  graph.call(brush);

  var brushCell;

  // Clear the previously-active brush, if any.
  function brushstart() {
    if (brushCell !== this) {
      d3.select(brushCell).call(brush.clear());
//      x.domain(xScale);
//      y.domain(ySacle);
      brushCell = this;
    }
  }

  // Highlight the selected circles.
  function brushmove() {
    var e = brush.extent();

    graph.selectAll("circle").classed("hidden", function(d) {
      bool = e[0][0] > d[1] || d[1] > e[1][0]
          || e[0][1] > d[2] || d[2] > e[1][1];
          
      return bool;
    });

  }

  // If the brush is empty, select all circles.
  function brushend() {


    if (brush.empty()) {
      brushReset();
    } else {

      li = graph.selectAll("circle:not(.hidden)");
      var ids = [];
      for (i = 0; i < li[0].length; i++) {
        ids[i] = li[0][i].getAttribute('mds_id'); 
      }
      $( this ).trigger( 'idsSelected', {
        ids: ids
      } );      
    }
  }


  d3.select(self.frameElement).style("height", h + "px");

function updateSideView(ids) {
    graph.selectAll("circle").classed("hidden", function(d) {
      return (ids.indexOf(d[0]) < 0);
    });

}

function brushReset() {
    graph.selectAll("circle").classed("hidden", false);
}

mdObj.updateSideView = updateSideView;
mdObj.brushReset = brushReset;
mdObj.graph = graph;

return mdObj;

}
