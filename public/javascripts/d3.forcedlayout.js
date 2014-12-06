d3.forcedlayout = function(config) {
  var __ = {
    nodes: [],
    links: [],
    data: [],
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

  var fl = function(selection) {
    selection = fl.selection = d3.select(selection);

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
    fl.svg = selection
      .append("svg")
        .attr("width", __.width)
        .attr("height", __.height)
      .append("svg:g")
        .attr("transform", "translate(" + __.margin.left + "," + __.margin.top + ")");

    return fl;
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
    .on("width", function(d) { fl.resize(); })
    .on("height", function(d) { fl.resize(); })
    .on("margin", function(d) { fl.resize(); })
    .on("rate", function(d) { rqueue.rate(d.value); })
    .on("data", function(d) {
      if (flags.shadows) paths(__.data, ctx.shadows);
    });
//    .on("dimensions", function(d) {
//      xscale.domain(__.dimensions);
//      if (flags.interactive) fl.render().updateAxes();
//  });

  // expose the state of the chart
  fl.state = __;
  fl.flags = flags;

  // create getter/setters
  getset(fl, __, events);

  // expose events
  d3.rebind(fl, events, "on");

  // getter/setter with event firing
  function getset(obj,state,events)  {
    d3.keys(state).forEach(function(key) {
      obj[key] = function(x) {
        if (!arguments.length) return state[key];
        var old = state[key];
        state[key] = x;
        side_effects[key].call(fl,{"value": x, "previous": old});
        events[key].call(fl,{"value": x, "previous": old});
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

  fl.autoscale = function() {

    // yscale
    xscale.rangePoints([0, h()], 1);

    // xscale
    xscale.rangePoints([0, w()], 1);

    // canvas sizes
    fl.selection.selectAll("canvas")
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


  fl.render = function() {
    console.log(JSON.stringify(__.data));

    return;

    // try to autodetect dimensions and create scales
    if (!__.dimensions.length) fl.detectDimensions();
    if (!(__.dimensions[0] in yscale)) fl.autoscale();

    fl.render[__.mode]();

    events.render.call(this);
    return this;
  };

  fl.render.default = function() {
    fl.clear('foreground');
    if (__.brushed) {
      __.brushed.forEach(path_foreground);
    } else {
      __.data.forEach(path_foreground);
    }
  };

  fl.interactive = function() {
    flags.interactive = true;
    return this;
  };

  // expose a few objects
  fl.xscale = xscale;
  fl.yscale = yscale;
  fl.ctx = ctx;
  fl.canvas = canvas;
  fl.g = function() { return g; };

  // rescale for height, width and margins
  // TODO currently assumes chart is brushable, and destroys old brushes
  fl.resize = function() {
    // selection size
    fl.selection.select("svg")
      .attr("width", __.width)
      .attr("height", __.height)
    fl.svg.attr("transform", "translate(" + __.margin.left + "," + __.margin.top + ")");

    // scales
    fl.autoscale();

    // axes, destroys old brushes. the current brush state should pass through in the future
    if (g) fl.createAxes().brushable();

    events.resize.call(this, {width: __.width, height: __.height, margin: __.margin});
    return this;
  };



  function position(d) {
    var v = dragging[d];
    return v == null ? xscale(d) : v;
  }

  fl.toString = function() { return "Forced Layout: " + __.dimensions.length + " dimensions (" + d3.keys(__.data[0]).length + " total) , " + __.data.length + " rows"; };
  fl.version = "0.2.2";
  return fl;
};
