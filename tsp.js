// hardcoded
var height = 500;
var width = 960;
var N = 200;
var transitionDuration = 12000 / N;
var instantDuration = 20;
var currPathDistance = 0;
var lineWidth = 2;

var svg = d3.select("#svg-container").append("svg")
	.attr("width", width)
	.attr("height", height);

var graph = d3.select("#graph-container").append("svg")
	.attr("width", width)
	.attr("height", height / 2)
	.append("path");

var distanceStatus = svg.append("text")
	.text(function() {
		return "Distance: " + currPathDistance;
	});

var points = new Array(N);
var path = [];
var distances = [];

function initializeGraph() {

	var x = d3.scale.linear().domain([0, distances.length]).range([0, width - 5]);
	var y = d3.scale.linear().domain([distances[0], 0]).range([0, height / 2 - 5]);

	var xAxis = d3.svg.axis()	
  	  .scale(x)
  	  .orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	d3.select("#graph-container").select("svg").append("g")
		.attr("class", "axis")
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
		.interpolate("linear");

	graph
		.attr("d", graphLine(distances))
		.attr("fill", "none")
		.attr("stroke", "blue")
		.attr("stroke-width", lineWidth);
}

// updates the transition durations based on animate checkbox
function checkAnimation() {
	if ($("#animate").prop("checked")) {
		transitionDuration = 12000 / N;
		instantDuration = 20;
	} else {
		transitionDuration = 0;
		instantDuration = 0;
	}
}

// returns the d3.line function that takes in a data array to create an SVG path
function toLine(isClosed) {
	if (isClosed) {
		var interpolation = "linear-closed";
	} else {
		var interpolation = "linear";
	}
	return d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate(interpolation);
}

function generatePoints() {
	for (var i = 0; i < N; i++) {
		points[i] = {x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height)};
	}
}

function generateTestPoints() {
	points = [{x: 500, y: 100}, {x: 200, y: 100}, {x: 700, y: 400}, {x: 600, y: 200}, {x: 200, y: 400}];
}

function drawPoints() { 
	svg.selectAll("circle")
	.data(points)
	.enter()
	.append("circle")
	.attr("cx", function(d) {
		return d.x;
	})
	.attr("cy", function(d) {
		return d.y;
	})
	.attr("r", 2);
}

function drawIndices() {
	svg.selectAll("text")
		.data(points)
		.enter()
		.append("text")
		.text(function(d, i) {
			return i;
		})
		.attr("fill", "black")
		.attr("font-family", "sans-serif")
		.attr("font-size", 12)
		.attr("x", function(d) {
			return d.x + 4;
		})
		.attr("y", function(d) {
			return d.y + 4;
		});
}


function generateDistanceMatrix(points) {
	distances = new Array(N);
	for (var i = 0; i < N; i++) {
		distances[i] = []
	}

	for (var i = 0; i < N; i++) {
		for (var j = i + 1; j < N; j++) {
			distances[i][j] = Math.sqrt((points[i].x - points[j].x) *(points[i].x - points[j].x)
				 + (points[i].y - points[j].y) * (points[i].y - points[j].y));
			distances[j][i] = distances[i][j];
		}
	}
}

function pathDistance() {
	var d = distance(path[0], path[path.length - 1]);
	for (var i = 1; i < path.length; i++) {
		d += distance(path[i - 1], path[i]);
	}
	// NEED TO INCLUDE THIS
	d3.select("#distance")
		.transition()
		.duration((transitionDuration + instantDuration) * path.length)
		.text("Distance: " + d.toFixed(2));
	//console.log("The distance is: " + d);
	return d;
}

function updatePathDistance(change, count) {
	currPathDistance += change;

	// NEED TO INCLUDE THIS
	d3.select("#distance")
		.transition()
		.delay((transitionDuration + instantDuration) * count)
		.duration(transitionDuration)
		.text("Disance: " + currPathDistance.toFixed(2));
	return currPathDistance;
}

// initiliazes the path
function appendPath(path, isClosed) {
	clearLines();

	svg.selectAll("path").remove();
	var lines = svg
		.append("path")
		.attr("d", toLine(isClosed)(path))
		.attr("fill", "none")
		.attr("stroke", "black")
		.attr("stroke-width", lineWidth);
}

// chains transitions for each update of the path
function updatePath(path, i, isClosed) {
	// no duration so that the 2opt path doesn't flicker from transitions
	svg.selectAll("path")
		.transition()
		.duration(0)
		.delay((transitionDuration + instantDuration) * (i + 1))
		.attr("d", toLine(isClosed)(path));
	d3.timer.flush();
}

// animates insertion by overlaying white lines over the old edge
// and transitioning red lines to the new edges
function animateEdge(i, before, insert, after) {
	// inserting into open circuit e.g. nearest neighbor
	var lineBeforeInsertion = svg.append("line")
			.attr("x1", before.x)
			.attr("y1", before.y)
			.attr("stroke-width", lineWidth * 1.5)
			.attr("stroke", "red")
			.attr("opacity", 0);

	if (after != null) {
		var averageX = (before.x + after.x) / 2;
		var averageY = (before.y + after.y) / 2;
		lineBeforeInsertion
			.attr("x2", averageX)
			.attr("y2", averageY);

		var lineAfterInsertion = svg.append("line")
			.attr("x1", after.x)
			.attr("y1", after.y)
			.attr("x2", averageX)
			.attr("y2", averageY)
			.attr("stroke", "red")
			.attr("stroke-width", lineWidth * 1.5)
			.attr("opacity", 0)
			.transition()
			.delay(i * (transitionDuration + instantDuration))
			.duration(instantDuration)
			.attr("opacity", 1)
			.transition()
			.duration(transitionDuration)
			.attr("x2", insert.x)
			.attr("y2", insert.y)
			.remove();
	} else {
		lineBeforeInsertion
			.attr("x2", before.x)
			.attr("y2", before.y);
	}
	lineBeforeInsertion.transition()
		.delay(i * (transitionDuration + instantDuration))
		.duration(instantDuration)
		.attr("opacity", 1)
		.transition()
		.duration(transitionDuration)
		.attr("x2", insert.x)
		.attr("y2", insert.y)
		.remove();
}

// creates two white lines to cover previous edges and transitions two red lines
// to the swapped position
function animateEdgeSwap(count, i0, i1, j0, j1) {
	svg.append("line")
		.attr("x1", path[i0].x)
		.attr("y1", path[i0].y)
		.attr("x2", path[i1].x)
		.attr("y2", path[i1].y)
		.attr("stroke-width", lineWidth * 1.5)
		.attr("stroke", "white")
		.attr("opacity", 0)
		.transition()
		.delay(count * (instantDuration + transitionDuration))
		.attr("opacity", 0.5)
		.transition()
		.duration(transitionDuration)
		.attr("opacity", 1)
		.remove();

	svg.append("line")
		.attr("x1", path[j0].x)
		.attr("y1", path[j0].y)
		.attr("x2", path[j1].x)
		.attr("y2", path[j1].y)
		.attr("stroke-width", lineWidth * 1.5)
		.attr("stroke", "white")
		.attr("opacity", 0)
		.transition()
		.delay(count * (instantDuration + transitionDuration))
		.attr("opacity", 0.5)
		.transition()
		.duration(transitionDuration)
		.attr("opacity", 1)
		.remove();

	svg.append("line")
		.attr("x1", path[i0].x)
		.attr("y1", path[i0].y)
		.attr("x2", path[i1].x)
		.attr("y2", path[i1].y)
		.attr("stroke-width", lineWidth * 2)
		.attr("stroke", "red")
		.attr("opacity", 0)
		.transition()
		.delay(count * (instantDuration + transitionDuration))
		.attr("opacity", 1)
		.transition()
		.duration(transitionDuration)
		.attr("x2", path[j0].x)
		.attr("y2", path[j0].y)
		.remove();

	svg.append("line")
		.attr("x1", path[j0].x)
		.attr("y1", path[j0].y)
		.attr("x2", path[j1].x)
		.attr("y2", path[j1].y)
		.attr("stroke-width", lineWidth * 2)
		.attr("stroke", "red")
		.attr("opacity", 0)
		.transition()
		.delay(count * (instantDuration + transitionDuration))
		.attr("opacity", 1)
		.transition()
		.duration(transitionDuration)
		.attr("x1", path[i1].x)
		.attr("y1", path[i1].y)
		.remove();
}

function animateEdgeHighlight(count, i, i1, j, j1) {
	svg.append("line")
		.attr("x1", path[i].x)
		.attr("y1", path[i].y)
		.attr("x2", path[i1].x)
		.attr("y2", path[i1].y)
		.attr("stroke-width", lineWidth * 2)
		.attr("stroke", "red")
		.attr("opacity", 0)
		.transition()
		.delay(count * (instantDuration + transitionDuration))
		.attr("opacity", 1)
		.transition()
		.duration(transitionDuration)
		.remove();

	svg.append("line")
		.attr("x1", path[j].x)
		.attr("y1", path[j].y)
		.attr("x2", path[j1].x)
		.attr("y2", path[j1].y)
		.attr("stroke-width", lineWidth * 2)
		.attr("stroke", "red")
		.attr("opacity", 0)
		.transition()
		.delay(count * (instantDuration + transitionDuration))
		.attr("opacity", 1)
		.transition()
		.duration(transitionDuration)
		.remove();
}

function clearLines() {
	svg.selectAll("path")
		.remove();
	svg.selectAll("line")
		.remove();
}

// no longer in use - finds the smallest edge in the points array
function smallestEdge() {
	var smallestEdgeFirst = points.slice(0);
	var first = -1;
	var second = -1;
	var nearestSquareDistance = height * height + width * width + 1;
	for (var i = 0; i < points.length; i++) {
		for (var j = i + 1; j < points.length; j++) {
			var currSquareDistance = sqDistance(smallestEdgeFirst[i], smallestEdgeFirst[j]);
			if (currSquareDistance < nearestSquareDistance) {
				nearestSquareDistance = currSquareDistance;
				first = i;
				second = j;
			}
		}
	}
	smallestEdgeFirst = swap(smallestEdgeFirst, 0, first);
	return swap(smallestEdgeFirst, 1, second);
}

// inorder tour
function inOrder(animate) {
	var tour = new Tour(points, distances);
	appendPath(tour.path, false);
	if (animate) {
		for (var i = 0; i < points.length; i++) {
			tour.path.push(points[i])
			updatePath(tour.path, i, false);
		}
	} else {
		tour.path = points.slice(0);
		appendPath(tour.path, false);
	}
	tour.pathDistance();
	displayDistance(tour.currPathDistance);
}


// tour of points using nearest neighbor heuristic
function nearestNeighbor() {
	remainingPoints = points.slice(0);
	path = [points[0]];
	appendPath(path, false);
	for (var i = 0; i < points.length - 1; i++) {
		var nearestSquareDistance = height * height + width * width + 1;
		var nearestPoint = null;
		var index = 0;
		for (var j = i + 1; j < points.length; j++) {
			currentDistance = sqDistance(path[i], remainingPoints[j]);
			if (currentDistance < nearestSquareDistance) {
				nearestPoint = remainingPoints[j];
				nearestSquareDistance = currentDistance;
				index = j;
				//console.log("nearest point is: " + nearestPoint.x + ", " + nearestPoint.y);
			}
		}
		remainingPoints = swap(remainingPoints, i + 1, index);
		path.push(remainingPoints[i + 1]);
		animateEdge(i, remainingPoints[i], remainingPoints[i + 1], null);
		updatePath(i, false);
	}
	animateEdge(path.length - 1, remainingPoints[path.length - 1], path[0], null);
	updatePath(path.length - 1, true)
	pathDistance();
}

//deprecated - slightly faster but less optimal due to always inserting near closest point
function nearestInsertion() {
	// var remainingPoints = smallestEdge();
	// path = remainingPoints.slice(0, 2);
	path = [points[0]];
	var remainingPoints = points.slice(0);
	appendPath(path, true);
	for (var i = 1; i < points.length; i++) {
		var index = -1;
		var indexInPath = -1;
		var nearestSquareDistance = height * height + width * width + 1;
		var nearestPoint = null;
		for (var j = i; j < points.length; j++) {
			for (var k = 0; k < path.length; k++) {
				currentDistance = sqDistance(path[k], remainingPoints[j]);
				if (currentDistance < nearestSquareDistance) {
					nearestPoint = remainingPoints[j];
					nearestSquareDistance = currentDistance;
					index = j;
					indexInPath = k;
				}
			}
		}
		remainingPoints = swap(remainingPoints, index, i);
		// wrap-around
		if (indexInPath == 0) {
			var detourBefore = distance(path[path.length - 1], remainingPoints[i]) - distance(path[path.length - 1], path[indexInPath]);
		} else {
			var detourBefore = distance(path[indexInPath - 1], remainingPoints[i]) - distance(path[indexInPath - 1], path[indexInPath]);
		}
		if (indexInPath == path.length - 1) {
			var detourAfter = distance(path[0], remainingPoints[i]) - distance(path[indexInPath], path[0]);
		} else {
			var detourAfter = distance(path[indexInPath + 1], remainingPoints[i]) - distance(path[indexInPath], path[indexInPath + 1]);
		}
		if (detourBefore > detourAfter) {
			animateEdge(i, path[indexInPath], remainingPoints[i], path[indexInPath == path.length - 1 ? 0 : indexInPath + 1]);
			path.splice(indexInPath + 1, 0, remainingPoints[i]);
		} else {
			animateEdge(i, path[indexInPath == 0 ? path.length - 1 : indexInPath - 1], remainingPoints[i], path[indexInPath]);
			path.splice(indexInPath, 0, remainingPoints[i]);
		}
		updatePath(i, true);
	}
	pathDistance();
}

// tour of points using either nearest or farthest insertion heuristic
function nearFarInsertion(farthest) {
	// create initial single point subtour
	path = [points[0]];
	var remainingPoints = points.slice(0);
	appendPath(path, true);

	for (var i = 1; i < points.length; i++) {
		var indexInRemaining = 0;
		var indexInPath = 0;
		var minimalSquareDistance = height * height + width * width + 1;
		var maximalSquareDistanceToTour = -1;
		var bestPoint = null;

		for (var j = i; j < points.length; j++) {

			if (farthest) {
				minimalSquareDistance = height * height + width * width + 1;
			}

			for (var k = 0; k < path.length; k++) {
				var currentSquareDistance = sqDistance(path[k], remainingPoints[j]);

				// find minimal distance from j to a point in the subtour
				if (currentSquareDistance < minimalSquareDistance) {
					minimalSquareDistance = currentSquareDistance;

					// for nearest insertion store the closest point
					if (!farthest) {
						bestPoint = remainingPoints[j];
						indexInRemaining = j;
					}
				}
			}
			// for farthest insertion store the point whose minimal distance to the tour is maximal
			if (farthest && minimalSquareDistance > maximalSquareDistanceToTour) {
				if (minimalSquareDistance > maximalSquareDistanceToTour) {
					maximalSquareDistanceToTour = minimalSquareDistance;
					bestPoint = remainingPoints[j];
					indexInRemaining = j;
				}
			}	

		}

		remainingPoints = swap(remainingPoints, indexInRemaining, i);

		// look for the edge in the subtour where insertion would be least costly
		smallestDetour = Math.sqrt(height * height + width * width) + 1;
		for (var k = 0; k < path.length - 1; k++) {
			var currentDetour = detour(path[k], remainingPoints[i], path[k + 1]);
			if (currentDetour < smallestDetour) {
				smallestDetour = currentDetour;
				indexInPath = k;
			}
		}
		// check the detour between last point and first
		if (detour(path[path.length - 1], remainingPoints[i], path[0]) < smallestDetour) {
			animateEdge(i, path[path.length - 1], remainingPoints[i], path[0]);
			path.splice(path.length, 0, remainingPoints[i]);
		} else {
			animateEdge(i, path[indexInPath], remainingPoints[i], path[indexInPath + 1]);
			path.splice(indexInPath + 1, 0, remainingPoints[i]);
		}

		updatePath(i, true);
	}
	console.log(path.length);
	pathDistance();
}

function detour(before, insert, after) {
	return distance(before, insert) + distance(insert, after) - distance(before, after);
}

function hillClimber(step, numSteps) {
	return 0;
}

function linearSA(startTemp, step, numSteps) {
	return (1 - step / numSteps) * startTemp;
}

function exponentialSA(startTemp, step, numSteps) {
	//end temp around 1 because ln startTemp is approx 5
	return startTemp * Math.exp((0.0 - step) / numSteps * 5);
}

function simulatedAnnealing(coolingFunction) {
	distances = [];
	// N * 300
	var steps = N * 300;
	var startTemp = N / 2;
	var endTemp = 1;
	currPathDistance = pathDistance();

	var numSwaps = 0;

	//var bestDistance = Number.MAX_SAFE_INTEGER;
	for (var step = 0; step < steps; step++) {
		temp = coolingFunction(startTemp, step, steps);
		console.log(temp);
		var i = Math.floor(path.length * Math.random());
		var j = Math.floor(path.length * Math.random());
		var first = Math.min(i, j);
		var second = Math.max(i, j);

		if (first == path.length - 1) {
			first = Math.floor((path.length - 1) * Math.random());
		}

		// check edge from last point to first
		var afterSecond = second == path.length - 1 ? 0 : second + 1;
		//console.log("before: " + (distance(path[first], path[first + 1]) + distance(path[second], path[afterSecond])));
		//console.log("after: " + (distance(path[first], path[second]) + distance(path[afterSecond], path[first + 1])));
		
		var changeInDistance = distance(path[first], path[second]) + distance(path[afterSecond], path[first + 1])
			- (distance(path[first], path[first + 1]) + distance(path[second], path[afterSecond]));

		//console.log(changeInDistance);

		// always accept step if it is superior, accept with some chance if it is inferior
		if (changeInDistance < 0 || Math.random() <= Math.exp((0 - changeInDistance) / temp)) {
			if (changeInDistance > 0) {
				console.log(step + " inferior step");
			}
			numSwaps += 1;
			//if (step % 50 == 0) {
				animateEdgeSwap(step, first, first + 1, second, afterSecond);
			//	updatePath(step / 50, true);
			//}
			path = swapEdges(first, second);
			//if (currDistance < bestDistance) {
			//	bestDistance = currDistance;
			//}
			currPathDistance = pathDistance();
			distances.push(currPathDistance);
		} 
		else {
			animateEdgeHighlight(step, first, first + 1, second, afterSecond);
		//	updatePath(step / 50, true);
		}
		updatePath(step, true);
	}
	console.log("distance is " + currPathDistance);
	console.log("number of swaps: " + numSwaps);
	updatePath(step, true);
	initializeGraph();
}

function genetic() {
	var paths = []
	var popSize = 100;
	for (var i = 0; i < popSize; i++) {
		//paths[i] = points.slice(0);
		// swap random index with first
		// perform nearest neighbor
	}

	
}

// performs two opt swaps iteratively until no more advantageous swaps are found
function iterativeTwoOpt() {
	// removes all scheduled transitions
	d3.selectAll("line")
	 	.remove();
	// d3.selectAll("path")
	// 	.transition();
	d3.timer.flush();
	var bestDistance = 0;
	var count = 0
	while (bestDistance != twoOpt(count)) {
		bestDistance = pathDistance();
		updatePath(count, true);
		count += 1;
	}
}

function twoOpt(count) {
	console.log("2 opt!");
	for (var i = 0; i < path.length - 2; i++) { 
		for (var j = i + 2; j < path.length - 1; j++) {
			if ((distance(path[i], path[i + 1]) + distance(path[j], path[j + 1])) > (distance(path[i], path[j]) + distance(path[j + 1], path[i + 1]))) {
				animateEdgeSwap(count, i, i + 1, j, j + 1);
				path = swapEdges(i, j);
				return pathDistance();
			}
		}
		// check the edge from last point to first point
		if ((distance(path[i], path[i + 1]) + distance(path[j], path[0])) > (distance(path[i], path[j]) + distance(path[0], path[i + 1]))) {
			animateEdgeSwap(count, i, i + 1, j, 0);
			path = swapEdges(i, j);
			return pathDistance();
		}
	}
	return pathDistance();
}

//initializeGraph();
generatePoints();
drawPoints();
//drawIndices();


$("#nearest-neighbor").on("click", nearestNeighbor);
$("#nearest-insertion").on("click", function() {
//	checkAnimation();
	console.time("one");
	nearestInsertion();
	console.timeEnd("one");
	 });
$("#nearest-insertion-two").on("click", function() {
	console.time("two");
	nearFarInsertion(false);
	console.timeEnd("two");
	 });
$("#farthest-insertion").on("click", function() {
	console.time("fi");
	nearFarInsertion(true);
	console.timeEnd("fi");
});
$("#in-order").on("click", inOrder);
$("#hill-climber").on("click", function() {
	console.time("hc");
	simulatedAnnealing(hillClimber);
	console.timeEnd("hc");
});
$("#simulated-annealing").on("click", function() {
	console.time("sa");
	simulatedAnnealing(linearSA);
	console.timeEnd("sa");
});
$("#simulated-annealing-exp").on("click", function() {
	console.time("sa-exp");
	simulatedAnnealing(exponentialSA);
	console.timeEnd("sa-exp");
});
$("#2-opt").on("click", iterativeTwoOpt);
// $("#2-points").on("click", twoPoints);
$("#clear").on("click", function() {
	clearLines();
	path = [];
});
$("#animate").on("click", checkAnimation);