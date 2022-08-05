class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    getNorm() {
        return (this.x ** 2 + this.y ** 2) ** 0.5;
    }
    add(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }
    subtract(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }
    multiply(other) {
        return new Vector(this.x * other, this.y * other);
    }
    divide(other) {
        return new Vector(this.x / other, this.y / other);
    }
    floorDivide(other) {
        return new Vector(Math.floor(this.x / other), Math.floor(this.y / other));
    }
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    normalize() {
        return this.divide(this.getNorm());
    }
    round() {
        return new Vector(Math.round(this.x), Math.round(this.y));
    }
}

function checkCollision(center, radius, polygon) {
    let translationAxis = null;
    let minOverlap;
    for (let i = 0; i < polygon.length; i++) {
        let inc = (i + 1) % polygon.length;
        let normal = new Vector(polygon[inc].y - polygon[i].y, -1 * (polygon[inc].x - polygon[i].x)).normalize();
        let para = polygon[inc].subtract(polygon[i]).normalize();
        let perpOffset = normal.dot(center.subtract(polygon[i]));
        if (perpOffset > 0) {
            let centerProj = para.dot(center);
            let startProj = para.dot(polygon[i]);
            let endProj = para.dot(polygon[inc]);
            let paraOffset = 0;
            if (centerProj < startProj) {
                paraOffset = startProj - centerProj;
            }
            else if (centerProj > endProj) {
                paraOffset = centerProj - endProj;
            }
            let overlap = (radius ** 2 - paraOffset ** 2) ** 0.5 - perpOffset;
            if (overlap > 0 && (translationAxis == null || overlap < minOverlap)) {
                translationAxis = normal;
                minOverlap = overlap;
            }
        }
    }
    if (translationAxis == null) {
        return [false];
    }
    else {
        return [true, translationAxis.multiply(minOverlap)];
    }
}


//check for collision between a circle and a polygon using seperating axis theorem
//provide a vector object representing the center of the circle, an int representing its radius, and a list of vector objects representing a polygon
//returns a list containing a boolean representing a collision and a vector representing the minimum distance to seperate the circle from the polygon
function checkConvexCollision(center, radius, polygon) { //DEPRECATED
    let minIntervalDistance;
    let translationAxis;

    //for each side of the polygon
    for(let i = 0; i < polygon.length; i++) {
        let axis;
        let inc = (i + 1) % polygon.length;
        
        //get the normal of the side
        axis = new Vector(-1 * (polygon[inc].y - polygon[i].y), polygon[inc].x - polygon[i].x);
        axis = axis.normalize();

        //project the polygon onto the axis
        let projectionInterval;
        for (let i = 0; i < polygon.length; i++) {
            let dotProduct = axis.dot(polygon[i]);
            if (i == 0) {
                projectionInterval = [dotProduct, dotProduct];
            }
            else if (dotProduct < projectionInterval[0]) {
                projectionInterval[0] = dotProduct;
            }
            else if (dotProduct > projectionInterval[1]) {
                projectionInterval[1] = dotProduct;
            }
        }

        //project the center of the circle onto the axis
        let centerProjection = axis.dot(center);

        //get the distance to seperate the center projection from the polygon interval
        //if they do not overlap there is no collision (return false)
        let distA;
        let distB;
        let intervalDistance
        if (centerProjection + radius < projectionInterval[0] || projectionInterval[1] + radius < centerProjection ) {
            return [false];
        }
        else {
            distA = projectionInterval[1] + radius - centerProjection;
            distB = centerProjection + radius - projectionInterval[0];
            intervalDistance = Math.min(abs(distA), abs(distB));
        }

        //determine if the interval distance is the smallest so far. If it is then save it set translation axis accordingly
        if (i == 0 || intervalDistance < minIntervalDistance) {
            minIntervalDistance = intervalDistance;
            translationAxis = axis;
            
            //flip translation direction as necessary
            if (abs(distB) < abs(distA)) {
                translationAxis = translationAxis.multiply(-1);
            }
        }
    }
    //return collision information
    return [true, translationAxis.multiply(minIntervalDistance)];
}

function checkCircleCollision(circle1X, circle1Y, circle2X, circle2Y, circle2R) {
    var distanceX = circle1X - circle2X;
    var distanceY = circle1Y - circle2Y;
    var totalDistance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));
    
    if (totalDistance <= circle2R) {
        return totalDistance;
    }

    return;
}

//get final velocity of object after oblique collision
//provide an initial velocity a surface normal and a coefficient of restitution
//returns velocity after collision
function getNewVelocity(velocity, normal, restitution) {
    let para = new Vector(-1 * normal.y, normal.x);

    //use cramers rule to change the basis of the velocity vector
    let det = para.x * normal.y - normal.x * para.y;
    let newX = (velocity.x * normal.y - normal.x * velocity.y) / det;
    let newY = (para.x * velocity.y - velocity.x * para.y) / det;

    //apply coefficient of restitution
    newY *= -1 * restitution;

    //convert back to i hat and j hat
    return para.multiply(newX).add(normal.multiply(newY));
}