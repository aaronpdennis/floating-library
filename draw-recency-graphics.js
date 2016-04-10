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

  var svg = d3.select('#recencyBarChart').append('svg')
    .attr('width', 900)
    .attr('height', 400);

  function drawSnapshotRecency(snapIndex) {

    var collectionTotals = recency[snapIndex].map(function(d) {
      return d3.sum(d);
    });
    var systemTotal = d3.sum(collectionTotals);


    var recencyTotals = d3.transpose(recency[snapIndex]).map(function(d) { return d3.sum(d); });

    var averageProportions = recencyTotals.map(function(d) { return d / systemTotal; });

    svg.selectAll('.plot').remove();
    var plot = svg.selectAll('g')
      .data(recency[snapIndex])
     .enter().append('g')
      .attr('class', 'plot')
      .attr('transform', function(d,i) { return 'translate(' + 900 / libraryCodes.length * i + ',0)'; })
      .datum(function(d,i) { return d.map(function(v) { return { 'lib': i, 'amount': v }; }) });

    var colors = ['#ffffcc','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#005a32'];
    plot.selectAll('.bar')
      .data(function(d) { return d; })
     .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', function(d,i) { return (900 / libraryCodes.length / categories.length) * i; })
      .attr('width', (900 / libraryCodes.length / categories.length - 2))
      .attr('y', function(d,i) {
        var dy = 200 - ((d.amount / collectionTotals[d.lib]) / averageProportions[i] - 1) * 50;
        if (dy > 200) dy = 200;
        return dy;
      })
      .attr('height', function(d,i) { return Math.abs((d.amount / collectionTotals[d.lib]) / averageProportions[i] - 1) * 50; })
      .style('fill', function(d,i) { return colors[colors.length - i - 1] })
  }

  drawSnapshotRecency(0);
  d3.select('#recencyGraphics').append('p').text(categories.join(', '));

  d3.select('#recencySlider').on('change', function() {
    drawSnapshotRecency(this.value)
  });


}
