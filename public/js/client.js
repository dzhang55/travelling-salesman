// hardcoded
var height = 500;
var width = 960;
var N = 200;
var transitionDuration = 12000 / N;
var instantDuration = 20;
var currPathDistance = 0;
var lineWidth = 2;

var point = [];
var path = [];

var svg = d3.select('#svg-container').append('svg')
    .attr('width', width)
    .attr('height', height);

var graph = d3.select('#graph-container').append('svg')
    .attr('width', width)
    .attr('height', height / 2)
    .append('path');

var updateDistanceDisplay = function (pathDistances) {
    d3.select('#distance')
        .text('Distance: ' + (pathDistances[pathDistances.length - 1]).toFixed(2));
}

var initializeGraph = function (pathDistances) {
    var x = d3.scale.linear().domain([0, pathDistances.length]).range([0, width - 5]);
    var y = d3.scale.linear().domain([pathDistances[0], 0]).range([0, height / 2 - 5]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient('left');

    d3.select('#graph-container').select('svg').append('g')
        .attr('class', 'axis')
        .call(xAxis)
        .call(yAxis);

    var graphLine = d3.svg.line()
        .x(function(d, i) {
            return x(i);
        })
        .y(function(d) {
            // hardcoded range
            return y(d);
        })
        .interpolate('linear');

    graph
        .attr('d', graphLine(pathDistances))
        .attr('fill', 'none')
        .attr('stroke', 'blue')
        .attr('stroke-width', lineWidth);
}

    // returns the d3.line function that takes in a path array to create an SVG path
var toLine = function (isClosed) {
    if (isClosed) {
        var interpolation = 'linear-closed';
    } else {
        var interpolation = 'linear';
    }
    return d3.svg.line()
    	.x(function (d) {
    		return points[d].x;
    	})
    	.y(function (d) {
    		return points[d].y;
    	})
    	.interpolate(interpolation);
};

var generatePoints = function () {
    points = [];
    for (var i = 0; i < N; i++) {
        points[i] = {x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height)};
    }
};


// utilizes enter(), update(), and exit() to transition points
var drawPoints = function () { 
    svg.selectAll('circle')
        .data(points)
        .exit()
        .transition()
        .duration(500)
        .attr('cx', function (d) {
            return width;
        })
        .attr('cy', function (d) {
            return height;
        })
        .remove();

    svg.selectAll('circle')
    .data(points)
    .transition()
    .duration(500)
    .attr('cx', function (d) {
        return d.x;
    })
    .attr('cy', function (d) {
        return d.y;
    });

    svg.selectAll('circle')
    .data(points)
    .enter()
    .append('circle')
    .attr('cx', function (d) {
        return 0;
    })
    .attr('cy', function (d) {
        return 0;
    })
    .transition()
    .duration(500)
    .attr('cx', function (d) {
        return d.x;
    })
    .attr('cy', function (d) {
        return d.y;
    })
    .attr('r', 2);
};

var drawIndices = function () {
    svg.selectAll('text')
        .data(points)
        .enter()
        .append('text')
        .text(function (d, i) {
            return i;
        })
        .attr('fill', 'black')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 12)
        .attr('x', function(d) {
            return d.x + 4;
        })
        .attr('y', function(d) {
            return d.y + 4;
        });
};

// initializes the path
var appendPath = function (path, isClosed) {
    clearLines(true);

    svg
        .append('path')
        .attr('d', toLine(isClosed)(path))
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', lineWidth);
};

// chains transitions for each update of the path
var updatePath = function (path, step, isClosed) {
    // no duration so that the 2opt path doesn't flicker from transitions
    svg.selectAll('path')
        .transition()
        .duration(0)
        .delay((transitionDuration + instantDuration) * (step + 1))
        .attr('d', toLine(isClosed)(path));
    d3.timer.flush();
};

var clearLines = function (removePath) {
    if (removePath) {
        svg.selectAll('path')
            .remove();
    }
    svg.selectAll('line')
        .remove();
    d3.timer.flush();
};

// iterates through iterations or swaps in order to chain transitions
var animate = function (paths, swaps, insertions, isClosed) {
    appendPath(paths[0], true);
    if (!swaps.length && !insertions.length) {
        updatePath(paths[0], -1, true);
        return;
    }
    for (var i = 0; i < paths.length; i++) {
        updatePath(paths[i], i, isClosed);
        if (swaps[i]) {
            animateEdgeSwap(swaps[i].i, swaps[i].firstEdge0, swaps[i].firstEdge1, swaps[i].secondEdge0, swaps[i].secondEdge1);
        }
        if (insertions[i]) {
            animateEdge(insertions[i].i, insertions[i].before, insertions[i].insert, insertions[i].after);
        }
    }
    updatePath(paths[paths.length - 1], paths.length, true);
}

// animates insertion by overlaying white lines over the old edge
// and transitioning red lines to the new edges
function animateEdge(step, before, insert, after) {

    // inserting into open circuit e.g. nearest neighbor
    var lineBeforeInsertion = svg.append('line')
            .attr('x1', before.x)
            .attr('y1', before.y)
            .attr('stroke-width', lineWidth * 1.5)
            .attr('stroke', 'red')
            .attr('opacity', 0);

    if (after != null) {
        var averageX = (before.x + after.x) / 2;
        var averageY = (before.y + after.y) / 2;
        lineBeforeInsertion
            .attr('x2', averageX)
            .attr('y2', averageY);

        var lineAfterInsertion = svg.append('line')
            .attr('x1', after.x)
            .attr('y1', after.y)
            .attr('x2', averageX)
            .attr('y2', averageY)
            .attr('stroke', 'red')
            .attr('stroke-width', lineWidth * 1.5)
            .attr('opacity', 0)
            .transition()
            .delay(step * (transitionDuration + instantDuration))
            .duration(instantDuration)
            .attr('opacity', 1)
            .transition()
            .duration(transitionDuration)
            .attr('x2', insert.x)
            .attr('y2', insert.y)
            .remove();
    } else {
        lineBeforeInsertion
            .attr('x2', before.x)
            .attr('y2', before.y);
    }
    lineBeforeInsertion.transition()
        .delay(step * (transitionDuration + instantDuration))
        .duration(instantDuration)
        .attr('opacity', 1)
        .transition()
        .duration(transitionDuration)
        .attr('x2', insert.x)
        .attr('y2', insert.y)
        .remove();
}

// creates two white lines to cover previous edges and transitions two red lines
// to the swapped position
function animateEdgeSwap(step, firstEdge0, firstEdge1, secondEdge0, secondEdge1) {
    svg.append('line')
        .attr('x1', firstEdge0.x)
        .attr('y1', firstEdge0.y)
        .attr('x2', firstEdge1.x)
        .attr('y2', firstEdge1.y)
        .attr('stroke-width', lineWidth * 1.5)
        .attr('stroke', 'white')
        .attr('opacity', 0)
        .transition()
        .delay(step * (instantDuration + transitionDuration))
        .attr('opacity', 0.5)
        .transition()
        .duration(transitionDuration)
        .attr('opacity', 1)
        .remove();

    svg.append('line')
        .attr('x1', secondEdge0.x)
        .attr('y1', secondEdge0.y)
        .attr('x2', secondEdge1.x)
        .attr('y2', secondEdge1.y)
        .attr('stroke-width', lineWidth * 1.5)
        .attr('stroke', 'white')
        .attr('opacity', 0)
        .transition()
        .delay(step * (instantDuration + transitionDuration))
        .attr('opacity', 0.5)
        .transition()
        .duration(transitionDuration)
        .attr('opacity', 1)
        .remove();

    svg.append('line')
        .attr('x1', firstEdge0.x)
        .attr('y1', firstEdge0.y)
        .attr('x2', firstEdge1.x)
        .attr('y2', firstEdge1.y)
        .attr('stroke-width', lineWidth * 2)
        .attr('stroke', 'red')
        .attr('opacity', 0)
        .transition()
        .delay(step * (instantDuration + transitionDuration))
        .attr('opacity', 1)
        .transition()
        .duration(transitionDuration)
        .attr('x2', secondEdge0.x)
        .attr('y2', secondEdge0.y)
        .remove();

    svg.append('line')
        .attr('x1', secondEdge0.x)
        .attr('y1', secondEdge0.y)
        .attr('x2', secondEdge1.x)
        .attr('y2', secondEdge1.y)
        .attr('stroke-width', lineWidth * 2)
        .attr('stroke', 'red')
        .attr('opacity', 0)
        .transition()
        .delay(step * (instantDuration + transitionDuration))
        .attr('opacity', 1)
        .transition()
        .duration(transitionDuration)
        .attr('x1', firstEdge1.x)
        .attr('y1', firstEdge1.y)
        .remove();
}

// updates number of points
$('#num-points').change(function() {
    N = $(this).val();
    transitionDuration = 12000 / N;
    generatePoints();
    drawPoints();
    clearLines(true);
    path.length = 0;
    $('#slider-value').html(N + ' Points');
});

generatePoints();
drawPoints();
