function drawRecencyGraphics(data) {

  var categories = ['less than 3 years', '3 - 5 years', '6 - 10 years', '11 - 25 years', '26 - 50 years', '51 - 100 years', 'more than 100 years'];

  var recency = data.map(function(s) {
    var libraries = [];
    for (var i = 0; i < libraryCodes.length; i++) { libraries.push([]); }
    for (d in s) {
      s[d].map(function(v,i) {
        libraries[i][categories.indexOf(d)] = v;
      })
    }
    return libraries;
  });

  // value = 'category count' / 'library total' - 'system category count' / 'system total'
  var extreme = 0;

  var proportionalRecency = [];

  for (var s = 0; s < snapshots.length; s++) {
    proportionalRecency.push([]);

    var sExtreme = 0;
    var scTotal = new Array(categories.length + 1).join('0').split('').map(parseFloat);

    for (var l = 0; l < recency[s].length; l++) {
      for (var c =0; c < categories.length; c++) {
        scTotal[c] += recency[s][l][c];
      }
    }

    var systemTotal = d3.sum(scTotal);

    for (var l = 0; l < recency[s].length; l++) {
      proportionalRecency[s].push([]);
      var lExtreme = 0;
      var lTotal = d3.sum(recency[s][l]);
      for (var c = 0; c < categories.length; c++) {
        var value = (recency[s][l][c] / lTotal) / (scTotal[c] / d3.sum(scTotal)) - 1;
        proportionalRecency[s][l].push(value);
        if (Math.abs(value) > lExtreme) lExtreme = Math.abs(value);
      }
      if (lExtreme > sExtreme) sExtreme = lExtreme;
    }
    if (sExtreme > extreme) extreme = sExtreme;
  }

  function drawSnapshotRecency(snapIndex) {

    var collectionTotals = recency[snapIndex].map(function(d) {
      return d3.sum(d);
    });
    var systemTotal = d3.sum(collectionTotals);
    var recencyTotals = d3.transpose(recency[snapIndex]).map(function(d) { return d3.sum(d); });
    var averageProportions = recencyTotals.map(function(d) { return d / systemTotal; });

    var margin = 12;

    var height = 280 + 2 * margin,
        width = 120 + 2 * margin;

    var yScale = d3.scale.linear()
      .domain([1 * extreme, -1 * extreme])
      .range([margin, height - margin]);

    var recencyColor = d3.scale.pow()
      .domain([0,6])
      .range(['#01665e','#8c510a'])
      .interpolate(d3.interpolateLab);

    // Legend
    if (d3.select('#recencyLegend').empty()) {
      var legend = d3.select('#recencyBarChart').append('div')
        .attr('id', 'recencyLegend')
        .attr('class', 'legend')
        .style('width', '100%')
        .style('height', '60px')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center')
        .style('margin-bottom', '20px');

      legend.append('p').text('newer books').attr('class', 'label').style('padding', '5px');

      legend.selectAll('.cell')
        .data(categories)
       .enter().append('div')
        .style('float', 'left')
        .style('height', '20px')
        .style('width', '20px')
        .style('margin-right', '1px')
        .style('background-color', function(d,i) {
          return recencyColor(i);
        });

      legend.append('p').text('older books').attr('class', 'label').style('padding', '5px');
    }

    d3.select('#recencyBarChart').selectAll('.plot').remove();
    var rSvg = d3.select('#recencyBarChart').selectAll('.plot')
      .data(proportionalRecency[snapIndex])
     .enter().append('svg')
      .attr('class', 'plot')
      .attr('height', height)
      .attr('width', width);

    var rGroups = rSvg.selectAll('.rGroup')
      .data(function(d) { return d; })
     .enter().append('g')
      .attr('transform', function(d,i) { return 'translate(' + (((width - 2 * margin) / categories.length) * i + margin) + ',0)'; })

    rGroups.append('rect')
      .attr('class', 'bar')
      .attr('width', ((width - 2 * margin) / categories.length - 2))
      .attr('y', function(d) {
       return d < 0 ? (height / 2) : yScale(d) - 1;
      })
      .attr('height', function(d) {
       return Math.abs((height / 2) - yScale(d)) + 1;
      })
      .style('fill', function(d,i) {
       return recencyColor(i);
      })
      .on('click', function(d) { console.log(d); });

    rSvg
      .append('rect')
      .attr('class', 'mean-line')
      .attr('y', height / 2 - 1)
      .attr('x', margin)
      .attr('width', width - 2 * margin - 2)
      .attr('height', 2);

    rSvg
      .append('text')
      .attr('class', 'label')
      .attr('x', height / 2 - 1)
      .attr('y', margin)
      .attr('width', width - 2 * margin - 2)
      .attr('height', 2)

    rSvg
      .append('text')
      .attr('class', 'label plusminus')
      .attr('x', 2)
      .attr('y', height / 2 - 12)
      .style('fill', 'green')
      .text('+');

    rSvg
      .append('text')
      .attr('class', 'label plusminus')
      .attr('x', 2)
      .attr('y', height / 2 + 12)
      .style('fill', 'red')
      .text('-');

    rSvg
      .append('text')
      .attr('class', 'dateLabel label')
      .attr('x', width - (0 + margin))
      .attr('y', height - (0 + margin))
      .attr('text-anchor', 'end')
      .text(function(d,i) { return displayFormat(
          snapFormat.parse(
            snapshots[$('#recencySlider').val()]
          )
        );
      });

    rGroups
      .append('text')
      .attr('class', 'label')
      //.attr('x', 2 + margin)
      .attr('y', function(d) {
        return height / 2;
      })
      .attr('x', function(d) {
        var pad = d > 0 ? -1 * margin / 4 : margin / 4;
        return pad;
      })
      .attr('text-anchor', function(d) {
        var anchor = d < 0 ? 'start' : 'end';
        return anchor;
      })
      .attr('transform', 'rotate(-90) translate(' + -1 * height / 2 +',' + -1 * height / 2.13 +')')
      .text(function(d,i) { return categories[i] + ' old'; });

  }

  drawSnapshotRecency(0);

  d3.select('#recencySlider').on('change', function() {
    drawSnapshotRecency(this.value)
  });


}
