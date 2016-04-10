function drawDisplacementGraphics(data) {

  var bookTotals = [];

  data.map(function(s,i) {
    var booksInLibrary = s.map(function(d) { return d3.sum(d); })
    var booksOwnedByLibrary = [];
    for (var i = 0; i < s.length; i++) {
      var counts = [];
      for (var j = 0; j < s.length; j++) {
        counts.push(s[j][i]);
      }
      booksOwnedByLibrary.push(d3.sum(counts));
    }
    var booksInSystem = d3.sum(booksInLibrary);
    bookTotals.push({ 'inLibrary': booksInLibrary, 'ownedByLibrary': booksOwnedByLibrary, 'inSystem': booksInSystem })
  });

  displacement = [];
  data.map(function(s,i) {
    displacement.push([]);
    for (var j = 0; j < s.length; j++) {
      displacement[i].push([]);
      for (var k = 0; k < s[j].length; k++) {
        //var value = Math.round((bookTotals[i]['ownedByLibrary'][j] * bookTotals[i]['inLibrary'][k]) / bookTotals[i]['inSystem'] - s[j][k])
        var value = (bookTotals[i]['ownedByLibrary'][k] * bookTotals[i]['inLibrary'][j]) / (bookTotals[i]['inSystem'] * s[j][k])
        displacement[i][j].push(value);
      }
    }
  })

  var color = d3.scale.linear().domain([0, 0.1, 0.5, 1, 5, 10, 25, 50, 75, 100, 150, 250, 2500]).range(['#762a83','#af8dc3','#e7d4e8','#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58']).interpolate(d3.interpolateLab)


  //////////////
  // Matrices //
  //////////////

  var cellSize = 12,
      margin = 20,
      libraries = data[0].length;

  var width = cellSize * libraries + margin,
      height = width;

  var svg = d3.select('#matrices').selectAll('svg')
    .data(displacement)
   .enter().append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'snapshot')
   .append('g')
    .attr('transform', 'translate(' + 0 + ',' + 0 + ')');

  var library = svg.selectAll('.snapshot')
    .data(function(d) { return d; })
   .enter().append('g')
    .attr('width', width)
    .attr('height', cellSize)
    .attr('transform', function(d,i) { return 'translate(' + margin + ',' + (cellSize * i + margin) + ')' });

  var CL_labels = svg.selectAll('.snapshot')
    .data(libraryCodes)
   .enter().append('text')
    .attr('class', 'label')
    .attr('text-anchor', 'end')
    .attr('x', margin - 2)
    .attr('y', function(d,i) { return cellSize * i + margin + cellSize/2 + 1; })
    .text(function(d) { return d; });

  var HL_labels = svg.selectAll('.snapshot')
    .data(libraryCodes)
   .enter().append('text')
    .attr('class', 'label')
    .attr('text-anchor', 'start')
    .attr('x', 0 - margin + 2)
    .attr('y', function(d,i) { return cellSize * i + margin + cellSize/2 + 1; })
    .attr('transform', function(d) { return 'rotate(-90)'; })
    .text(function(d) { return d; });

  var squares = library.selectAll('g')
    .data(function(d) { return d; })
   .enter().append('rect')
    .attr('class', 'cell')
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('x', function(d,i) { return i * cellSize; })
    .style('fill', function(d) { return color(d); });
    //.on('mouseover', function(d,i) { console.log(d); });


  ////////////////
  // Line Graph //
  ////////////////

  // formatting & setup
  var chartMargin = { top: 20, right: 80, bottom: 60, left: 50 },
      chartWidth = 800 - chartMargin.left - chartMargin.right,
      chartHeight = 500 - chartMargin.top - chartMargin.bottom;

  var dateFormat = d3.time.format('%Y%m%d');

  var chartX = d3.time.scale().range([0, chartWidth]),
      chartY = d3.scale.pow().exponent(1).range([chartHeight, 0]);

  var chartLine = d3.svg.line().interpolate('basis')
      .x(function(d) { return chartX(dateFormat.parse(d.date)); })
      .y(function(d) { return chartY(d.ratio); });

  var chart = d3.select('#lineGraph').append('svg')
      .attr("width", chartWidth + chartMargin.left + chartMargin.right)
      .attr("height", chartHeight + chartMargin.top + chartMargin.bottom)
    .append("g")
      .attr("transform", "translate(" + chartMargin.left + "," + chartMargin.top + ")");


  // processing data

  // pass in two arrays listing the libraries of interest, current and home
  function constructChartData(array) {
      var current = array[0],
          home = array[1];
      var lines = [];
      for (var c = 0; c < current.length; c++) {
        for (var h = 0; h < home.length; h++) {
          if (current[c] !== home[h]) { lines.push(getLineData(current[c], home[h])); }
        }
      }
      return lines;
  }

  function getLineData(current, home) {
    var lineData = { 'current': current, 'home': home, 'history':[] };
    var currentIndex = libraryCodes.indexOf(current),
        homeIndex = libraryCodes.indexOf(home);
    displacement.map(function(d,i) {
      var record = { 'date': snapshots[i], 'ratio': d[currentIndex][homeIndex] }
      lineData.history.push(record);
    });
    return lineData;
  }

  // build checkboxes
  d3.select('#homeCheckboxes').selectAll('.checkbox')
    .data(libraryCodes)
   .enter().append('p')
    .attr('class', 'checkboxContainer')
    .html(function(d) { return '<input type="checkbox" value="' + d + '" id="' + d + 'homecheckbox">' + d; });

  d3.select('#currentCheckboxes').selectAll('.checkbox')
    .data(libraryCodes)
   .enter().append('p')
    .attr('class', 'checkboxContainer')
    .html(function(d) { return '<input type="checkbox" value="' + d + '" id="' + d + 'currentcheckbox">' + d; });

  chartX.domain(d3.extent(snapshots, function(d) { return dateFormat.parse(d); }));

  var chartXAxis = d3.svg.axis().scale(chartX).orient('bottom'),
      chartYAxis = d3.svg.axis().scale(chartY).orient('left').ticks(5).tickFormat(d3.format('d'));

  chartY.domain([1,150]);

  // x axis
  chart.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + chartHeight + ")")
       .call(chartXAxis)
    .selectAll('text')
      .attr("dy", "0.5em")
      .attr("dx", "-1em")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

  // y axis
  chart.append("g")
     .attr("class", "y axis")
     .call(chartYAxis)
   .append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", 6)
     .attr("dy", ".71em")
     .style("text-anchor", "end")
     .text("Ratio to Equilibrium");

  // draw line chart
  function drawChart(data) {

    chart.selectAll('.line').remove();
    chart.selectAll('.label').remove();
    chart.selectAll('.regline').remove();
    d3.selectAll('.caption').text('');

    if(data[0].length !== 0 && data[1].length !== 0) {

      var chartData = constructChartData(data);

      var values = chartData.map(function(pair) {
        return pair.history.map(function(d) {
          var time = dateFormat.parse(d.date).getTime() - dateFormat.parse(snapshots[0]).getTime();
          return [time, d.ratio];
        });
      });
      var emptyAvgValues = [];
      for (var i = 0; i < values[0].length; i++) {
        emptyAvgValues.push([[],[]])
      }
      values.map(function(v) {
        for (var i = 0; i < values[0].length; i++) {
          emptyAvgValues[i][0].push(v[i][0]);
          emptyAvgValues[i][1].push(v[i][1]);
        }
      });
      var avgValues = emptyAvgValues.map(function(d) {
        return d.map(function(p) {
          return d3.mean(p);
        })
      });

      var reg = regression('exponential', avgValues)

      var regPoints = reg.points.map(function(d) {
        return { 'ratio': d[1], 'date': dateFormat(new Date(dateFormat.parse(snapshots[0]).getTime() + d[0]))}
      });

      var caption1 = '';
      var halfLife = (Math.round((Math.log(0.5)/reg.equation[1]) / (1000 * 60 * 60 * 24 * 365.25) * 100) / 100);
      caption1 += comparisons[1].join(', ') + ' books in ' + comparisons[0].join(', ') + ' become half as understocked every ' + halfLife + ' years.';
      var caption2 = '';
      caption2 += 'After 5 years, these books will be ' + Math.round((100 * (1 - (1 * Math.pow(0.5, (5 / halfLife))))) * 100) / 100 + '% distributed.';
      d3.select('#lineGraphCaption1').text(caption1);
      d3.select('#lineGraphCaption2').text(caption2);

      var chartPaths = chart.selectAll('.line')
          .data(chartData)
        .enter().append('path')
          .datum(function(d) { return d.history; })
          .attr('class', 'line')
          .attr('d', chartLine);

      chart.append('path')
        .datum(regPoints)
        .attr('class', 'regline')
        .attr('d', chartLine)

      var chartText = chart.selectAll('.label')
          .data(chartData)
        .enter().append('text')
          .attr('class', 'label')
          .attr('x', chartWidth + 2)
          .attr('y', function(d) { return chartY(d.history[d.history.length - 1].ratio); })
          .text(function(d) { return d.home + ' in ' + d.current; });

    }
  }

  /////////////////////////////////////
  // Libraries comparisons selectors //
  /////////////////////////////////////

  var comparisons = [[],[]];

  d3.select('#currentAllLibrariesSelector').on('click', function() {
    if (comparisons[0].length === libraryCodes.length) {
      d3.select('#currentCheckboxes').selectAll('input').property('checked', false);
      comparisons[0] = [];
    } else {
      d3.select('#currentCheckboxes').selectAll('input').property('checked', true);
      comparisons[0] = libraryCodes.slice();
    }
    drawChart(comparisons)
  })
  d3.select('#currentCheckboxes').selectAll('input').on('change', function() {
    var valIndex = comparisons[0].indexOf(this.value);
    if (valIndex < 0) { comparisons[0].push(this.value); } else { comparisons[0].splice(valIndex, valIndex + 1); }
    drawChart(comparisons);
  });

  d3.select('#homeAllLibrariesSelector').on('click', function() {
    if (comparisons[1].length === libraryCodes.length) {
      d3.select('#homeCheckboxes').selectAll('input').property('checked', false);
      comparisons[1] = [];
    } else {
      d3.select('#homeCheckboxes').selectAll('input').property('checked', true);
      comparisons[1] = libraryCodes.slice();
    }
    drawChart(comparisons)
  })
  d3.select('#homeCheckboxes').selectAll('input').on('change', function() {
    var valIndex = comparisons[1].indexOf(this.value);
    if (valIndex < 0) { comparisons[1].push(this.value); } else { comparisons[1].splice(valIndex, valIndex + 1); }
    drawChart(comparisons);
  });

}
