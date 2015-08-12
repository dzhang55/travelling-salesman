function Tour(points, matrix) { 
	// path is list of indices
	this.path = [];
	this.currPathDistance = 0;
	this.distances = matrix;

	this.pathDistance = function() {
		var d = distances[this.path[0]][this.path[this.path.length - 1]];
		for (var i = 1; i < this.path.length; i++) {
			d += distances[this.path[i - 1]][this.path[i]];
		}
	//console.log("The distance is: " + d);
		this.currPathDistance = d;
	};

	this.updatePathDistance = function(change, count) {
		this.currPathDistance += change;
	};

	this.swapPoints = function(i, j) {
		var temp = this.path[i];
		this.path[i] = this.path[j];
		this.path[j] = temp;
	};

	this.detour = function (before, insert, after) {
		return distances[before][insert] + distances[insert][after] - distances[before][after];
	};

	this.swapEdges = function (first, second) {
		this.path = this.path.slice(0, first + 1).concat(this.path.slice(first + 1, second + 1).reverse().concat(this.path.slice(second + 1)));
}

}