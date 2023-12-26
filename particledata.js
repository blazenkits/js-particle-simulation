function cfn_gel_physics(particle, dt){
    if(particle.get('lifespan') < Infinity){
        particle.ticks++;
        if(particle.ticks == particle.get('lifespan')){
            particle.deactivate();
            return;
        }
    }
    // _ N _
    // W X E
    // _ S _
    // Get occupancy of SE and SW and S
    let SE = simulation.isOccupied(particle.x + 1, particle.y + 1, null);
    let SW = simulation.isOccupied(particle.x - 1, particle.y + 1, null);
    let S = simulation.isOccupied(particle.x, particle.y + 1, null);

    
    particle.vx += (simulation.pressure_grid.get(particle.x, particle.y, 0) / particle.get('mass') / 100)
    particle.vy += (simulation.pressure_grid.get(particle.x, particle.y, 1) / particle.get('mass') / 100)
    if(S && SE && SW && Math.abs(particle.vx) < 0.1 && Math.abs(particle.vy) < 0.1){return;}

    // Unset current pos
    simulation.unsetGrid(particle.x, particle.y);
    let aboveGround = simulation.isAboveGround(particle.x, particle.y); // Will be changed to more abstract
    // When grounded (or falling but a particle at S)
    if(S){
        // get x direction dispersion due to local gradient
        particle.vx += ((+SE) - (+SW)) * Math.random() * particle.get('dispersion_rate') * dt;

        // if SE == SW == false, randomly collapse the "tower"
        if(!SE && !SW){
            particle.vx += (-1 + 2 * Math.random()) * particle.get('dispersion_rate') * dt
        }

        //velocity loss due to friction
        if ((particle.vy - simulation.getOccupied(particle.x, particle.y + 1, particle).vy) > -0.1){
            particle.vx *= Math.max(0, (1- particle.get('friction') * dt));
        }

        // If grounded (or early stages of S falling)
        if(simulation.getOccupied(particle.x, particle.y + 1, null).vy < 0.1){
            particle.vy = 0;
        }

    } else {
        if(aboveGround){
            
            // apply gravity
            particle.vy += particle.getGravity() * dt;
        }
    }
    
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

            let o = simulation.getOccupied(pos.x, pos.y, particle);
            let e = (particle.get('e') + o.get('e')) / 2;
            let m1 = particle.get('mass');
            let m2 = o.get('mass');

            let ca = (m1 - e * m2) / (m1 + m2)
            let cb = (m2 * (1 + e))/ (m1 + m2)
            particle.vx = ca * particle.vx + cb * o.vx;
            particle.vy = ca * particle.vy + cb * o.vy;

            let da = (m1 * (1 + e)) / (m1 + m2)
            let db = (m2 - e * m1) / (m1 + m2)
            
            o.vx = da * particle.vx + db * o.vx;
            o.vy = da * particle.vy + db * o.vy;
            //let vxS = (o.vx + particle.vx)
            //let vyS = (o.vy + particle.vy)
            //particle.vx = vxS * (1 - e);
            //o.vx = vxS * e;
            //particle.vy = vyS * (1 - e);
            //o.vy = vyS * e;
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
    particle.vx += (simulation.pressure_grid[particle.x][particle.y][0] / particle.base().mass / 100)
    particle.vy += (simulation.pressure_grid[particle.x][particle.y][1] / particle.base().mass / 100)
    particle.x = Math.floor(particle._x);
    particle.y = Math.floor(particle._y);
    
    simulation.setGrid(particle);

}

function cfn_turn_into(into, velRandF = 0 ){
    return (particle, dt) => {
        let _x = particle.x; let _y = particle.y;
        particle.deactivate();
        simulation.addParticle(_x, _y, velRandF *(-1 + 2 * Math.random()), velRandF *(-1 + 2 * Math.random()), into);
    }
}

function cfn_destroy(particle, dt){particle.deactivate()};


// The Most Average Particle
default_particle = {
    name: "Default Particle",
    dispersion_rate: 10,
    friction: 10,
    mass: 1,
    interact:[],
    color:  ['#777777', 119, 119, 119],
    lifespan: Infinity,
    tooltip: " ",
    blocks_pressure: false,
    e: 0.8,
        // Coeff. of restitution.
    do_collision_sim: true,
    cohesion: 0.01
}

const Particles = {
    SAND:   1,
    ROCK:   2,
    SILT:   3,
    WATER:  4,
    ICE:    5,
    FIRE:   6,
    TNT:    7,
    GEL:    8,
    LIQUID_GEL: 9,
    DUST: 10,
    SAWDUST: 11,

    // Solids
    WALL: 12,
    FUSE: 13
    
}


const particle_data = {}

particle_data[Particles.SAND] = {
    name: "Sand",
    tooltip: "Sand, inert.",
    dispersion_rate: 10,
    friction: 10,
    mass: 1,
    cohesion: 5e-3,
    color: ['#c4c356', 196, 195, 86]
}


particle_data[Particles.ROCK] = {
    name: "Rock",
    tooltip: "Rock: Heavy, inert particles.",
    dispersion_rate: 5,
    friction: 50,
    mass: 4,
    cohesion: 5e-3,
    color: ['#9ea5b0', 158, 165, 176]
}

particle_data[Particles.SILT] = {
    name: "Silt",
    tooltip: "Finer sand. Lightweight and inert.",
    dispersion_rate: 10,
    friction: 10,
    gravity: 0.9,
    mass: 0.4,
    color: ['#f2e1cb', 242, 225, 203]
}

particle_data[Particles.WATER] = {
    name: "Pseudowater",
    tooltip: "Particle simulator's attempt at making a liquid. <br>Unrealistically high surface tension. <br>Puts out fires!",
    dispersion_rate: 30,
    friction: 0,
    gravity: 10,
    mass: 1,
    color: ['#0aa1ff', 10, 161, 255]
}

particle_data[Particles.ICE] = {
    name: "Ice",
    tooltip: "Frozen (pseudo)water. Melts. Very slippery.",
    dispersion_rate: 50,
    friction: 5,
    mass: 0.5,
    color: ['#cbe7f7', 203, 231, 247],
    interact: [[Particles.FIRE, cfn_turn_into(Particles.WATER), 10]]
}

particle_data[Particles.GEL] = {
    name: "Gel",
    tooltip: "Code bug transformed into a particle. Likes to clump up.",
    dispersion_rate: 10,
    friction: 10,
    mass: 2,
    color: ['#e3f5b8', 227, 245, 184],

    //interact: [[Particles.FIRE, cfn_turn_into(Particles.LIQUID_GEL), 10]],
    override_physics: cfn_gel_physics,
}

particle_data[Particles.LIQUID_GEL] = {
    name: "Liquid Gel",
    tooltip: "Molten gel.",
    dispersion_rate: 10,
    friction: 10,
    
    color: ['#c5d4a1', 197, 212, 161]
}

particle_data[Particles.FIRE] = {
    name: "Fire",
    tooltip: "Very hot, ignites and melts stuff.",
    dispersion_rate: 10,
    mass: 1,
    color: ['#ff9233', 255, 146, 51],
    lifespan: 400,
    gravity: -0.2,
    interact: [[Particles.WATER, cfn_destroy, 5]],
    do_collision_sim: false
}

particle_data[Particles.SAWDUST] = {
    name: "Sawdust",
    tooltip: "Extremely flammable.",
    friction: 30,
    mass: 0.6,
    gravity: 0.92,
    interact:[[Particles.FIRE, cfn_turn_into(Particles.FIRE), 3]],
    color: ['#7a6350', 122, 99, 80]
}

particle_data[Particles.DUST] = {
    name: "Dust",
    tooltip: "Extremely lightweight, also somewhat flammable.",
    friction: 30,
    mass: 0.2,
    gravity: 0.82,
    interact:[[Particles.FIRE, cfn_turn_into(Particles.FIRE), 15]],
    color: ['#a6a68b', 166, 166, 139]
}

particle_data[Particles.TNT] = {
    name: "TNT",
    tooltip: "Warning: Explosive! Ignite with fire. <hr>Explosive power: 60",
    dispersion_rate: 10,
    friction: 10,
    gravity: 14,
    mass: 4,
    color: ['#c92239', 201, 34, 57],
    pre_physics_update: function(particle, dt){
        if((simulation.update_count + Math.floor(10 * Math.random()))% 10) return;
        let match = false;
        let _x = particle.x; let _y = particle.y;
        for(let pos of [[-1, 1], [-1, 0], [-1, -1], [0, -1], [0, 1], [1, 1], [1, 0], [1, -1]]){
            if (simulation.isOccupied(particle.x + pos[0], particle.y + pos[1], null) && simulation.getOccupied(particle.x + pos[0], particle.y + pos[1], null).id == Particles.FIRE){
                
                particle.deactivate();
                match = true;
                simulation.addParticle(_x, _y, 0, 0, Particles.FIRE)//-2 + 4 * Math.random(), -Math.random(), 5);
                break;
            }
        }

        if(match){
            for(let dx of [-1, 0, 1]){
                for(let dy of [-1, 0, 1]){
                    if (simulation.isInBound(_y + dx, _y + dy)){


                        simulation.pressure_grid.set(_x + dx, _y + dy, 0, 600 * Math.sign(dx));
                        simulation.pressure_grid.set(_x + dx, _y + dy, 1, 600 * Math.sign(dy));
                        
                    }
                }
            }
            
        }
    }
}

particle_data[Particles.WALL] = {
    name: "Wall",
    tooltip: "Stops all particles in its path.",
    friction: 30,
    dispersion_rate: 0,
    gravity: 0,
    solid: true,
    color: ['#ffffff', 255, 255, 255],
    blocks_pressure: true,

    override_physics: function(particle, dt){
        particle.vx = 0
        particle.vy = 0
        simulation.setGrid(particle);
    }
}

particle_data[Particles.FUSE] = {
    name: "Quick Fuse",
    tooltip: "Solid. Will ignite rapidly.",
    friction: 30,
    dispersion_rate: 0,
    gravity: 0,
    solid: true,
    color: ['#2b5761', 43, 87, 97],
    interact:[[Particles.FIRE, cfn_turn_into(Particles.FIRE), 1]],
    override_physics: function(particle, dt){
        particle.vx = 0
        particle.vy = 0
        simulation.setGrid(particle);
    }
}