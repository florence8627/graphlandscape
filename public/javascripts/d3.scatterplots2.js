function scatterplot(data, k) {

  var spObj = new Object();

  SectView.svg.selectAll(".scatterplot").remove();
  SectView.svg.selectAll(".icon").remove();

//  console.log(k);
//  console.log(data);

  var kidx = FrntView.dimensions();
  var tidx = FrntView.dimensionTitles();


  // define dimensions of the graphs
  var m = [14, 14, 14, 14]; // margins
  var h = SectView.height() - m[0] - m[2];  // height
  var w = h;                                // width

  // offset for y
  var offy = m[0]/2;
  var offx = m[1]/2;

  // Last element contains id
  var z = data[0].length -1;

    for (var i = 0; i < kidx.length; i++) {

      // offset for x
      offx = -(w/2) + (i*2+1) * (((SectView.width()) / (kidx.length * 2)));

     // X scale will fit all values from data[] within pixels 0-w

      var x = d3.scale.linear()
          .domain(d3.extent(data, function(d) { return parseFloat(d[k]); }))
          .range([0, w]);

      // Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
      var y = d3.scale.linear()
          .domain(d3.extent(data, function(d) { return parseFloat(d[kidx[i]]); }))
          .range([h, 0]);

      var iMap = function(d) {return d[z];};

      var xMap = function(d) { 
          // verbose logging to show what's actually being done
//          console.log('Plotting X value for data point: ' + d[k] + ' to be at: ' + x(d[k]) + ' using our xScale.');
          // return the X coordinate where we want to plot this datapoint
          return x(parseFloat(d[k])); 
          };

      var yMap = function(d) { 
          // verbose logging to show what's actually being done
//          console.log('Plotting Y value for data point: ' + d[kidx[i]] + ' to be at: ' + y(d[kidx[i]]) + ' using our yScale.');
          // return the Y coordinate where we want to plot this datapoint
          return y(parseFloat(d[kidx[i]])); 
          };

      // automatically determining max range can work something like this
      // y = d3.scale.linear().domain([0, d3.max(data)]).range([h, 0]);

      // create a line function that can convert data[] into x and y points
      line = d3.svg.line()
      // assign the X function to plot our line as we wish
      .x(function(d) { 
          // verbose logging to show what's actually being done
//          console.log('Plotting X value for data point: ' + d[kidx[k]] + ' to be at: ' + x(d[kidx[k]]) + ' using our xScale.');
          // return the X coordinate where we want to plot this datapoint
          return x(d[kidx[k]]); 
      })
      .y(function(d) { 
          // verbose logging to show what's actually being done
//          console.log('Plotting Y value for data point: ' + d[kidx[i]] + ' to be at: ' + y(d[kidx[i]]) + ' using our yScale.');
          // return the Y coordinate where we want to plot this datapoint
          return y(d[kidx[i]]); 
      })


      SectView.svg.append("svg:image")
         .attr("class",'icon')
         .attr('x',offx+(w/2)+10)
         .attr('y', h+8)
         .attr('dimensionTitle', tidx[kidx[i]])
         .attr('width', 16)
         .attr('height', 16)
         .attr("xlink:href","delete-icon.png")
         .attr("onclick","onDeleteDims(this);");

      if ( k == kidx[i] ) {
        histogram(data, k);

	/*
        SectView.svg.append("svg:image")
           .attr("class",'icon')
           .attr('x',offx+(w/2))
           .attr('y', h/2)
           .attr('dimensionTitle', tidx[kidx[i]])
           .attr('width', w/2)
           .attr('height', h/2)
           .attr("xlink:href","search-icon.png");
	*/
        continue;
      }

      SectView.svg.append("svg:image")
         .attr("class",'icon')
         .attr('x',offx+(w/2)-10)
         .attr('y', h+8)
         .attr('dimensionTitle', tidx[kidx[i]])
         .attr('width', 14)
         .attr('height', 14)
         .attr("xlink:href","search-icon.png")
         .attr("onclick","onSearchDims(this);");

      graph = SectView.svg.append("svg:g")
            .attr("class",'scatterplot')
            .attr("width", w + m[1] + m[3])
            .attr("height", h + m[0] + m[2])
            .attr("transform", "translate(" + offx + "," + offy + ")");

      // create yAxis
      xAxis = d3.svg.axis()
          .scale(x)
          .tickSize(2)
          .ticks(1)
          .tickFormat("")
          .orient("bottom");
      // Add the x-axis.
      graph.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + h + ")") // "translate(0,0)")
            .call(xAxis);

      // create left yAxis
      yAxisLeft = d3.svg.axis()
          .scale(y)
          .tickSize(2)
          .tickFormat("")
          .ticks(1)
          .orient("left");
      // Add the y-axis to the left
      graph.append("svg:g")
            .attr("class", "y axis")
            .attr("transform",  "translate(0,0)") // "translate(" + w + ",0)") //
            .call(yAxisLeft);

      // Add the line by appending an svg:path element with the data line we created above
      // do this AFTER the axes above so that the line is above the tick-lines
      graph.selectAll(".dot")
            .data(data)
          .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 1)
            .attr("sp_id", iMap)
            .attr("cx", xMap)
            .attr("cy", yMap);
  } 
////////////////////////////////////////////////////////////////////////////////
  function updateSectView(ids) {
//      console.log(ids);
      var e = document.getElementById('msp');
      var li = e.getElementsByClassName('dot');
      for (var i = 0; i < li.length; i++) {
        if (ids.indexOf(li[i].attributes.sp_id.value) == -1) {
          li[i].classList.add("hidden");
        } else {
          li[i].classList.remove("hidden");
        }
      }
  }
////////////////////////////////////////////////////////////////////////////////
  function brushReset() {
      var e = document.getElementById('msp');
      var li = e.getElementsByClassName('dot');
      for (var i = 0; i < li.length; i++) {
        li[i].classList.remove("hidden");
      }
  }
////////////////////////////////////////////////////////////////////////////////
  function histogram(values0, k) {

  // Generate a Bates distribution of 10 random variables.
//  var values = d3.range(1000).map(d3.random.bates(10));

  var v0 = values0.map(function(d){ return parseFloat(d[k]);});

  var y = d3.scale.linear()
      .domain([d3.min(v0), d3.max(v0)])
      .range([0, h]);

//  console.log([d3.min(v0), d3.max(v0)]);


  // Generate a histogram using twenty uniformly-spaced bins.
  var data = d3.layout.histogram()
      .bins(y.ticks(50))
      (v0);
//      (values);

  var svg = SectView.svg.append("svg:g")
            .attr("class",'scatterplot')
            .style("background-color", 'yellow')
            .attr("width", w + m[1] + m[3])
            .attr("height", h + m[0] + m[2])
            .attr("transform", "translate(" + offx + "," + offy + ")");

  if ( data.length == 0 ) {
    data = [{x: parseInt(d3.max(v0)), y: v0.length}];
    svg.append("rect")
       .attr("x"     , 0)
       .attr("y"     , h)
       .attr("width" , w)
       .attr("height", 2);
  }

//  console.log(v0);
//  console.log(data);

  var xScale = d3.scale.linear()
      .domain([d3.min(data, function(d) { return d.x; }), d3.max(data, function(d) { return d.x; })])
      .range([w, 0]);

  var yScale = d3.scale.linear()
      .domain([d3.min(data, function(d) { return d.y; }), d3.max(data, function(d) { return d.y; })])
      .range([0, h]);


  svg.selectAll("rect")
     .data(data)
     .enter()
     .append("rect")
     .attr("x"     , function(d) { return (w - yScale(d.y))/2; })
     .attr("y"     , function(d) { return      xScale(d.x);    })
     .attr("width" , function(d) { return      yScale(d.y);    })
     .attr("height", 2);

  }
////////////////////////////////////////////////////////////////////////////////
  spObj.updateSectView = updateSectView;
  spObj.brushReset = brushReset;
  return spObj;

}
////////////////////////////////////////////////////////////////////////////////
