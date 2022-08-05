//generating perlin noise to make obstacles
function generateObstacles(holex, holey, ballx, bally){
    perlin.seed();
    //finding solid obstacles

    
    
    
    let solidObjects = {
        "width": 1000, 
        "height": 1000, 
        "obstacles":[
            {
                "polygon": [
                    new Vector(0, 0),
                    new Vector(0, 1000),
                    new Vector(-10, 1000),
                    new Vector(-10, 0)
                ],
                "restitution": 0.5
            },
            {
                "polygon": [
                    new Vector(0, 1000),
                    new Vector(1000, 1000),
                    new Vector(1000, 1010),
                    new Vector(0, 1010)
                ],
                "restitution": 0.5
            },
            {
                "polygon": [
                    new Vector(1000, 1000),
                    new Vector(1000, 0),
                    new Vector(1010, 0),
                    new Vector(1010, 1000),
                ],
                "restitution": 0.5
            },
            {
                "polygon": [
                    new Vector(1000, 0),
                    new Vector(0, 0),
                    new Vector(0, -10),
                    new Vector(1000, -10)
                ],
                "restitution": 0.5
            }
        ]
    }
    let amountOfRegenerations = -1;
    let obstacle;
    let polygons = [];
    let hasPath = false;
    while(!hasPath){
        obstacle = generateMap();
        amountOfRegenerations++;
        let obcopy = [];
        for (let x = 0; x < obstacle.length; x++){
            let thisR = [];
            for(let y = 0; y < obstacle[x].length; y++){
                thisR.push(false);
            }
            obcopy.push(thisR);
        }


        while (hasATrue(obstacle)){
            let singleOb = getGridWithSingleObstacle(obstacle);
            removeBlob(obstacle, singleOb)
            if(countSizeOfBLob(singleOb) < 25 || overHole(singleOb, holex, holey) || overBall(singleOb, ballx, bally)){
                removeBlob(obcopy, singleOb)
                continue
            }
            singleOb = convertToPoly(getOutSideEdgeInOrder(singleOb)[0])
            polygons.push(singleOb);
        }
        hasPath = checkIfPathExists(ballx, bally, holex, holey, obcopy);
    }
    console.log("Regenerated the map", amountOfRegenerations, "times")
    

    for(let i = 0; i<polygons.length; i++){
        if(polygons[i].length < 3){
            continue;
        }
        // let triangles = polyToTriangles(polygons[i]);
        // console.log(triangles);
    //    for(let j = 0; j< triangles.length; j++){
            // if(triangles[j] == undefined) continue;
            solidObjects.obstacles.push({
                "polygon" : polygons[i],
                "restitution" : 0.5
            })
    //    }
        
    }

    // finding sandboxes

    let sand = [];
    for(let x = 0.0; x<1; x+=0.01){
        let colSandboxes = [];
        for(let y = 0.0; y<1; y+=0.01){
            if(perlin.get(x*5, y*5) < -0.25){
                colSandboxes.push(true);
            } else colSandboxes.push(false);
        }
        sand.push(colSandboxes);
    }


    let sandtraps = {
        "width" : 1000,
        "height" : 1000,
        "obstacles" : [

        ]
    }



    let objects = [];
    while(hasATrue(sand)){
        let singleOb = getGridWithSingleObstacle(sand);
        removeBlob(sand, singleOb);
        if(countSizeOfBLob(singleOb) < 25 || overHole(singleOb, holex, holey) || overBall(singleOb, ballx, bally)){
            continue;
        }
        singleOb = convertToPoly(getOutSideEdgeInOrder(singleOb)[0]);
        objects.push(singleOb);
    }

    for(let i = 0; i<objects.length; i++){
        if(objects[i].length < 3){
            continue;
        }
        sandtraps.obstacles.push({
            "polygon" : objects[i]
        })
    }
    let completeList = [];
    completeList.push(solidObjects);
    completeList.push(sandtraps);
    return completeList;
}


function generateMap(){
    let obstacle = [];
    for(let x = 0.0; x<1; x+=0.01){
        let colObstacle = [];
        for(let y = 0.0; y<1; y+=0.01){
            if(perlin.get(x*5, y*5) > 0.2){
                colObstacle.push(true);
            } else colObstacle.push(false);
        }
        obstacle.push(colObstacle);
    }
    return obstacle
}

//from https://github.com/joeiddon/perlin
'use strict';
let perlin = {
    rand_vect: function(){
        let theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    },
    dot_prod_grid: function(x, y, vx, vy){
        let g_vect;
        let d_vect = {x: x - vx, y: y - vy};
        if (this.gradients[[vx,vy]]){
            g_vect = this.gradients[[vx,vy]];
        } else {
            g_vect = this.rand_vect();
            this.gradients[[vx, vy]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function(x){
        return 6*x**5 - 15*x**4 + 10*x**3;
    },
    interp: function(x, a, b){
        return a + this.smootherstep(x) * (b-a);
    },
    seed: function(){
        this.gradients = {};
        this.memory = {};
    },
    get: function(x, y) {
        if (this.memory.hasOwnProperty([x,y]))
            return this.memory[[x,y]];
        let xf = Math.floor(x);
        let yf = Math.floor(y);
        //interpolate
        let tl = this.dot_prod_grid(x, y, xf,   yf);
        let tr = this.dot_prod_grid(x, y, xf+1, yf);
        let bl = this.dot_prod_grid(x, y, xf,   yf+1);
        let br = this.dot_prod_grid(x, y, xf+1, yf+1);
        let xt = this.interp(x-xf, tl, tr);
        let xb = this.interp(x-xf, bl, br);
        let v = this.interp(y-yf, xt, xb);
        this.memory[[x,y]] = v;
        return v;
    }
}
perlin.seed();

//gives the blob of one of them
function getGridWithSingleObstacle(grid){
    let tempob = []
    for (let row = 0; row < grid.length; row++){
        let thisRow = []
        for(let col = 0; col < grid[row].length; col++){
            thisRow.push(false)
        }
        tempob.push(thisRow)
    }
    let r;
    let c;
    //find obstacle
    for (let row = 0; row < grid.length; row++){
        for(let col = 0; col < grid[row].length; col++){
            if (grid[row][col]){
                r = row;
                c = col;
            }
        }
    }

    let lookingAt = [[r, c]]
    while (lookingAt.length != 0) {
        let current = lookingAt.pop()
        if (tempob[current[0]][current[1]]){
            continue;
        }
        
        tempob[current[0]][current[1]] = true

        //not looked at yet
        for (let xmod = -1; xmod <= 1; xmod++){
            if(xmod + current[0] >= grid.length || xmod + current[0] < 0){
                continue
            }
            let xcurrent = current[0] + xmod

            for (let ymod = -1; ymod <= 1; ymod++){
                if (xmod == 0 && ymod == 0){
                    continue
                }

                //if a diagonal
                if (xmod != 0 && ymod != 0){
                    continue
                }

                if (ymod + current[1] >= grid[xcurrent].length || ymod + current[1] < 0) {
                    continue
                }
                let ycurrent = current[1] + ymod

                //point is valid on the board
                if (grid[xcurrent][ycurrent] && !tempob[xcurrent][ycurrent]){
                    lookingAt.push([xcurrent, ycurrent])
                }
            }
        }
        
    }

    return tempob
}

function removeInnerTrues(grid){
    //removes the inner points of an obstalce so it only looks at the outside of them
    let tempob = []
    for (let row = 0; row < grid.length; row++){
        let thisRow = []
        for(let col = 0; col < grid[row].length; col++){
            thisRow.push(false)
        }
        tempob.push(thisRow)
    }

    for (let x = 0; x < grid.length; x++){
        let xNotAllowed = -2
        if (x == 0){
            xNotAllowed = -1
        } else if (x == grid.length - 1){
            xNotAllowed = 1
        }

        for (let y = 0; y < grid[x].length; y++){
            if(!grid[x][y]){
                continue
            }
            
            let yNotAllowed = -2
            if (y == 0){
                yNotAllowed = -1
            } else if (y == grid[x].length - 1){
                yNotAllowed = 1
            }

            //count the adjacent trues
            let count = 0
            for (let xmod = -1; xmod <= 1; xmod++){
                if (xmod == xNotAllowed) continue

                for (let ymod = -1; ymod <= 1; ymod++){
                    if (ymod == yNotAllowed) continue
                    if (ymod == 0 && xmod == 0) continue
                    if (ymod != 0 && xmod != 0) continue

                    if (grid[x + xmod][y + ymod]){
                        count++;
                    }
                }
            }

            if (count >= 3){
                //is in the middle or the middle of a straight line, dont add
                continue
            }

            //see if in the middle of a diagonal line
            
            if (xNotAllowed == -2 && yNotAllowed == -2){ //if there are actually diagonal lines possible
                if(grid[x - 1][y - 1] && grid[x + 1][y + 1]){
                    continue
                }

                if(grid[x + 1][y - 1] && grid[x - 1][y + 1]){
                    continue
                }
            }

            //is gonna be a corner!
            tempob[x][y] = true;
        }
    }
    return tempob;
}

function hasATrue(grid){
    //returns true if there is even a single true in the grid
    for (let x = 0; x < grid.length; x++){
        for (let y = 0; y < grid[x].length; y++){
            if (grid[x][y]){
                return true;
            }
        }
    }
    return false;
}

function removeBlob(grid, ob){
    //with a grid of multiple blobs, remove the sinble blob (ob) for the grid of multiple (grid)
    for (let x = 0; x < ob.length; x++){
        for (let y = 0; y < ob[x].length; y++){
            if (ob[x][y]){
                grid[x][y] = false;
            }
        }
    }
}

function printArray(ar){
    for(let i = 0; i < ar.length; i++){
        console.log(ar[i])
    }
}

function getFirstPoint(obstacleArray){
    for (let y = 0; y < obstacleArray.length; y++){
        for(let x = 0; x < obstacleArray[y].length; x++){
            if(obstacleArray[x][y]){
                return [x, y, new Vector(x*10, y*10)]; 
            }
        }
    }
}

function removeInnerPointsFromPolygon(polygon, grid){
    let i = 0;
    while (i < polygon.length){
        if (!grid[polygon[i].y / 10][polygon[i].x / 10]){
            polygon.splice(i, 1)
            i--
        }
        i++
    }
}

function isValidDirection(x, y, direction, directionMods, grid){
    if(x + directionMods[direction][0] < 0 || x + directionMods[direction][0] >= grid[y].length || y + directionMods[direction][1] < 0 || y + directionMods[direction][1] >= grid.length){
        return false
    }
    return true
}

function getNextValidDirection(x, y, direction, directionMods, grid){
    direction++;
    direction %= 8
    let runs = 1
    while(!isValidDirection(x, y, direction, directionMods, grid)){
        direction++;
        direction %= 8
        runs++
        if (runs >= 8){
            console.log("huh?????")
        }
    }
    return direction
}

function countSizeOfBLob(grid){
    let count = 0
    for (let x = 0; x < grid.length; x++){
        for (let y = 0; y < grid[x].length; y++){
            if (grid[x][y]) {
                count++
            }
        }
    }
    return count
}

function getOutSideEdgeInOrder(grid){
    //console.log("starting...")
    let directionMods = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]]
    
    let ngrid = []
    for (let x = 0; x < grid.length; x++){
        let thisR = []
        for(let y = 0; y < grid[x].length; y++){
            thisR.push(false)
        }
        ngrid.push(thisR)
    }

    //returns both the ordered list of points, and a 2d array of the points found
    points = []
    let firstFound = false
    let x = -1;
    let y = -1;
    for (let yi = 0; yi < grid.length; yi++){
        if (firstFound){
            break;
        }
        for(let xi = 0; xi < grid[yi].length; xi++){
            if (grid[yi][xi]){
                firstFound = true
                points.push([xi, yi])
                ngrid[yi][xi] = true
                x = xi
                y = yi
                break;
            }
        }
    }

    if(x == -1 || y == -1){
        console.log("At least one of the coordinates of the obstacles were not found")
        printArray(grid)
        console.log("x: " + x + " y: " + y)
    }
    let direction = 2
    let firstx = x
    let firsty = y
    //do one manually
    direction += 7;
    direction %= 8;
    //if x or y arent valid
    if (!isValidDirection(x, y, direction, directionMods, grid)){
        direction = getNextValidDirection(x, y, direction, directionMods, grid);
    }
    while (!grid[y + directionMods[direction][1]][x + directionMods[direction][0]]){
        direction = getNextValidDirection(x, y, direction, directionMods, grid);
    }
    x += directionMods[direction][0]
    y += directionMods[direction][1]
    points.push([x,y])
    ngrid[y][x] = true;
    //now find the rest
    while(x != firstx || y!= firsty){
        direction += 7;
        direction %= 8
        if (!isValidDirection(x, y, direction, directionMods, grid)){
            direction = getNextValidDirection(x, y, direction, directionMods, grid);
        }
        while (!grid[y + directionMods[direction][1]][x + directionMods[direction][0]]){
            direction = getNextValidDirection(x, y, direction, directionMods, grid);
        }

        x += directionMods[direction][0]
        y += directionMods[direction][1]
        points.push([x,y])
        ngrid[y][x] = true;
    }
    return [points, ngrid]
}

function convertToPoly(points){
    let vectors = [];
    for(point of points){
        vectors.push(new Vector(point[0]*10, point[1]*10))
    }
    return vectors;
}


function getGrid(){
    //debugger
    let sand = [];
    for(let x = 0.0; x<1; x+=0.01){
        let colSandboxes = [];
        for(let y = 0.0; y<1; y+=0.01){
            if(perlin.get(x*5, y*5) < -0.25){
                colSandboxes.push(true);
            } else colSandboxes.push(false);
        }
        sand.push(colSandboxes);
    }
    return sand;
}

function getObsGrid(){
    let obstacle = [];
    for(let x = 0.0; x<1; x+=0.01){
        let colObstacle = [];
        for(let y = 0.0; y<1; y+=0.01){
            if(perlin.get(x*5, y*5) > 0.2){
                colObstacle.push(true);
            } else colObstacle.push(false);
        }
        obstacle.push(colObstacle);
    }
    return obstacle;
}


function overHole(obstacle, holex, holey){
    holex-=3;
    holey-=3;
    for(let x = holex; x<holex+6; x++){
        if(x<0 || x>100) continue;
        for(let y = holey; y<holey+6; y++){
            if(y<0 || y>100) continue;
            if(obstacle[y][x]){
                return true;
            }
        }
    }
    return false;
}


function overBall(obstacle, ballx, bally){
    ballx-=4;
    bally-=4;
    for(let x = ballx; x < ballx + 8; x++){
        if(x<0 || x>100) continue;
        for(let y = bally; y<bally + 8; y++){
            if(y<0 || y>100) continue;
            if(obstacle[y][x]){
                return true;
            }
        }
    }
    return false;
}
/*
for testing!
let a = [
        [false, false, false, false, false, false, false],
        [false, false, false, true, false, false, false],
        [false, false, true, true, true, false, false],
        [false, false, true, true, true, true, false],
        [false, false, true, true, true, true, false],
        [false, false, false, false, true, false, false],
        [false, false, false, false, false, false, false],
    ]
    printArray(a)
    let b = getGridWithSingleObstacle(a)
    console.log(" ")
    printArray(b)
    let c = getOutSideEdgeInOrder(b)[1]
    console.log(" ")
    printArray(c)
*/

function reduceGrid(grid){
    let ngrid = []
    for (let x = 0; x < grid.length / 4; x++){
        let thisR = []
        for(let y = 0; y < grid[x].length / 4; y++){
            thisR.push(false)
        }
        ngrid.push(thisR)
    }

    for (let x = 0; x < ngrid.length; x++){
        for(let y = 0; y < ngrid[x].length; y++){
            //find if there is a true in this subsection of 
            for(let xi = 0; xi < 4; xi++){
                for (let yi = 0; yi < 4; yi++){
                    if (grid[x * 4 + xi][y * 4 + yi]){
                        ngrid[x][y] = true;
                        break;
                    }
                }
                if (ngrid[x][y]) {
                    break;
                }
            }
        }
    }

    return ngrid
}

function checkIfPathExists(startx, starty, goalx, goaly, ogrid){
    startx = Math.floor(startx / 4);
    starty = Math.floor(starty / 4);
    goalx = Math.floor(goalx / 4);
    goaly = Math.floor(goaly / 4);
    let grid = reduceGrid(ogrid);

    //closedNodes is a 2d arrays cause thatll make it faster to check if its open are not lol
    let openNodes = [];
    let closedNodes = [];
 
    for (let x = 0; x < grid.length; x++){
        let thisR = [];
        for(let y = 0; y < grid[x].length; y++){
            thisR.push(false);
        }
        closedNodes.push(thisR);
    }

    openNodes.push([startx, starty]);
    while (openNodes.length != 0) {
        let current = openNodes.splice(0, 1)[0];
        //console.log(current)
        if (current[0] == goalx && current[1] == goaly){
            return true;
        }

        //continue searching
        for (let xChange = -1; xChange <= 1; xChange++){
            let xn = xChange + current[0];
            if (xn < 0 || xn >= grid.length){
                continue;
            }
            for (let yChange = -1; yChange <= 1; yChange++){
                if(yChange == 0 && xChange == 0){continue;}
                let yn = yChange + current[1];
                if (yn < 0 || yn >= grid[xn].length){
                    continue;
                }
                //if on an obstacle
                if (grid[xn][yn]) {continue;}
                //if in closed already (or in open)
                if (closedNodes[xn][yn]){continue;}

                //add to queue
                closedNodes[xn][yn] = true;
                openNodes.push([xn, yn]);
            }
        }
    }

    return false;
}
