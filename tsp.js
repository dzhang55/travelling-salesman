var height = 500;
var width = 960;
var N = 100;

var svg = d3.select("#svg-container").append("svg")
	.attr("width", width)
	.attr("height", height);

var points = new Array(N);
for (var i = 0; i < N; i++) {
	points[i] = {x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height)};
}
var path = [];

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
}

function pathDistance() {
	d = distance(path[0], path[path.length - 1]);
	for (var i = 1; i < path.length; i++) {
		d += distance(path[i - 1], path[i]);
	}
	console.log("The distance is: " + d);
	return d;
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

function animateLines() {
	clearLines();

	var lines = svg.selectAll("line")
		.data(path, function(d, i) {
			if (i == path.length - 1) {
				return edgeToString(d, path[0]);
			}
			return edgeToString(d, path[i + 1]);
		});

	// lines.exit()
	// 	.attr("stroke", "red")
	// 	.transition(1000)
	// 	.remove();

	lines.enter()
		.append("line")
		.attr("stroke-width", 2)
		.attr("x1", function(d) {
			return d.x;
		})
		.attr("y1", function(d) {
			return d.y;
		})
		.attr("x2", function(d, i) {
			return d.x;
		})
		.attr("y2", function(d, i) {
			return d.y;
		})
		.attr("stroke", "red")
		.transition()
		.delay(function(d, i) {
			return i * 10;
		})
		.attr("stroke", "black")
		.attr("x2", function(d, i) {
			if (i == path.length - 1) {
				return path[0].x;
			}
			return path[i + 1].x;
		})
		.attr("y2", function(d, i) {
			if (i == path.length - 1) {
				return path[0].y;
			}
			return path[i + 1].y;
		});
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
	svg.selectAll("line")
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
	path = points.slice(0);
	for (var i = 0; i < path.length - 1; i++) {
		var nearestSquareDistance = height * height + width * width + 1;
		var nearestPoint = null;
		var index = 0;
		for (var j = i + 1; j < path.length; j++) {
			currentDistance = sqDistance(path[i], path[j]);
			if (currentDistance < nearestSquareDistance) {
				nearestPoint = path[j];
				nearestSquareDistance = currentDistance;
				index = j;
				//console.log("nearest point is: " + nearestPoint.x + ", " + nearestPoint.y);
			}
		}
		path = swap(path, i + 1, index);
	}
	console.log(edgeToString(path[0], path[1]));
	console.log(edgeToString(path[1], path[0]));
	//swapEdges();
	animateLines();
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
	bestDistance = 0;
	while (bestDistance != swapEdges()) {
		bestDistance = pathDistance();
	}
	animateLines();
}

function twoPoints() {
	bestDistance = 0;
	while (bestDistance != swapPoints()) {
		bestDistance = pathDistance();
	}
	animateLines();
}

function swapEdges() {
	console.log("2 opt!");
	// for (var k = 0; k < path.length - 1; k++) {
	// 	console.log(edgeToString(path[k], path[k + 1]));
	// }
	// console.log(edgeToString(path[path.length - 1], path[0]));
	for (var i = 0; i < path.length - 1; i++) { 
		for (var j = i + 2; j < path.length - 1; j++) {
			if ((distance(path[i], path[i + 1]) + distance(path[j], path[j + 1])) > (distance(path[i], path[j]) + distance(path[j + 1], path[i + 1]))) {
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