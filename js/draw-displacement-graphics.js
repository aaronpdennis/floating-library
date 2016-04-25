function drawDisplacementGraphics(data) {

  for (var s = 0; s < data.length; s++) {
    for (var i = 0; i < data[s].length; i++) {
      for (var j = 0; j < data[s][i].length; j++) {
        if (data[s][i][j] === 0) {
          data[s][i][j] += 1;
          if (s !== 0 && s !== data.length - 1) {
            data[s][i][j] = (data[s - 1][i][j] + data[s + 1][i][j]) / 2
          }
        }
      }
    }
  }

  var bookTotals = [];

  data.map(function(s,i) {

    var booksFromHomeLibrary = s.map(function(d) { return d3.sum(d); })

    var booksInCurrentLibrary = [];
    for (var i = 0; i < s.length; i++) { // for each home library i ...
      var counts = [];
      for (var j = 0; j < s.length; j++) { // for each current library j ...
        counts.push(s[j][i]);              // add to sum the number of books in current owned by this home
      }
      // ***
      booksInCurrentLibrary.push(d3.sum(counts));
    }
    var booksInSystem = d3.sum(booksFromHomeLibrary);
    bookTotals.push({ 'inLibrary': booksInCurrentLibrary, 'ownedByLibrary': booksFromHomeLibrary, 'inSystem': booksInSystem })
  });

  // displacement will be a matrix of home X current overstocked percentages
  displacement = [];
  data.map(function(s,i) { // for each snapshot s,i ...
    displacement.push([]); // add empty matrix container
    for (var j = 0; j < s.length; j++) { // for each home library j ...
      displacement[i].push([]);          // add empty row
      for (var k = 0; k < s[j].length; k++) { // for each current library k ...
        var value =
        (bookTotals[i]['ownedByLibrary'][j] * bookTotals[i]['inLibrary'][k])
        /
        (bookTotals[i]['inSystem'] * s[j][k]); // overstocked value
        displacement[i][j].push(value);
      }
    }
  });


  //////////////
  // Matrices //
  //////////////

  var domainValues = [0, 0.1, 0.5, 1, 5, 10, 25, 50, 75, 100, 150, 250, 2500];
  var color = d3.scale.linear().domain(domainValues).range(['#762a83','#af8dc3','#e7d4e8','#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58']).interpolate(d3.interpolateLab)

  var cellSize = 12,
      margin = 20,
      libraries = data[0].length;

  var width = cellSize * libraries + margin,
      height = width + 15;

  // Legend
  var legend = d3.select('#matrices').append('div')
    .attr('id', 'matrixLegend')
    .style('width', '100%')
    .style('height', (cellSize * 3) + 'px')
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('align-items', 'center')
    .style('margin-bottom', '20px');

  legend.append('p').text('understocked').attr('class', 'label').style('padding', '5px');

  legend.selectAll('.cell')
    .data(domainValues.reverse())
   .enter().append('div')
    .style('float', 'left')
    .style('height', cellSize + 'px')
    .style('width', cellSize + 'px')
    .style('background-color', function(d) {
      return color(d);
    });

  legend.append('p').text('overstocked').attr('class', 'label').style('padding', '5px');

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
   .enter().append('g') // groups for each home library
    .attr('width', width)
    .attr('height', cellSize)
    .attr('transform', function(d,i) { return 'translate(' + margin + ',' + (cellSize * i + margin) + ')' });

  var squares = library.selectAll('g')
    .data(function(d) { return d; })
   .enter().append('rect') // square for each current library across
    .attr('class', 'cell')
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('x', function(d,i) { return i * cellSize; })
    .style('fill', function(d) { return color(d); });

  var date_labels = svg.append('text')
    .attr('class', 'dateLabel label')
    .attr('x', width - (5))
    .attr('y', height - (5))
    .attr('text-anchor', 'end')
    .text(function(d,i) {
      return displayFormat(
        snapFormat.parse(
          snapshots[i]
        )
      );
    });

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

  // pass in two arrays listing the libraries of interest, home and current
  function constructChartData(array) {
    console.log('array:', array);
      var home = array[0],
          current = array[1];
      var lines = [];
      for (var h = 0; h < home.length; h++) {
        for (var c = 0; c < current.length; c++) {
          console.log('checking', home[h], '!==', home[c]);
          if (home[h] !== current[c]) { lines.push(getLineData(home[h], current[c])); }
        }
      }
      console.log('lines', lines);
      return lines;
  }

  function getLineData(home, current) {
    console.log('home : current', home, current);
    var lineData = { 'home': home, 'current': current, 'history':[] };
    var homeIndex = libraryCodes.indexOf(home),
        currentIndex = libraryCodes.indexOf(current);
    displacement.map(function(d,i) {
      var record = { 'date': snapshots[i], 'ratio': d[homeIndex][currentIndex] }
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
  function drawChart(compared) {

    console.log('compared', JSON.stringify(compared));

    chart.selectAll('.line').remove();
    chart.selectAll('.label').remove();
    chart.selectAll('.regline').remove();
    d3.selectAll('.caption').text('');

    if(compared[0].length !== 0 && compared[1].length !== 0) {

      var chartData = constructChartData(compared);
      console.log('DEBUG', chartData);

      var values = chartData.map(function(pair) {
        return pair.history.map(function(d) {
          var time = dateFormat.parse(d.date).getTime() - dateFormat.parse(snapshots[0]).getTime();
          return [time, d.ratio];
        });
      });
      console.log('values', values);
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
      caption1 += comparisons[0].join(', ') + ' books in ' + comparisons[1].join(', ') + ' become half as understocked every ' + halfLife + ' years.';
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

  // Interested in 1) home libraries and 2) current libraries
  var comparisons = [[],[]];

  d3.select('#homeAllLibrariesSelector').on('click', function() {
    if (comparisons[0].length === libraryCodes.length) {
      d3.select('#homeCheckboxes').selectAll('input').property('checked', false);
      comparisons[0] = [];
    } else {
      d3.select('#homeCheckboxes').selectAll('input').property('checked', true);
      comparisons[0] = libraryCodes.slice();
    }
    drawChart(comparisons)
  })
  d3.select('#homeCheckboxes').selectAll('input').on('change', function() {
    var valIndex = comparisons[0].indexOf(this.value);
    if (valIndex < 0) { comparisons[0].push(this.value); } else { comparisons[1].splice(valIndex, valIndex + 1); }
    drawChart(comparisons);
  });

  d3.select('#currentAllLibrariesSelector').on('click', function() {
    if (comparisons[1].length === libraryCodes.length) {
      d3.select('#currentCheckboxes').selectAll('input').property('checked', false);
      comparisons[1] = [];
    } else {
      d3.select('#currentCheckboxes').selectAll('input').property('checked', true);
      comparisons[1] = libraryCodes.slice();
    }
    drawChart(comparisons)
  })
  d3.select('#currentCheckboxes').selectAll('input').on('change', function() {
    var valIndex = comparisons[1].indexOf(this.value);
    if (valIndex < 0) { comparisons[1].push(this.value); } else { comparisons[1].splice(valIndex, valIndex + 1); }
    drawChart(comparisons);
  });

}
