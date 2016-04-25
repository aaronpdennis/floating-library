function drawCallNumberGraphics(data) {
  var firstSnapshotData = restructureCallNumbers(data[0]);

  for (main in firstSnapshotData) {
    if (main != 'libraryTotals') $('#classMenu').append('<option value="' + main + '">' + main + '</option>')
  }
  $('#classMenu').change(function() {
    updateCallNumberChart(data);
  });
  $('#cnSlider').change(function() {
    updateCallNumberChart(data);
  });

  function updateCallNumberChart(data) {

    var snap = $('#cnSlider').val();

    var chartData = data.map(restructureCallNumbers);

    var maxCount = 0;
    for (var s = 0; s < chartData.length; s++) {
      for (main in chartData[s]) {
        if (chartData[s][main].total > maxCount) maxCount = chartData[s][main].total;
      }
    }

    var focus = $('#classMenu').val();

    var charts = [],
        maxValue = 0;
    for (var s = 0; s < chartData.length; s++) {
      var systemTotal = d3.sum(chartData[s].libraryTotals);
      charts.push([]);
      if (focus === 'main') {
        for (main in chartData[s]) {
          if (main !== 'libraryTotals') {
            var callNumber = main;
            var netProportionValues = chartData[s][main].libraryProportions.map(function(d,i) {
              var value = d / (chartData[s][main].total / systemTotal) - 1;
              if ( Math.abs(value) > maxValue) maxValue = value;
              return value;
            });
            var chart = {
              'callNumber': callNumber,
              'values': netProportionValues,
              'counts': chartData[s][main].libraries
            };
            charts[s].push(chart);
          }
        }
      } else {
        for (sub in chartData[s][focus].subclasses) {
          var callNumber = focus === sub ? focus : focus + sub;
          var netProportionValues = chartData[s][focus].subclasses[sub].libraryProportions.map(function(d,i) {
            var value = d / (chartData[s][focus].subclasses[sub].total / systemTotal) - 1;
            if ( Math.abs(value) > maxValue) maxValue = value;
            return value;
          })
          var chart = {
            'callNumber': callNumber,
            'values': netProportionValues,
            'counts': chartData[s][focus].subclasses[sub].libraries
          };
          charts[s].push(chart);
        }
      }
    }

    var margin = 12;

    var height = 170 + 2 * margin,
        width = 310 + 2 * margin;

    var yScale = d3.scale.linear()
      .domain([1 * maxValue, -1 * maxValue])
      .range([margin, height - margin]);

    var cnDomain = [0, maxCount / 1000, maxCount / 500, maxCount / 50, maxCount / 2, maxCount];
    var cnColor = d3.scale.linear()
      .domain(cnDomain)
      .range(['#a6bddb','#67a9cf','#3690c0','#02818a','#016450']);

    // Legend
    //d3.selectAll('.legend').remove();
    if (d3.select('#cnLegend').empty()) {
      var legend = d3.select('#callNumberChart').append('div')
        .attr('id', 'cnLegend')
        .attr('class', 'legend')
        .style('width', '100%')
        .style('height', '60px')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center')
        .style('margin-bottom', '20px');

      legend.append('p').text('small collection').attr('class', 'label').style('padding', '5px');

      legend.selectAll('.cell')
        .data(cnDomain)
       .enter().append('div')
        .style('float', 'left')
        .style('height', '20px')
        .style('width', '20px')
        .style('margin-right', '1px')
        .style('background-color', function(d) {
          return cnColor(d);
        });

      legend.append('p').text('large collection').attr('class', 'label').style('padding', '5px');
    }

    d3.select('#callNumberChart').selectAll('.plot').remove();
    var cnSvg = d3.select('#callNumberChart').selectAll('.plot')
      .data(charts[snap])
     .enter().append('svg')
      .attr('class', 'plot')
      .attr('height', height)
      .attr('width', width);

    var cnGroups = cnSvg.selectAll('.cnGroup')
      .data(function(d) {
        var zipped = d3.zip(d.values, d.counts);
        var max = d3.max(d.values),
            min = d3.min(d.values);
        var extreme = Math.abs(max) > Math.abs(min) ? max : min;
        zipped.map(function(d) { d.push(Math.abs(extreme)); return d; });
        return zipped;
      })
     .enter().append('g')
      .attr('transform', function(d,i) { return 'translate(' + (((width - 2 * margin) / libraryCodes.length) * i + margin) + ',0)'; })

    cnGroups.append('rect')
      .attr('class', 'bar')
      .attr('width', ((width - 2 * margin) / libraryCodes.length - 2))
      .attr('y', function(d) {
        return d[0] < 0 ? (height / 2) : yScale(d[0]) - 1;
      })
      .attr('height', function(d) {
        return Math.abs((height / 2) - yScale(d[0])) + 1;
      })
      .style('fill', function(d) {
        return cnColor(d[1]);
      });

    cnSvg
      .append('rect')
      .attr('class', 'mean-line')
      .attr('y', height / 2 - 1)
      .attr('x', margin)
      .attr('width', width - 2 * margin - 2)
      .attr('height', 2)

    cnGroups
      .append('text')
      .attr('class', 'label')
      .attr('y', function(d) {
        var pad = d[0] > 0 ? -1 * (margin / 2 + 2) : margin / 2 + 2;
        return yScale(d[0]) + pad - 1;
      })
      .attr('alignment-baseline', function(d) { return d[0] > 0 ? 'hanging' : 'auto' })
      .text(function(d,i) { return libraryCodes[i]; });

    cnSvg
      .append('text')
      .attr('class', 'classLabel label')
      .attr('x', 2 + margin)
      .attr('y', 2 + margin)
      .attr('alignment-baseline', 'hanging')
      .text(function(d) { return d.callNumber; });

    cnSvg
      .append('text')
      .attr('class', 'dateLabel label')
      .attr('x', width - (0 + margin))
      .attr('y', height - (0 + margin))
      .attr('text-anchor', 'end')
      .text(function(d,i) { return displayFormat(
          snapFormat.parse(
            snapshots[$('#cnSlider').val()]
          )
        );
      });

  }

  updateCallNumberChart(data);

}

function restructureCallNumbers(cnData) {

  var empty = [];
  while (empty.length < libraryCodes.length) {
    empty.push(0);
  }

  var restructured = { libraryTotals: empty.slice() };

  for (cn in cnData) {
    cnData[cn].map(function(d,i) { restructured.libraryTotals[i] += d; });
  }

  for (letter in classifications) {
    var generalClass = letter.substring(0,1),
        subClass = letter.substring(1,letter.length);
    if (restructured[generalClass]) {
      restructured[generalClass].subclasses[subClass] = { total: 0, libraries: cnData[letter] };
      restructured[generalClass].subclasses[subClass].total += d3.sum(cnData[letter]);
    } else {
      restructured[generalClass] = { total: 0, subclasses: {}, libraries: empty.slice() };
      restructured[generalClass].subclasses[generalClass] = { total: 0, libraries: cnData[letter], libraryProportions: empty.slice() };
      restructured[generalClass].subclasses[generalClass].total += d3.sum(cnData[letter]);
    }
  }

  for (general in restructured) {
    if (general !== 'libraryTotals') {

      for (sub in restructured[general].subclasses) {
        restructured[general].subclasses[sub].libraries.map(function(d,i) {
          restructured[general].libraries[i] += d;
        })
      }

      restructured[general].libraryProportions = restructured[general].libraries.map(function(d,i) {
        return d / restructured['libraryTotals'][i];
      });

      for (sub in restructured[general].subclasses) {
        restructured[general].subclasses[sub].libraryProportions = restructured[general].subclasses[sub].libraries.map(function(d,i) {
          return d / restructured['libraryTotals'][i];
        });
        restructured[general].total += restructured[general].subclasses[sub].total;
      }
    }
  }

  return restructured;

}
