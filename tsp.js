// hardcoded
var height = 500;
var width = 960;
var N = 100;
var transitionDuration = 100;

var svg = d3.select("#svg-container").append("svg")
	.attr("width", width)
	.attr("height", height);

var toClosedLine = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate("linear-closed");

var toOpenLine = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate("linear");

var points = new Array(N);
var path = [];

function generatePoints() {
	for (var i = 0; i < N; i++) {
		points[i] = {x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height)};
	}
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
	console.log("distancE!!!");
	var d = distance(path[0], path[path.length - 1]);
	for (var i = 1; i < path.length; i++) {
		d += distance(path[i - 1], path[i]);
	}
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

function animateLines(isClosed) {
	if (isClosed) {
		var toLine = toClosedLine;
	} else {
		var toLine = toOpenLine;
	}
	clearLines();

	svg.selectAll("path").remove();
	var lines = svg
		//.selectAll("path")
		//.data(path)
		.append("path")
		.attr("d", toLine(path))
		.attr("fill", "none")
		.attr("stroke", "black")
		.attr("stroke-width", 2);
		//.attr("stroke-dasharray", pathDistance() + " " + pathDistance())
      	//.attr("stroke-dashoffset", pathDistance())
      	//.transition()
      	//.duration(1000)
      	//.ease("linear")
      	//.attr("stroke-dashoffset", 0);
    console.log("hello");

	//lines.transition()
	//	.attr("d", toLine(path));

		// .data(path, function(d, i) {
		// 	if (i == path.length - 1) {
		// 		return edgeToString(d, path[0]);
		// 	}
		// 	return edgeToString(d, path[i + 1]);
		// });

	// lines.exit()
	// 	.attr("stroke", "red")
	// 	.transition(1000)
	// 	.remove();

	// lines.enter()
	// 	.append("line")
	// 	.attr("stroke-width", 2)
	// 	.attr("x1", function(d) {
	// 		return d.x;
	// 	})
	// 	.attr("y1", function(d) {
	// 		return d.y;
	// 	})
	// 	.attr("x2", function(d, i) {
	// 		return d.x;
	// 	})
	// 	.attr("y2", function(d, i) {
	// 		return d.y;
	// 	})
	// 	.attr("stroke", "red")
	// 	.transition()
	// 	.delay(function(d, i) {
	// 		return i * 10;
	// 	})
	// 	.attr("stroke", "black")
	// 	.attr("x2", function(d, i) {
	// 		if (i == path.length - 1) {
	// 			return path[0].x;
	// 		}
	// 		return path[i + 1].x;
	// 	})
	// 	.attr("y2", function(d, i) {
	// 		if (i == path.length - 1) {
	// 			return path[0].y;
	// 		}
	// 		return path[i + 1].y;
	// 	});
}

function updatePath(i, isClosed) {
	if (isClosed) {
		var toLine = toClosedLine;
	} else {
		var toLine = toOpenLine;
	}
	svg.selectAll("path")
		.transition()
		.ease("linear")
//		.duration(duration)
		.delay(transitionDuration * (i + 1))
		.attr("d", toLine(path));
}

function updatePathNoInterpolate(i) {
	svg.selectAll("path")
		.transition()
		.ease("linear")
		.duration(0)
		.delay(transitionDuration * (i + 1))
		.attr("d", toClosedLine(path));
}

function animateEdge(i, before, insert, after) {
	console.log(before);
	console.log(insert);
	// inserting into open circuit e.g. nearest neighbor
	var lineBeforeInsertion = svg.append("line")
			.attr("x1", before.x)
			.attr("y1", before.y)
			.attr("stroke-width", 3)
			.attr("stroke", "red");


	if (after != null) {
		var averageX = (before.x + after.x) / 2;
		var averageY = (before.y + after.y) / 2;
		lineBeforeInsertion
			.attr("x2", averageX)
			.attr("y2", averageY);

		var lineAfterInsertion = svg.append("line")
			.attr("x1", after.x)
			.attr("y1", after.y)
			.attr("x2", averageX / 2)
			.attr("y2", averageY / 2)
			//.attr("stroke", "red")
			.transition()
			.delay(i * transitionDuration)
			.duration(transitionDuration)
			.attr("x2", insert.x)
			.attr("y2", insert.y)
			.remove()
	} else {
		lineBeforeInsertion
			.attr("x2", before.x)
			.attr("y2", before.y);
	}
	lineBeforeInsertion.transition()
		.delay(i * transitionDuration)
		.duration(transitionDuration)
		.attr("x2", insert.x)
		.attr("y2", insert.y)
		.remove();
}

function updateLines() {
	svg.selectAll("line")
		.data(path, function(d, i) {
			if (i == path.length - 1) {
				return edgeToString(d, path[0]);
			}
			return edgeToString(d, path[i + 1]);
		})
		.exit()
		.attr("stroke", "red")
		.transition()
		.duration(1000)
		.remove();

	animateLines();
}

function clearLines() {
	svg.selectAll("path")
		.remove();
}
// returns a string of the edge, with points in order by x (breaking ties with y)
function edgeToString(p1, p2) {
	if (p1.x < p2.x || (p1.x == p2.x && p1.y < p2.y)) {
		return p1.x + "," + p1.y + "," + p2.x + "," + p2.y;
	}
	else {
		return p2.x + "," + p2.y + "," + p1.x + "," + p1.y;
	}
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
	animateLines(false);
	console.log("hi");
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
	updatePath(path.length, true)
	console.log(edgeToString(path[0], path[1]));
	console.log(edgeToString(path[1], path[0]));
	//swapEdges();
	//animateLines();
	pathDistance();
}

function inOrder() {
	path = points.slice(0);
	animateLines();
	pathDistance();
}

function nearestInsertion() {
	// var remainingPoints = smallestEdge();
	// path = remainingPoints.slice(0, 2);
	path = [points[0]];
	var remainingPoints = points.slice(0);
	//console.log("length of remainingpoints: " + remainingPoints.length);
	//console.log(remainingPoints[199]);
	for (var i = 1; i < points.length; i++) {
		var index = 0;
		var indexInPath = 0;
		var nearestSquareDistance = height * height + width * width + 1;
		var nearestPoint = null;
		for (var j = i; j < points.length; j++) {
			//console.log(j);
			//console.log("path length is:" + path.length);
			for (var k = 0; k < path.length; k++) {
				currentDistance = sqDistance(path[k], remainingPoints[j]);
				if (currentDistance < nearestSquareDistance) {
					console.log(j + ", " + k);
					nearestPoint = remainingPoints[j];
					nearestSquareDistance = currentDistance;
					index = j;
					indexInPath = k;
				}
			}
		}
		remainingPoints = swap(remainingPoints, index, i);
		// wrap-around
		console.log(distance(path[indexInPath], remainingPoints[i]));
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
		//console.log("detour after: " + detourAfter);
		if (detourAfter < detourBefore) {
			path.splice(i + 1, 0, remainingPoints[i]);
		} else {
			path.splice(i, 0, remainingPoints[i]);
		}
	}
	animateLines();
	pathDistance();


}

function farthestInsertion() {
	path = [points[0]];
	var remainingPoints = points.slice(0);
	//console.log("length of remainingpoints: " + remainingPoints.length);
	//console.log(remainingPoints[199]);
	for (var i = 1; i < points.length; i++) {
		var index = 0;
		var indexInPath = 0;
		var farthestSquareDistance = 0;
		var farthest = null;
		for (var j = i; j < points.length; j++) {
			//console.log(j);
			//console.log("path length is:" + path.length);
			for (var k = 0; k < path.length; k++) {
				currentDistance = sqDistance(path[k], remainingPoints[j]);
				if (currentDistance > farthestSquareDistance) {
					console.log(j + ", " + k);
					farthestPoint = remainingPoints[j];
					farthestSquareDistance = currentDistance;
					index = j;
					indexInPath = k;
				}
			}
		}
		remainingPoints = swap(remainingPoints, index, i);
		// wrap-around
		console.log(distance(path[indexInPath], remainingPoints[i]));
		console.log(farthestPoint == remainingPoints[i]);
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
		//console.log("detour after: " + detourAfter);
		if (detourAfter < detourBefore) {
			path.splice(i + 1, 0, remainingPoints[i]);
		} else {
			path.splice(i, 0, remainingPoints[i]);
		}
	}
	animateLines();
	pathDistance();


}

function twoOpt() {
	var bestDistance = 0;
	var count = 0
	while (bestDistance != swapEdges(count * transitionDuration)) {
		bestDistance = pathDistance();
		updatePathNoInterpolate(count);
		count += 1;
	}
	//updatePath(0, true, 5000);
}

function twoPoints() {
	bestDistance = 0;
	while (bestDistance != swapPoints()) {
		bestDistance = pathDistance();
	}
	animateLines();
}

function animateEdgeSwap(delay, i, i1, j, j1) {
	console.log("animate edge swap");

	svg.append("line")
		.attr("x1", path[i].x)
		.attr("y1", path[i].y)
		.attr("x2", path[i1].x)
		.attr("y2", path[i1].y)
		.attr("stroke-width", 3)
		.attr("stroke", "white")
		.attr("opacity", 0)
		.transition()
		.delay(delay)
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
		.delay(delay)
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
		.delay(delay)
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
		.delay(delay)
		.attr("opacity", 1)
		.transition()
		.duration(transitionDuration)
		.attr("x1", path[i1].x)
		.attr("y1", path[i1].y)
		.remove();
}

function swapEdges(delay) {
	console.log("2 opt!");
	// for (var k = 0; k < path.length - 1; k++) {
	// 	console.log(edgeToString(path[k], path[k + 1]));
	// }
	// console.log(edgeToString(path[path.length - 1], path[0]));
	for (var i = 0; i < path.length - 1; i++) { 
		for (var j = i + 2; j < path.length - 1; j++) {
			if ((distance(path[i], path[i + 1]) + distance(path[j], path[j + 1])) > (distance(path[i], path[j]) + distance(path[j + 1], path[i + 1]))) {
				animateEdgeSwap(delay, i, i + 1, j, j + 1);
				path = path.slice(0, i + 1).concat(path.slice(i + 1, j + 1).reverse().concat(path.slice(j + 1)));
				//updateLines();
				//animateLines();
				return pathDistance();
			}
		}
	}
	return pathDistance();
}

//worse than swapEdges
// function swapPoints() {
// 	for (var i = 1; i < path.length - 1; i++) {
// 		for (var j = i + 2; j < path.length - 1; j++) {
// 			var beforeI = i - 1;
// 			var afterJ = j + 1;
// 			if (i == 0) {
// 				beforeI = path.length - 1;
// 			}
// 			if (j == path.length - 1) {
// 				afterJ = 0;
// 			}
// 			var afterSwap = distance(path[beforeI], path[j]) + distance(path[i + 1], path[j]) + distance(path[j - 1], path[i]) + distance(path[afterJ], path[i]);
// 			var beforeSwap = distance(path[beforeI], path[i]) + distance(path[i + 1], path[i]) + distance(path[j - 1], path[j]) + distance(path[afterJ], path[j]);
// 			if (afterSwap < beforeSwap) {
// 				console.log(i + ", " + j);
// 				console.log(afterSwap);
// 				console.log(beforeSwap);
// 				console.log("Swap");
// 				swap = path[i];
// 				path[i] = path[j];
// 				path[j] = swap;
// 				return pathDistance();
// 			}
// 		}
// 	}
// 	return pathDistance();
// }
generatePoints();
drawPoints();

$("#nearest-neighbor").on("click", nearestNeighbor);
$("#nearest-insertion").on("click", nearestInsertion);
$("#farthest-insertion").on("click", farthestInsertion);
$("#in-order").on("click", inOrder);
$("#2-opt").on("click", twoOpt);
// $("#2-points").on("click", twoPoints);
$("#clear").on("click", function() {
	clearLines();
	path = []
});