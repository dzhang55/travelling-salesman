var height = 500;
var width = 960;
var path = [];
var paths = [];
var points = [];
var swaps = [];
var insertions = [];
var isAnimate;
var pathDistances = [];
var distanceMatrix;
var N;

var solver = function (req, res) {
    points = JSON.parse(req.body.points);
    N = points.length;
    generateDistanceMatrix();
    isAnimate = req.body.animate;
    path = [];
    paths = [];
    swaps = [];
    insertions = [];
    pathDistances = [];
    var isClosed = true;
    
    // call corresponding algorithm
    switch (req.body.algorithm) {
        case 'In Order':
            inOrder();
            break;
        case 'Nearest Neighbor':
            nearestNeighbor();
            isClosed = false;
            break;
        case 'Nearest Insertion':
            nearFarInsertion(false);
            break;
        case 'Farthest Insertion':
            nearFarInsertion(true);
            break;
        case 'Iterative Two Opt':
            iterativeTwoOpt();
            break;
        case 'Hill Climber':
            if (!req.body.iterations) {
                res.send({err: 'Please fill out all fields.'});
                return;
            }
            simulatedAnnealing(hillClimber, req.body.iterations);
            break;
        case 'Simulated Annealing':
            if (!req.body.iterations) {
                res.send({err: 'Please fill out all fields.'});
                return;
            }
            if (req.body.linear) {
                simulatedAnnealing(linearSA, req.body.iterations);
            } else {
                simulatedAnnealing(exponentialSA, req.body.iterations);
            }
            break;
        case 'Genetic Algorithm':
            if (!req.body.iterations || !req.body.population) {
                res.send({err: 'Please fill out all fields.'});
                return;
            }
            genetic(req.body.iterations, req.body.population);
            break;
    }
    if (isAnimate) {
        res.send({
            paths: paths,
            distances: pathDistances,
            swaps: swaps, 
            insertions: insertions, 
            isClosed: isClosed
        });
    } else {
        res.send({
            paths: paths, 
            distances: pathDistances, 
            swaps: [], 
            insertions: [], 
            isClosed: isClosed
        });
    }
}

// store distances from each point to every other point
var generateDistanceMatrix = function () {
    distanceMatrix = new Array(N);
    for (var i = 0; i < N; i++) {
        distanceMatrix[i] = new Array(N);
    }

    for (var i = 0; i < N; i++) {
        for (var j = i; j < N; j++) {
            distanceMatrix[i][j] = Math.sqrt((points[i].x - points[j].x) * (points[i].x
                 - points[j].x) + (points[i].y - points[j].y) * (points[i].y - points[j].y));
            distanceMatrix[j][i] = distanceMatrix[i][j];
        }
    }
};

var getPathDistance = function (path) {
    var d = distanceMatrix[path[0]][path[path.length - 1]];
    for (var i = 1; i < path.length; i++) {
        d += distanceMatrix[path[i - 1]][path[i]];
    }
    return d;
};


// inorder tour
var inOrder = function () {
    path = generateRandomPath();
    pathDistances.push(getPathDistance(path));
    paths.push(path);
};

var generateRandomPath = function () {
    var path = [];
    for (var i = 0; i < N; i++) {
        path[i] = i;
    }
    path = shuffle(path);
    return path;
};


// tour of points using nearest neighbor heuristic
var nearestNeighbor = function() {
    var remaining = generateRandomPath();
    path = [remaining[0]];
    paths.push(path.slice(0));

    for (var i = 0; i < points.length - 1; i++) {
        var nearestDistance = height * height + width * width + 1;
        var nearestPoint = null;
        var indexInRemaining = 0;

        // find nearest neighbor
        for (var j = i + 1; j < points.length; j++) {
            currentDistance = distanceMatrix[path[i]][remaining[j]];
            if (currentDistance < nearestDistance) {
                nearestPoint = remaining[j];
                nearestDistance = currentDistance;
                indexInRemaining = j;
            }
        }
        // add to path and swap in remaining so it will not be added again
        remaining = swap(remaining, i + 1, indexInRemaining);
        path.push(remaining[i + 1]);
        if (isAnimate) {
            paths.push(path.slice(0));
            insertions.push({
                i: i + 1, 
                before: points[remaining[i]], 
                insert: points[remaining[i + 1]], 
                after: null
            });
        }
    }
    if (!isAnimate) {
        paths = [path];
    }
    pathDistances.push(getPathDistance(path));
};

var swap = function (path, i, j) {
    var clone = path.slice(0);
    var temp = clone[i];
    clone[i] = clone[j];
    clone[j] = temp;
    return clone;
};

// tour of points using either nearest or farthest insertion heuristic
var nearFarInsertion = function (farthest) {
    // create initial single point subtour
    var remaining = generateRandomPath();
    path = [remaining[0]];
    paths.push(path.slice(0));

    for (var i = 1; i < points.length; i++) {
        var indexInRemaining = 0;
        var indexInPath = 0;
        var minimalDistance = height * height + width * width + 1;
        var maximalDistanceToTour = -1;
        var bestPoint = null;

        for (var j = i; j < points.length; j++) {

            if (farthest) {
                minimalDistance = height * height + width * width + 1;
            }

            for (var k = 0; k < path.length; k++) {
                var currentDistance = distanceMatrix[path[k]][remaining[j]];

                // find minimal distance from j to a point in the subtour
                if (currentDistance < minimalDistance) {
                    minimalDistance = currentDistance;

                    // for nearest insertion store the closest point
                    if (!farthest) {
                        bestPoint = remaining[j];
                        indexInRemaining = j;
                    }
                }
            }
            // for farthest insertion store the point whose minimal distance to the tour is maximal
            if (farthest && minimalDistance > maximalDistanceToTour) {
                if (minimalDistance > maximalDistanceToTour) {
                    maximalDistanceToTour = minimalDistance;
                    bestPoint = remaining[j];
                    indexInRemaining = j;
                }
            }    

        }

        remaining = swap(remaining, indexInRemaining, i);

        // look for the edge in the subtour where insertion would be least costly
        smallestDetour = height * height + width * width + 1;
        for (var k = 0; k < path.length - 1; k++) {
            var currentDetour = detour(path[k], remaining[i], path[k + 1]);
            if (currentDetour < smallestDetour) {
                smallestDetour = currentDetour;
                indexInPath = k;
            }
        }
        // check the detour between last point and first
        if (detour(path[path.length - 1], remaining[i], path[0]) < smallestDetour) {
            insertions.push({
                i: i,
                before: points[path[path.length - 1]], 
                insert: points[remaining[i]], 
                after: points[path[0]]
            });
            path.splice(path.length, 0, remaining[i]);
        } else {
            insertions.push({
                i: i, 
                before: points[path[indexInPath]], 
                insert: points[remaining[i]], 
                after: points[path[indexInPath + 1]]
            });
            path.splice(indexInPath + 1, 0, remaining[i]);
        }
        if (isAnimate) {
            paths.push(path.slice(0));
        }
    }
    if (!isAnimate) {
        paths = [path];
    }
    pathDistances.push(getPathDistance(path));
};

var detour = function (before, insert, after) {
    return distanceMatrix[before][insert] + distanceMatrix[insert][after] - distanceMatrix[before][after];
};

var hillClimber = function (step, numSteps) {
    return 0;
};

var linearSA = function (startTemp, step, numSteps) {
    return (1 - step / numSteps) * startTemp;
};

var exponentialSA = function (startTemp, step, numSteps) {
    //end temp around 1 because ln startTemp is approx 5
    return startTemp * Math.exp((0.0 - step) / numSteps * 5);
};

// randomized heuristic using cooling function to determine if inferior steps should be accepted
var simulatedAnnealing = function (coolingFunction, steps) {
    if (!path.length) {
        path = generateRandomPath();
    }
    var startTemp = N / 2;
    var endTemp = 1;
    var currPathDistance = getPathDistance(path);

    var numSwaps = 0;
    paths.push(path.slice(0));

    for (var step = 0; step < steps; step++) {
        var temp = coolingFunction(startTemp, step, steps);
        var i = Math.floor(path.length * Math.random());
        var j = Math.floor(path.length * Math.random());
        var first = Math.min(i, j);
        var second = Math.max(i, j);

        if (first == path.length - 1) {
            first = Math.floor((path.length - 1) * Math.random());
        }

        // check edge from last point to first
        var afterSecond = second == path.length - 1 ? 0 : second + 1;
        
        var changeInDistance = distanceMatrix[path[first]][path[second]] 
            + distanceMatrix[path[afterSecond]][path[first + 1]]
            - distanceMatrix[path[first]][path[first + 1]] 
            - distanceMatrix[path[second]][path[afterSecond]];

        // always accept step if it is superior, accept with some chance if it is inferior
        if (changeInDistance < 0 || Math.random() <= Math.exp((0 - changeInDistance) / temp)) {
            numSwaps += 1;
            swaps.push({
                i: step, 
                firstEdge0: points[path[first]], 
                firstEdge1: points[path[first + 1]],
                secondEdge0: points[path[second]], 
                secondEdge1: points[path[afterSecond]]
            });
            path = swapEdges(path, first, second);
            paths.push(path.slice(0));
            currPathDistance = getPathDistance(path);
            pathDistances.push(currPathDistance);
        } 
    }
    if (!isAnimate) {
        paths = [path];
    }
};

var genetic = function (generations, popSize) {
    var parentPaths = [];
    var childrenPaths = [];
    //var popSize = 1000;
    //var generations = 1000;
    var mutationChance = 0.08;
    var bestDistanceSoFar = Number.MAX_VALUE;
    var bestPath = points;

    for (var i = 0; i < popSize; i++) {
        parentPaths[i] = generateRandomPath();
    }

    for (var i = 0; i < generations; i++) {
        childrenPaths = [];
        for (var j = 0; j < popSize; j++) {
            var firstParent = tournamentSelect(parentPaths);
            var secondParent = tournamentSelect(parentPaths);
            var child = orderCrossover(parentPaths[firstParent], parentPaths[secondParent]);

            if (Math.random() < mutationChance) {
                child = mutation(child);
            }
            childrenPaths.push(child);
            var childFitness = getPathDistance(child);
            if (childFitness < bestDistanceSoFar) {
                console.log(i);
                bestDistanceSoFar = childFitness;
                bestPath = child;
                //if (isAnimate) {
                //    paths.push(bestPath.slice(0));
                //}
            }
        }
        pathDistances.push(bestDistanceSoFar);
        parentPaths.length = 0;
        parentPaths = childrenPaths;
    }
    paths = [bestPath.slice(0)];
};

var shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
};

// pick the fittest out of a sample (aka tournament)
var tournamentSelect = function (paths) {
    var tournamentSize = 8;
    var fittest = -1;
    var bestDistance = Number.MAX_VALUE;
    for (var i = 0; i < tournamentSize; i++) {
        var randomIndex = Math.floor(paths.length * Math.random());
        var fitness = getPathDistance(paths[randomIndex]);
        if (fitness < bestDistance) {
            bestDistance = fitness;
            fittest = randomIndex;
        }
    }
    return fittest;
};

// crossover between two paths by keeping a subset of the first parent
// and maintaining the order of the second parent for the remaining points
var orderCrossover = function (firstPath, secondPath) {
    var firstChild = [];

    var i = Math.floor(firstPath.length * Math.random());
    var j = Math.floor(firstPath.length * Math.random());
    var first = Math.min(i, j);
    var second = Math.max(i, j);

    for (var i = first; i <= second; i++) {
        firstChild[i] = firstPath[i];
    }

    var indexInSecond = 0;
    for (var i = 0; i < firstPath.length; i++) {
        if (i >= first && i <= second) {
            continue;
        }
        // omit points already added
        while (contains(firstChild, secondPath[indexInSecond], first, second)) {
            indexInSecond++;
        }
        firstChild[i] = secondPath[indexInSecond];
        indexInSecond++;
    }
    return firstChild;
};

var mutation = function (child) {
    var i = Math.floor(child.length * Math.random());
    var j = Math.floor(child.length * Math.random());
    var first = Math.min(i, j);
    var second = Math.max(i, j);

    if (first == child.length - 1) {
        first = Math.floor((child.length - 1) * Math.random());
    }

    // check edge from last point to first
    var afterSecond = second == child.length - 1 ? 0 : second + 1;

    var changeInDistance = distanceMatrix[child[first]][child[second]] 
        + distanceMatrix[child[afterSecond]][child[first + 1]] 
        - distanceMatrix[child[first]][child[first + 1]] 
        + distanceMatrix[child[second]][child[afterSecond]];

    child = swapEdges(child, first, second);

    return child;
};

var contains = function (childPath, point, begin, end) {
    for (var i = begin; i <= end; i++) {
        if (childPath[i] == point) {
            return true;
        }
    }
    return false;
};

// performs two opt swaps iteratively until no more advantageous swaps are found
var iterativeTwoOpt = function () {
    if (!path.length) {
        path = generateRandomPath();
    }

    var bestDistance = 0;
    var count = 0
    while (bestDistance != twoOpt(count)) {
        bestDistance = getPathDistance(path);
        pathDistances.push(bestDistance);
        count += 1;
    }
    if (!isAnimate) {
    	paths = [path];
    }
};

var twoOpt = function (count) {
    for (var i = 0; i < path.length - 2; i++) { 
        for (var j = i + 2; j < path.length - 1; j++) {
            if (distanceMatrix[path[i]][path[i + 1]] + distanceMatrix[path[j]][path[j + 1]]
                > distanceMatrix[path[i]][path[j]] + distanceMatrix[path[j + 1]][path[i + 1]]) {

                swaps.push({
                    i: count, 
                    firstEdge0: points[path[i]], 
                    firstEdge1: points[path[i + 1]],
                    secondEdge0: points[path[j]], 
                    secondEdge1: points[path[j + 1]]
                });

                path = swapEdges(path, i, j);
                paths.push(path);
                return getPathDistance(path);
            }
        }
        // check the edge from last point to first point
        if (distanceMatrix[path[i]][path[i + 1]] + distanceMatrix[path[j]][path[0]]
            > distanceMatrix[path[i]][path[j]] + distanceMatrix[path[0]][path[i + 1]]) {

            swaps.push({
                i: count, 
                firstEdge0: points[path[i]], 
                firstEdge1: points[path[i + 1]],
                secondEdge0: points[path[j]], 
                secondEdge1: points[path[0]]
            });

            path = swapEdges(path, i, j);
            paths.push(path);
            return getPathDistance(path);
        }
    }
    return getPathDistance(path);
};

var swapEdges = function (path, first, second) {
    return path.slice(0, first + 1).concat(path.slice(first + 1, second + 1)
        .reverse().concat(path.slice(second + 1)));
};


module.exports = solver;