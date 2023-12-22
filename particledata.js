function cfn_gel_physics(particle, dt){
    
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
            particle.vy += simulation.config.G * dt;
        }
    }
    
    particle._x += particle.vx;
    particle._y += particle.vy;

    if (!aboveGround){
        particle._y = app.config.SIM_HEIGHT;
        particle.vx = 0;
        particle.vy = 0;
    }

    particle._x += particle.vx;
    particle._y += particle.vy;


    let prevX = particle.x;
    let prevY = particle.y;
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


function cfn_fire_physics(particle, dt){
                
    // _ N _
    // W X E
    // _ S _
    // Get occupancy of SE and SW and S


    // Unset current pos
    simulation.unsetGrid(particle.x, particle.y);

    particle.vx += (-0.1 + 0.2 * Math.random()) * particle.base().dispersion_rate * dt;
    particle.vy += (-1 + Math.random()) * dt;
    
    particle._x += particle.vx;
    particle._y += particle.vy;



    particle._x += particle.vx;
    particle._y += particle.vy;
    /*
    let prevX = particle.x;
    let prevY = particle.y;
    for(let pos of particle.getPassingPoints(particle.x, particle.y, Math.floor(particle._x), Math.floor(particle._y))){
        if(simulation.isOccupied(pos.x, pos.y, particle)){
            particle._x = prevX;
            particle._y = prevY;
            break;
        }
        prevX = pos.x;
        prevY = pos.y;
    }
    */
   
    particle.vx += (simulation.pressure_grid[particle.x][particle.y][0] / particle.base().mass / 100)
    particle.vy += (simulation.pressure_grid[particle.x][particle.y][1] / particle.base().mass / 100)
    particle.x = Math.floor(particle._x);
    particle.y = Math.floor(particle._y);
    
    simulation.setGrid(particle);

}

function cfn_turn_into(into){
    return (particle, dt) => {
        let _x = particle.x; let _y = particle.y;
        particle.deactivate();
        simulation.addParticle(_x, _y, 0, 0, into);
    }
}

const Particles = {
    SAND:   1,
    ROCK:   2,
    WATER:  3,
    ICE:    4,
    FIRE:   5,
    TNT:    6,
    GEL:    7,
    LIQUID_GEL: 8,
    SAWDUST: 9
    
}


const particle_data = {}

particle_data[Particles.SAND] = {
    name: "Sand",
    dispersion_rate: 10,
    friction: 10,
    mass: 1,
    color: ["#c4c356"]
}


particle_data[Particles.ROCK] = {
    name: "Rock",
    dispersion_rate: 5,
    friction: 50,
    mass: 4,
    color: ["#9ea5b0"]
}

particle_data[Particles.WATER] = {
    name: "Pseudowater",
    dispersion_rate: 30,
    friction: 0,
    gravity: 10,
    mass: 1,
    color: ["#0aa1ff"]
}

particle_data[Particles.ICE] = {
        name: "Ice",
        dispersion_rate: 50,
        friction: 5,
        mass: 0.5,
        color: ["#cbe7f7"],
        interact: [[Particles.FIRE, cfn_turn_into(Particles.WATER)]]
}

particle_data[Particles.GEL] = {
        name: "Gel",
        dispersion_rate: 10,
        friction: 10,
        mass: 2,
        color: ["#e3f5b8", "#dbda88", "#a19f4c", "#d6d465"],

        interact: [[Particles.FIRE, cfn_turn_into(Particles.LIQUID_GEL)]],
        override_physics: cfn_gel_physics,
}

particle_data[Particles.LIQUID_GEL] = {
    name: "Liquid Gel",
    dispersion_rate: 10,
    friction: 10,
    
    color: ["#c5d4a1"]
}

particle_data[Particles.FIRE] = {
        name: "Fire",
        dispersion_rate: 10,
        mass: 1,
        color: ["#ff9233", "#dbda88", "#a19f4c", "#d6d465"],

        override_physics: cfn_fire_physics
}

particle_data[Particles.SAWDUST] = {
    name: "Sawdust",
    friction: 30,
    interact:[[Particles.FIRE, cfn_turn_into(Particles.FIRE)]],
    color: ["#7a6350"]
}

particle_data[Particles.TNT] = {
    name: "TNT",
    dispersion_rate: 10,
    friction: 10,
    gravity: 14,
    mass: 4,
    color: ["#c92239"],
    pre_physics_update: function(particle, dt){
        if((simulation.update_count + Math.floor(10 * Math.random()))% 10) return;
        let should_deactivate = false;
        for(let pos of [[-1, 1], [-1, 0], [-1, -1], [0, -1], [0, 1], [1, 1], [1, 0], [1, -1]]){
            if (simulation.isOccupied(particle.x + pos[0], particle.y + pos[1], null) && simulation.getOccupied(particle.x + pos[0], particle.y + pos[1], null).id == 5){
                let _x = particle.x; let _y = particle.y;
                should_deactivate = true;
                simulation.addParticle(_x, _y, 0, 0, 5)//-2 + 4 * Math.random(), -Math.random(), 5);
                break;
            }
        }

        if(should_deactivate){
            for(let dx of [-1, 0, 1]){
                for(let dy of [-1, 0, 1]){
                    if (simulation.isInBound(particle.x + dx, particle.y + dy)){


                        simulation.pressure_grid[particle.x + dx][particle.y + dy][0] = 24 * Math.sign(dx);
                        simulation.pressure_grid[particle.x + dx][particle.y + dy][1] = 24 * Math.sign(dy);
                        
                    }
                }
            }
            particle.deactivate();
        }
    }
}