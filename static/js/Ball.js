class Ball {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.lastUpated = millis();
        this.velocity = new Vector(0, 0);
        this.diameter = 25;
        this.terminalVelocity = 1320
        this.defaultFriction = 100
        this.friction = this.defaultFriction
        this.frictionVec = new Vector(0, 0)
        this.wasOnSand = false
    }

    //currently pass int he new velocity vector
    takeShotWithXY(target){
        var displaceVec = target.subtract(this.position);
        //given this distance, what velocity will we need to get there with some friction?
        displaceVec =  displaceVec.multiply(this.defaultFriction * 2)
        if (displaceVec.x != 0 && displaceVec.y != 0) {
            var velocityVec = displaceVec.divide(Math.sqrt(displaceVec.getNorm())) //oh no division by 0
        } else {
            return
        }
        this.velocity = this.velocity.add(velocityVec);
        this.frictionVec = this.velocity.normalize().multiply(-this.friction) // the opposite way. This could pose some rare glitches
        let velocityTot = this.velocity.getNorm() 
        if (velocityTot > this.terminalVelocity){
            let factor = this.terminalVelocity/velocityTot
            this.velocity.y *= factor
            this.velocity.x *= factor
        }
    }

    update(){
        var current = millis()

        //check for collision with sandtrap
        var onSand = false
        for(let obstacle of sandMap.obstacles) {
            //calculate collision
            let collision = inside([this.position.x, this.position.y], obstacle.polygon);
            //if collision occured
            if(collision){
                onSand = true
                //changing friction
                if (!this.wasOnSand){
                    this.friction = 250; // we need to change frictionVec too
                    this.frictionVec = this.velocity.normalize().multiply(-this.friction)
                    this.wasOnSand = true
                }
                break
            }
        }
        if (!onSand){
            if (this.wasOnSand){
                this.friction = 100; // we need to change frictionVec too
                this.frictionVec = this.velocity.normalize().multiply(-this.friction) 
                this.wasOnSand = false 
            }
        }

        var deltaTime = (current - this.lastUpated) / 1000
        this.lastUpated = current;
        var deltaVeloc = this.frictionVec.multiply(deltaTime)
        if (Math.abs(deltaVeloc.x) > Math.abs(this.velocity.x)){        //check to see if its switched directions

            //we will get it to go just to there and set velocity to 0. Ignore time
            this.position = this.position.add(this.velocity.multiply(this.velocity.getNorm() / 2 / this.friction))
            this.velocity.x = 0
            this.velocity.y = 0
            this.frictionVec.x = 0
            this.frictionVec.y = 0
        } else{
            var displaceVec = this.velocity.multiply(deltaTime).add(this.frictionVec.multiply(deltaTime **2 / 2))
            this.position = this.position.add(displaceVec)
        //we also need to update velocity
            this.velocity = this.velocity.add(deltaVeloc)
        }
        
        // check for collision with each obstacle
        for (let obstacle of map.obstacles) {
            //calculate collision
            let collision = checkCollision(this.position, this.diameter / 2, obstacle.polygon);
            //if a collision occured
            if (collision[0]) {
                //seperate the ball from the obstacle
                this.position = this.position.add(collision[1]);
                //modify the ball's velocity
                this.velocity = getNewVelocity(this.velocity, collision[1], obstacle.restitution);
                this.frictionVec = this.velocity.normalize().multiply(-this.friction) // the opposite way
                break;
            }
        }



    }

    display() {
        // ellipse(this.position.x * this.diameter / 10, this.position.y * this.diameter / 10, this.diameter, this.diameter);
        ellipse(this.position.x / map.width * canvas.width, this.position.y / map.height * canvas.height, this.diameter / map.width * canvas.width, this.diameter / map.width * canvas.width);
    }
}