function forcedlayout(links2, nodes1) {

var force;
var fl;

var nodes = [],
    links = [];

var flObj = new Object() 

var links = links2;

//console.log(FrntView);

PlanView.svg.selectAll(".forcedlayout").remove();

// define dimensions of graph
var m = [20, 20, 20, 20]; // margins
var w = PlanView.width() - m[1] - m[3]; // width
var h = PlanView.height() - m[0] - m[2]; // height

// offset for y
var offy = m[0]/2; //height + 150; // + (h + m[0] + m[2]);
var offx = m[1]/2; //100;

// Set the range
var v = d3.scale.linear().range([0, 150]);

// Scale the range of the data
var max = d3.max(links, function(d) { return d[2]; });
//console.log('max:', max);

v.domain([0, max]);

// asign a type per value to encode op+acity
links.forEach(function(link) {
  link.pcp_path = 0;
  link.source = link[0];
  link.target = link[1];
  link.value  = link[2] * link[2] * link[2];
//  console.log('link:', link[0], link[1], link[2]);

  link.type = "onezerozero";
  if (v(link.value) <= 25) {
    link.type = "twofive";
  } else if (v(link.value) <= 50 && v(link.value) > 25) {
    link.type = "fivezero";
  } else if (v(link.value) <= 75 && v(link.value) > 50) {
    link.type = "sevenfive";
  } else if (v(link.value) <= 100 && v(link.value) > 75) {
    link.type = "onezerozero";
  }
//  if ( link.pcp_path == 1 ) { link.type = link.type + '_p'; }
});

// Compute the distinct nodes from the links.
links.forEach(function(link) {
    link.source = nodes[link.source] || 
        (nodes[link.source] = {name: link.source});
    link.target = nodes[link.target] || 
        (nodes[link.target] = {name: link.target});
//    link.value = +link.value;
});


force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([w, h])
    .linkDistance(function(d) { return 80+v(max-d.value); })
    .charge(-10)
    .on("tick", tick)
    .start();

fl = PlanView.svg.append("svg:g")
        .attr("id",'forcedlayout')
        .attr("class",'forcedlayout')
        .attr("width", w)
        .attr("height", h)
        .attr("transform", "translate(" + offx + "," + offy + ")");

// build the arrow.
fl.append("svg:defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

// add the links and the arrows
var path = fl.append("svg:g").selectAll("path")
    .data(force.links())
  .enter().append("svg:path")
    .attr("name", function(d) { return d.source.name + ',' + d.target.name; })
    .attr("class", function(d) { return "link " + d.type; })
    .attr("marker-end", "url(#end)");



// define the links
var link = fl.selectAll(".link");

// define the nodes
var node = fl.selectAll(".node")
    .data(force.nodes())
  .enter().append("g")
    .attr("class", "node")
    .attr("dimensionTitle",function(d) { return d.name; })
    .on("click", click)
    .on("dblclick", dblclick)
    .call(force.drag);

// add the nodes
node.append("circle")
    .attr("r", 5);

// add the text 
node.append("text")
    .attr("x", 12)
    .attr("dy", ".35em")
    .text(function(d) { return d.name; });

function deleteNode(key) {

    var kidx = FrntView.dimensions();
    var tidx = FrntView.dimensionTitles();
    var del = kidx.indexOf(tidx.indexOf(key).toString());

    //  Delete Links

    link[0].forEach(function(lnk) {
        st = lnk.attributes.name.value.split(',');
        if (st.indexOf(key) >= 0 ) {
            try {
                lnk.parentNode.removeChild(lnk);
            }
            catch(err) {
                console.log(err);
            }
            delete lnk;
        }
    });

    links.forEach(function(lnk) {
//      console.log(lnk.target.name,lnk.source.name);
      if (lnk.target.name == key || lnk.source.name == key ) {
        delete lnk;
      }
    });

    //  Delete Node

    var e = fl.selectAll(".node").filter(function(d){return ( d.name == key );})[0][0];
    e.parentNode.removeChild(e);
    delete nodes[key];

}

function start() {
  link = link.data(force.links(), function(d) { return d.source.id + "-" + d.target.id; });
  link.enter().insert("line", ".node").attr("class", "link");
  link.exit().remove();

  node = node.data(force.nodes(), function(d) { return d.id;});
  node.enter().append("circle").attr("class", function(d) { return "node " + d.id; }).attr("r", 8);
  node.exit().remove();

  force.start();
}

function linkArc(d) {
}

// add the straight lines
function tick() {
    //  Set the Boundries
    var r = 10;

    path.attr("d", function(d) {

        d.source.x = Math.max(r, Math.min(w - r, d.source.x));    
        d.source.y = Math.max(r, Math.min(h - r, d.source.y));    
        d.target.x = Math.max(r, Math.min(w - r, d.target.x));    
        d.target.y = Math.max(r, Math.min(h - r, d.target.y));    
        return "M" + 
                d.source.x + "," + 
                d.source.y + "L" + 
                d.target.x + "," + 
                d.target.y;
    });


    node.attr("cx", function(d) { return d.x = Math.max(r, Math.min(w - r, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(r, Math.min(h - r, d.y)); })
        .attr("transform", function(d) { 
        return "translate(" + d.x + "," + d.y + ")"; });

}

// action to take on mouse click
function click() {
    return;
    d3.select(this).select("text").transition()
        .duration(750)
        .attr("x", 22)
        .style("fill", "steelblue")
        .style("stroke", "lightsteelblue")
        .style("stroke-width", ".5px")
        .style("font", "20px sans-serif");
    d3.select(this).select("circle").transition()
        .duration(750)
        .attr("r", 16)
        .style("fill", "lightsteelblue");
}

// action to take on mouse double click
function dblclick() {
    return;
    d3.select(this).select("circle").transition()
        .duration(750)
        .attr("r", 6)
        .style("fill", "#ccc");
    d3.select(this).select("text").transition()
        .duration(750)
        .attr("x", 12)
        .style("stroke", "none")
        .style("fill", "black")
        .style("stroke", "none")
        .style("font", "10px sans-serif");
}

// Find the PCP path for the links.
function forcedlayoutRed() {

    if (FrntView.dimensionTitles() == undefined || FrntView.dimensionTitles().length == 0) return;

    var titles = FrntView.dimensionTitles();
    var keyidx = FrntView.dimensions();

    var pcp_path = [];  
    for ( var i = 0; i < keyidx.length-1; i++) {
        pcp_path[titles[keyidx[i+0]] + ',' + titles[keyidx[i+1]]] = 1;
        pcp_path[titles[keyidx[i+1]] + ',' + titles[keyidx[i+0]]] = 1;
    }


    li = document.getElementsByClassName('link');

    for (i = 0; i < li.length; i++) {
        li[i].className.baseVal = li[i].className.baseVal.replace(/_p$/,'');

        if( li[i].attributes.name.value in pcp_path ) {
            li[i].className.baseVal = li[i].className.baseVal + '_p';
  //          console.log('name:', li[i].attributes.name.value);
  //          console.log('class:', li[i].className.baseVal);
        }
    }

}


flObj.deleteNode = deleteNode;
flObj.forcedlayoutRed = forcedlayoutRed;

return flObj;

}


