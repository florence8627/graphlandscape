d3.scatterplots = function(config) {
  var __ = {
    data: [],
    dimensions: [],
    dimensionTitles: {},
    types: {},
    brushed: false,
    mode: "default",
    rate: 20,
    width: 600,
    height: 300,
    margin: { top: 24, right: 0, bottom: 12, left: 0 },
    color: "#069",
    composite: "source-over",
    alpha: 0.7
  };

  extend(__, config);

var sp = function(selection) {
  selection = sp.selection = d3.select(selection);

  __.width = selection[0][0].clientWidth;
  __.height = selection[0][0].clientHeight;

  // canvas data layers
  ["shadows", "marks", "foreground", "highlight"].forEach(function(layer) {
    canvas[layer] = selection
      .append("canvas")
      .attr("class", layer)[0][0];
    ctx[layer] = canvas[layer].getContext("2d");
  });

  // svg tick and brush layers
  sp.svg = selection
    .append("svg")
      .attr("width", __.width)
      .attr("height", __.height)
    .append("svg:g")
      .attr("transform", "translate(" + __.margin.left + "," + __.margin.top + ")");

  return sp;
};
var events = d3.dispatch.apply(this,["render", "resize", "highlight", "brush"].concat(d3.keys(__))),
    w = function() { return __.width - __.margin.right - __.margin.left; },
    h = function() { return __.height - __.margin.top - __.margin.bottom },
    flags = {
      brushable: false,
      reorderable: false,
      axes: false,
      interactive: false,
      shadows: false,
      debug: false
    },
    xscale = d3.scale.ordinal(),
    yscale = {},
    dragging = {},
    line = d3.svg.line(),
    axis = d3.svg.axis().orient("left").ticks(5),
    g, // groups for axes, brushes
    ctx = {},
    canvas = {};

// side effects for setters
var side_effects = d3.dispatch.apply(this,d3.keys(__))
  .on("composite", function(d) { ctx.foreground.globalCompositeOperation = d.value; })
  .on("alpha", function(d) { ctx.foreground.globalAlpha = d.value; })
  .on("width", function(d) { sp.resize(); })
  .on("height", function(d) { sp.resize(); })
  .on("margin", function(d) { sp.resize(); })
  .on("rate", function(d) { rqueue.rate(d.value); })
  .on("data", function(d) {
    if (flags.shadows) paths(__.data, ctx.shadows);
  })
  .on("dimensions", function(d) {
    xscale.domain(__.dimensions);
    if (flags.interactive) sp.render().updateAxes();
  });

// expose the state of the chart
sp.state = __;
sp.flags = flags;

// create getter/setters
getset(sp, __, events);

// expose events
d3.rebind(sp, events, "on");

// tick formatting
d3.rebind(sp, axis, "ticks", "orient", "tickValues", "tickSubdivide", "tickSize", "tickPadding", "tickFormat");

// getter/setter with event firing
function getset(obj,state,events)  {
  d3.keys(state).forEach(function(key) {
    obj[key] = function(x) {
      if (!arguments.length) return state[key];
      var old = state[key];
      state[key] = x;
      side_effects[key].call(sp,{"value": x, "previous": old});
      events[key].call(sp,{"value": x, "previous": old});
      return obj;
    };
  });
};

function extend(target, source) {
  for (key in source) {
    target[key] = source[key];
  }
  return target;
};
sp.autoscale = function() {
  // yscale
  var defaultScales = {
    "date": function(k) {
      return d3.time.scale()
        .domain(d3.extent(__.data, function(d) {
          return d[k] ? d[k].getTime() : null;
        }))
        .range([h()+1, 1])
    },
    "number": function(k) {
      return d3.scale.linear()
        .domain(d3.extent(__.data, function(d) { return +d[k]; }))
        .range([h()+1, 1])
    },
    "string": function(k) {
      return d3.scale.ordinal()
        .domain(__.data.map(function(p) { return p[k]; }))
        .rangePoints([h()+1, 1])
    }
  };

  __.dimensions.forEach(function(k) {
    yscale[k] = defaultScales[__.types[k]](k);
  });

  // hack to remove ordinal dimensions with many values
  sp.dimensions(sp.dimensions().filter(function(p,i) {
    var uniques = yscale[p].domain().length;
    if (__.types[p] == "string" && (uniques > 60 || uniques < 2)) {
      return false;
    }
    return true;
  }));

  // xscale
  xscale.rangePoints([0, w()], 1);

  // canvas sizes
  sp.selection.selectAll("canvas")
      .style("margin-top", __.margin.top + "px")
      .style("margin-left", __.margin.left + "px")
      .attr("width", w()+2)
      .attr("height", h()+2)

  // default styles, needs to be set when canvas width changes
  ctx.foreground.strokeStyle = __.color;
  ctx.foreground.lineWidth = 1.4;
  ctx.foreground.globalCompositeOperation = __.composite;
  ctx.foreground.globalAlpha = __.alpha;
  ctx.highlight.lineWidth = 3;
  ctx.shadows.strokeStyle = "#dadada";

  return this;
};
sp.detectDimensions = function() {
  sp.types(sp.detectDimensionTypes(__.data));
  sp.dimensions(d3.keys(sp.types()));
  return this;
};

// a better "typeof" from this post: http://stackoverflow.com/questions/7390426/better-way-to-get-type-of-a-javascript-variable
sp.toType = function(v) {
  return ({}).toString.call(v).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
};

// try to coerce to number before returning type
sp.toTypeCoerceNumbers = function(v) {
  if ((parseFloat(v) == v) && (v != null)) return "number";
  return sp.toType(v);
};

// attempt to determine types of each dimension based on first row of data
sp.detectDimensionTypes = function(data) {
  var types = {}
  d3.keys(data[0])
    .forEach(function(col) {
      types[col] = sp.toTypeCoerceNumbers(data[0][col]);
    });
  return types;
};
sp.render = function() {
  // try to autodetect dimensions and create scales
  if (!__.dimensions.length) sp.detectDimensions();
  if (!(__.dimensions[0] in yscale)) sp.autoscale();

  sp.render[__.mode]();

  events.render.call(this);
  return this;
};

sp.render.default = function() {
  sp.clear('foreground');
  if (__.brushed) {
    __.brushed.forEach(path_foreground);
  } else {
    __.data.forEach(path_foreground);
  }
};

var rqueue = d3.renderQueue(path_foreground)
  .rate(50)
  .clear(function() { sp.clear('foreground'); });

sp.render.queue = function() {
  if (__.brushed) {
    rqueue(__.brushed);
  } else {
    rqueue(__.data);
  }
};
sp.shadows = function() {
  flags.shadows = true;
  if (__.data.length > 0) paths(__.data, ctx.shadows);
  return this;
};

// draw little dots on the axis line where data intersects
sp.axisDots = function() {
  var ctx = sp.ctx.marks;
  ctx.globalAlpha = d3.min([1/Math.pow(data.length, 1/2), 1]);
  __.data.forEach(function(d) {
    __.dimensions.map(function(p,i) {
      ctx.fillRect(position(p)-0.75,yscale[p](d[p])-0.75,1.5,1.5);
    });
  });
  return this;
};

// draw single polyline
function color_path(d, ctx) {
  ctx.strokeStyle = d3.functor(__.color)(d);
  ctx.beginPath();
  __.dimensions.map(function(p,i) {
    if (i == 0) {
      ctx.moveTo(position(p),yscale[p](d[p]));
    } else {
      ctx.lineTo(position(p),yscale[p](d[p]));
    }
  });
  ctx.stroke();
};

// draw many polylines of the same color
function paths(data, ctx) {
  ctx.clearRect(-1,-1,w()+2,h()+2);
  ctx.beginPath();
  data.forEach(function(d) {
    __.dimensions.map(function(p,i) {
      if (i == 0) {
        ctx.moveTo(position(p),yscale[p](d[p]));
      } else {
        ctx.lineTo(position(p),yscale[p](d[p]));
      }
    });
  });
  ctx.stroke();
};

function path_foreground(d) {
  return color_path(d, ctx.foreground);
};

function path_highlight(d) {
  return color_path(d, ctx.highlight);
};
sp.clear = function(layer) {
  ctx[layer].clearRect(0,0,w()+2,h()+2);
  return this;
};
sp.createAxes = function() {
  if (g) sp.removeAxes();

  // Add a group element for each dimension.
  g = sp.svg.selectAll(".dimension")
      .data(__.dimensions, function(d) { return d; })
    .enter().append("svg:g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + xscale(d) + ")"; })

  // Add an axis and title.

   g.append("svg:g")
      .attr("class", "axis")
      .attr("transform", "translate(0,0)")
      .each(function(d) { d3.select(this).call(axis.scale(yscale[d])); })
    .append("svg:text")
      .attr({
        "text-anchor": "middle",
        "y": 0,
        "transform": "translate(0,-12)",
        "x": 0,
        "class": "label",
        "onclick": "dimselect(this);"
      })
      .text(function(d) {
        return d in __.dimensionTitles ? __.dimensionTitles[d] : d;  // dimension display names
      })

  flags.axes= true;
  return this;
};

sp.removeAxes = function() {
  g.remove();
  return this;
};

sp.updateAxes = function() {
  var g_data = sp.svg.selectAll(".dimension")
      .data(__.dimensions, function(d) { return d; })

  g_data.enter().append("svg:g")
      .attr("class", "dimension")
      .attr("transform", function(p) { return "translate(" + position(p) + ")"; })
      .style("opacity", 0)
      .append("svg:g")
      .attr("class", "axis")
      .attr("transform", "translate(0,0)")
      .each(function(d) { d3.select(this).call(axis.scale(yscale[d])); })
    .append("svg:text")
      .attr({
        "text-anchor": "middle",
        "y": 0,
        "transform": "translate(0,-12)",
        "x": 0,
        "class": "label"
      })
      .text(String);

  g_data.exit().remove();

  g = sp.svg.selectAll(".dimension");

  g.transition().duration(1100)
    .attr("transform", function(p) { return "translate(" + position(p) + ")"; })
    .style("opacity", 1)
  if (flags.shadows) paths(__.data, ctx.shadows);
  return this;
};

sp.brushable = function() {
  if (!g) sp.createAxes();

  // Add and store a brush for each axis.
  g.append("svg:g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(
          yscale[d].brush = d3.svg.brush()
            .y(yscale[d])
            .on("brushstart", function() {
              d3.event.sourceEvent.stopPropagation();
            })
            .on("brush", sp.brush)
        );
      })
    .selectAll("rect")
      .style("visibility", null)
      .attr("x", -15)
      .attr("width", 30)
  flags.brushable = true;
  return this;
};

// Jason Davies, http://bl.ocks.org/1341281
sp.reorderable = function() {
  if (!g) sp.createAxes();

  g.style("cursor", "move")
    .call(d3.behavior.drag()
      .on("dragstart", function(d) {
        dragging[d] = this.__origin__ = xscale(d);
      })
      .on("drag", function(d) {
        dragging[d] = Math.min(w(), Math.max(0, this.__origin__ += d3.event.dx));
        __.dimensions.sort(function(a, b) { return position(a) - position(b); });
        xscale.domain(__.dimensions);
        sp.render();
        g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
      })
      .on("dragend", function(d) {
        delete this.__origin__;
        delete dragging[d];
        d3.select(this).transition().attr("transform", "translate(" + xscale(d) + ")");
        sp.render();
      }));
  flags.reorderable = true;
  return this;
};

// pairs of adjacent dimensions
sp.adjacent_pairs = function(arr) {
  var ret = [];
  for (var i = 0; i < arr.length-1; i++) {
    ret.push([arr[i],arr[i+1]]);
  };
  return ret;
};
sp.interactive = function() {
  flags.interactive = true;
  return this;
};

// Get data within brushes
sp.brush = function() {
  __.brushed = selected();
  events.brush.call(sp,__.brushed);
  sp.render();
};

// expose a few objects
sp.xscale = xscale;
sp.yscale = yscale;
sp.ctx = ctx;
sp.canvas = canvas;
sp.g = function() { return g; };

sp.brushReset = function(dimension) {
  if (g) {
    g.selectAll('.brush')
      .each(function(d) {
        d3.select(this).call(
          yscale[d].brush.clear()
        );
      })
    sp.brush();
  }
  return this;
};

// rescale for height, width and margins
// TODO currently assumes chart is brushable, and destroys old brushes
sp.resize = function() {
  // selection size
  sp.selection.select("svg")
    .attr("width", __.width)
    .attr("height", __.height)
  sp.svg.attr("transform", "translate(" + __.margin.left + "," + __.margin.top + ")");

  // scales
  sp.autoscale();

  // axes, destroys old brushes. the current brush state should pass through in the future
  if (g) sp.createAxes().brushable();

  events.resize.call(this, {width: __.width, height: __.height, margin: __.margin});
  return this;
};

// highlight an array of data
sp.highlight = function(data) {
  sp.clear("highlight");
  d3.select(canvas.foreground).classed("faded", true);
  data.forEach(path_highlight);
  events.highlight.call(this,data);
  return this;
};

// clear highlighting
sp.unhighlight = function(data) {
  sp.clear("highlight");
  d3.select(canvas.foreground).classed("faded", false);
  return this;
};

// calculate 2d intersection of line a->b with line c->d
// points are objects with x and y properties
sp.intersection =  function(a, b, c, d) {
  return {
    x: ((a.x * b.y - a.y * b.x) * (c.x - d.x) - (a.x - b.x) * (c.x * d.y - c.y * d.x)) / ((a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x)),
    y: ((a.x * b.y - a.y * b.x) * (c.y - d.y) - (a.y - b.y) * (c.x * d.y - c.y * d.x)) / ((a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x))
  };
};

function is_brushed(p) {
  return !yscale[p].brush.empty();
};

// data within extents
function selected() {
  var actives = __.dimensions.filter(is_brushed),
      extents = actives.map(function(p) { return yscale[p].brush.extent(); });

  // test if within range
  var within = {
    "date": function(d,p,dimension) {
      return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1]
    },
    "number": function(d,p,dimension) {
      return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1]
    },
    "string": function(d,p,dimension) {
      return extents[dimension][0] <= yscale[p](d[p]) && yscale[p](d[p]) <= extents[dimension][1]
    }
  };

  return __.data
    .filter(function(d) {
      return actives.every(function(p, dimension) {
        return within[__.types[p]](d,p,dimension);
      });
    });
};

function position(d) {
  var v = dragging[d];
  return v == null ? xscale(d) : v;
}
  sp.toString = function() { return "Forced Layout: " + __.dimensions.length + " dimensions (" + d3.keys(__.data[0]).length + " total) , " + __.data.length + " rows"; };
  
  sp.version = "0.2.2";

  return sp;
};

d3.renderQueue = (function(func) {
  var _queue = [],                  // data to be rendered
      _rate = 10,                   // number of calls per frame
      _clear = function() {},       // clearing function
      _i = 0;                       // current iteration

  var rq = function(data) {
    if (data) rq.data(data);
    rq.invalidate();
    _clear();
    rq.render();
  };

  rq.render = function() {
    _i = 0;
    var valid = true;
    rq.invalidate = function() { valid = false; };

    function doFrame() {
      if (!valid) return true;
      if (_i > _queue.length) return true;
      var chunk = _queue.slice(_i,_i+_rate);
      _i += _rate;
      chunk.map(func);
    }

    d3.timer(doFrame);
  };

  rq.data = function(data) {
    rq.invalidate();
    _queue = data.slice(0);
    return rq;
  };

  rq.rate = function(value) {
    if (!arguments.length) return _rate;
    _rate = value;
    return rq;
  };

  rq.remaining = function() {
    return _queue.length - _i;
  };

  // clear the canvas
  rq.clear = function(func) {
    if (!arguments.length) {
      _clear();
      return rq;
    }
    _clear = func;
    return rq;
  };

  rq.invalidate = function() {};

  return rq;
});

/*
function scatterplots(error, links) {

pc.svg.selectAll(".scatterplots").remove();

// define dimensions of graph
m = [4, 4, 4, 4]; // margins
w = 200 - m[1] - m[3]; // width
h = 200 - m[0] - m[2]; // height

// offset for y
var offy = height + 150; // + (h + m[0] + m[2]);
var offx = 100;

var nodes = {};

// Compute the distinct nodes from the links.
links.forEach(function(link) {
    link.source = nodes[link.source] || 
        (nodes[link.source] = {name: link.source});
    link.target = nodes[link.target] || 
        (nodes[link.target] = {name: link.target});
    link.value = +link.value;
});



// Set the range
var  v = d3.scale.linear().range([0, 150]);

// Scale the range of the data
var max = d3.max(links, function(d) { return d.value; });
v.domain([0, max]);

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([w, h])
    .linkDistance(function(d) { return 80+v(max-d.value); })
    .charge(-30)
    .on("tick", tick)
    .start();

// asign a type per value to encode op+acity
links.forEach(function(link) {
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
  if ( link.pcp_path == 1 ) { link.type = link.type + '_p'; }
});

var sp = pc.svg.append("svg:g")
        .attr("class",'scatterplots')
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
        .attr("transform", "translate(" + offx + "," + offy + ")");


// build the arrow.
sp.append("svg:defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

// add the links and the arrows
var path = sp.append("svg:g").selectAll("path")
    .data(force.links())
  .enter().append("svg:path")
    .attr("class", function(d) { return "link " + d.type; })
    .attr("marker-end", "url(#end)");

// define the nodes
var node = sp.selectAll(".node")
    .data(force.nodes())
  .enter().append("g")
    .attr("class", "node")
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

// add the straight lines
function tick() {
    path.attr("d", function(d) {
        return "M" + 
            d.source.x + "," + 
            d.source.y + "L" + 
            d.target.x + "," + 
            d.target.y;
    });

    node
        .attr("transform", function(d) { 
        return "translate(" + d.x + "," + d.y + ")"; });
}

// action to take on mouse click
function click() {
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

}
*/