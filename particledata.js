particle_data = {
    1: {
        name: "Sand",
        dispersion_rate: 10,
        friction: 10,
        color: ["#c4c356", "#dbda88", "#a19f4c", "#d6d465"]
    },

    2: {
        name: "Rock",
        dispersion_rate: 5,
        friction: 50,
        color: ["#9ea5b0", "#dbda88", "#a19f4c", "#d6d465"]
    },

    3: {
        name: "Ice",
        dispersion_rate: 50,
        friction: 5,
        color: ["#cbe7f7", "#dbda88", "#a19f4c", "#d6d465"]
    },

    4: {
        name: "Gel",
        dispersion_rate: 10,
        friction: 10,
        color: ["#e3f5b8", "#dbda88", "#a19f4c", "#d6d465"],

        override_physics: function(particle, dt){
                
            // _ N _
            // W X E
            // _ S _
            // Get occupancy of SE and SW and S
            let SE = simulation.isOccupied(particle.x + 1, particle.y + 1, null);
            let SW = simulation.isOccupied(particle.x - 1, particle.y + 1, null);
            let S = simulation.isOccupied(particle.x, particle.y + 1, null);

            if(S && SE && SW && Math.abs(particle.vx) < 0.1 && Math.abs(particle.vy) < 0.1){return;}

            // Unset current pos
            simulation.unsetGrid(particle.x, particle.y);

            let aboveGround = simulation.isAboveGround(particle.x, particle.y); // Will be changed to more abstract
            // When grounded (or falling but a particle at S)
            if(S){
                // get x direction dispersion due to local gradient
                particle.vx += ((+SE) - (+SW)) * Math.random() * particle.base().dispersion_rate * dt;

                // if SE == SW == false, randomly collapse the "tower"


                //velocity loss due to friction
                if ((particle.vy - simulation.getOccupied(particle.x, particle.y + 1, particle).vy) > -0.1){
                    particle.vx *= Math.max(0, (1- particle.base().friction * dt));
                }

                // If grounded (or early stages of S falling)
                if(simulation.getOccupied(particle.x, particle.y + 1, null).vy < 0.1){
                    particle.vy = 0;
                }
        
            } else {
                if(aboveGround){
                    
                    // apply gravity
                    particle.vy += app.config.G * dt;
                }
            }
            
            particle._x += particle.vx;
            particle._y += particle.vy;

            if (!aboveGround){
                particle._y = app.config.PIX_HEIGHT;
                particle.vx = 0;
                particle.vy = 0;
            }

            particle._x += particle.vx;
            particle._y += particle.vy;

            let prevX = particle.x;
            let prevY = particle.y
            for(let pos of particle.getPassingPoints(particle.x, particle.y, Math.floor(particle._x), Math.floor(particle._y))){
                if(simulation.isOccupied(pos.x, pos.y, particle)){
                    particle._x = prevX;
                    particle._y = prevY;
                    break;
                }
                prevX = pos.x;
                prevY = pos.y;
            }
            
            particle.x = Math.floor(particle._x);
            particle.y = Math.floor(particle._y);
            
            simulation.setGrid(particle);

        }
        

    }
}