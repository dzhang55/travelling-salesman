// hardcoded
var height = 500;
var width = 960;
var N = 200;
var transitionDuration = 10000 / N;
var instantDuration = 20;

var svg = d3.select("#svg-container").append("svg")
	.attr("width", width)
	.attr("height", height);

var points = new Array(N);
var path = [];

function checkAnimation() {
	if ($("#animate").prop("checked")) {
		transitionDuration = 10000 / N;
		instantDuration = 20;
	} else {
		transitionDuration = 0;
		instantDuration = 0;
	}
}

// returns a function that takes in a data array to create a path
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

function sqDistance(p1, p2) {
	return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
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
		}
	}
}

function distance(p1, p2) {
	 return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
	//return distances[Math.min(p1, p2)][Math.max(p1, p2)];
}

function distanceEdge(edge) {
	//return distances(edge[0], edge[1]);
}

function pathDistance() {
	var d = distance(path[0], path[path.length - 1]);
	for (var i = 1; i < path.length; i++) {
		d += distance(path[i - 1], path[i]);
	}
	d3.select("#distance")
		.transition()
		.duration((transitionDuration + instantDuration) * path.length)
		.text("Distance: " + d.toFixed(2));
	console.log("The distance is: " + d);
	return d;
	// d = distance(points[path[0]], points[path[path.length - 1]]);
	// for (var i = 1; i < path.length; i++) {
	// 	d += distance(points[path[i - 1]], points[path[i]]);
	// }
	// console.log("The distance is: " + d);
	// return d;
}

function drawLine(p1, p2) {
	svg.append("line")
		.attr("stroke-width", 1)
		.attr("x1", p1.x)
		.attr("y1", p1.y)
		.attr("x2", p1.x)
		.attr("y2", p1.y)
		.attr("stroke", "red")
		.transition()
		.duration(100000)
		.attr("x2", p2.x)
		.attr("y2", p2.y)
		.attr("stroke", "black");
}

function appendPath(isClosed) {
	clearLines();

	svg.selectAll("path").remove();
	var lines = svg
		.append("path")
		.attr("d", toLine(isClosed)(path))
		.attr("fill", "none")
		.attr("stroke", "black")
		.attr("stroke-width", 2);
}

function updatePath(i, isClosed) {
	// no duration so that the 2opt path doesn't flicker from transitions
	svg.selectAll("path")
		.transition()
		.duration(0)
		.delay((transitionDuration + instantDuration) * (i + 1))
		.attr("d", toLine(isClosed)(path));
	d3.timer.flush();
}

function animateEdge(i, before, insert, after) {
	// inserting into open circuit e.g. nearest neighbor
	var lineBeforeInsertion = svg.append("line")
			.attr("x1", before.x)
			.attr("y1", before.y)
			.attr("stroke-width", 3)
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
			.attr("stroke-width", 3)
			.attr("opacity", 0)
			.transition()
			.delay(i * (transitionDuration + instantDuration))
			.duration(instantDuration)
			.attr("opacity", 1)
			.transition()
			//.delay(i * transitionDuration)
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

// function updateLines() {
// 	svg.selectAll("line")
// 		.data(path, function(d, i) {
// 			if (i == path.length - 1) {
// 				return edgeToString(d, path[0]);
// 			}
// 			return edgeToString(d, path[i + 1]);
// 		})
// 		.exit()
// 		.attr("stroke", "red")
// 		.transition()
// 		.duration(1000)
// 		.remove();

// 	animateLines();
// }

function clearLines() {
	svg.selectAll("path")
		.remove();
	svg.selectAll("line")
		.remove();
}

function swap(path, i, j) {
	var clone = path.slice(0);
	var temp = clone[i];
	clone[i] = clone[j];
	clone[j] = temp;
	return clone;
}

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

//in place reordering of points using nearest neighbor heuristic
function nearestNeighbor() {
	remainingPoints = points.slice(0);
	path = [points[0]];
	appendPath();
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

function inOrder() {
	path = points.slice(0);
	appendPath(false);
	pathDistance();
}
//FUCKS UP WHEN ADDING TO END
function nearestInsertion() {
	// var remainingPoints = smallestEdge();
	// path = remainingPoints.slice(0, 2);
	path = [points[0]];
	var remainingPoints = points.slice(0);
	appendPath();
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

function detour(before, insert, after) {
	return distance(before, insert) + distance(insert, after) - distance(before, after);
}

function nearFarInsertion(farthest) {
	path = [points[0]];
	var remainingPoints = points.slice(0);
	appendPath();

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

function twoOpt() {
	// removes all scheduled transitions
	d3.selectAll("line")
	 	.remove();
	// d3.selectAll("path")
	// 	.transition();
	d3.timer.flush();
	var bestDistance = 0;
	var count = 0
	while (bestDistance != swapEdges(count)) {
		bestDistance = pathDistance();
		updatePath(count, true);
		count += 1;
	}
	//updatePath(0, true, 5000);
}

function animateEdgeSwap(count, i, i1, j, j1) {
	svg.append("line")
		.attr("x1", path[i].x)
		.attr("y1", path[i].y)
		.attr("x2", path[i1].x)
		.attr("y2", path[i1].y)
		.attr("stroke-width", 3)
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
		.attr("x1", path[j].x)
		.attr("y1", path[j].y)
		.attr("x2", path[j1].x)
		.attr("y2", path[j1].y)
		.attr("stroke-width", 3)
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
		.attr("x1", path[i].x)
		.attr("y1", path[i].y)
		.attr("x2", path[i1].x)
		.attr("y2", path[i1].y)
		.attr("stroke-width", 4)
		.attr("stroke", "red")
		.attr("opacity", 0)
		.transition()
		.delay(count * (instantDuration + transitionDuration))
		.attr("opacity", 1)
		.transition()
		.duration(transitionDuration)
		.attr("x2", path[j].x)
		.attr("y2", path[j].y)
		.remove();

	svg.append("line")
		.attr("x1", path[j].x)
		.attr("y1", path[j].y)
		.attr("x2", path[j1].x)
		.attr("y2", path[j1].y)
		.attr("stroke-width", 4)
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

function swapEdges(count) {
	console.log("2 opt!");
	// for (var k = 0; k < path.length - 1; k++) {
	// 	console.log(edgeToString(path[k], path[k + 1]));
	// }
	// console.log(edgeToString(path[path.length - 1], path[0]));
	for (var i = 0; i < path.length - 1; i++) { 
		for (var j = i + 2; j < path.length - 1; j++) {
			if ((distance(path[i], path[i + 1]) + distance(path[j], path[j + 1])) > (distance(path[i], path[j]) + distance(path[j + 1], path[i + 1]))) {
				animateEdgeSwap(count, i, i + 1, j, j + 1);
				path = path.slice(0, i + 1).concat(path.slice(i + 1, j + 1).reverse().concat(path.slice(j + 1)));
				//updateLines();
				//animateLines();
				return pathDistance();
			}
		}
	}
	return pathDistance();
}

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
$("#farthest-insertion").on("click", function() { return nearFarInsertion(true) });
$("#in-order").on("click", inOrder);
$("#2-opt").on("click", twoOpt);
// $("#2-points").on("click", twoPoints);
$("#clear").on("click", function() {
	clearLines();
	path = []
});
$("#animate").on("click", checkAnimation);