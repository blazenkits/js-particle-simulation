"use strict";

// Particle Sandbox in JS!
// 

// app performs direct DOM manipulation
const app = {
    debug_mode: false,
    running: false,
    drawPressureGrid: false,
    canvas: null,
    toggleButton: null,
    brushSizeRange: null,
    ctx: null,
    imageData: null,
    placingID: 1,
    animationID: -1,
    mousePos: {x: 0, y: 0},
    isDrawing: false,
    isErasing: false,
    mousevx: 0,
    mousevy: 0,
    brushSize: 1,

    fpsWindow: 20,
    frameTime: 0, 
    lastTime: Date.now(),


    config: { // Contains config for the App. For config of Simulation, modify the config there.
        FPS: 60,            // FPS
        HEIGHT: 800,        // Height of visible area
        WIDTH: 800,         // Width of visible area
        
        CANVAS_HEIGHT: -1,  // Height of canvas (ASSIGNED AT STARTUP)
        CANVAS_WIDTH: -1,   // Width of canvas (ASSIGNED AT STARTUP)
        PX_SIM_RATIO : 3,   // Actual pixels HEIGHT(WIDTH) * PX_SIM_RATIO

        SIM_WIDTH: null,    // Set auto
        SIM_HEIGHT: null,   // Set auto
        LAUNCH_SPEED_MUL: 0.1,
        PRESSURE_COLOR_RATIO: 5
    },

    getMousePos(canvas, event) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.floor(event.clientX - rect.left),
            y: Math.floor(event.clientY - rect.top)
        };
    },


    start: function(){
        app.canvas = document.getElementById("main-canvas");
        app.toggleButton = document.getElementById("toggle-button");
        app.particleCounter = document.getElementById("particle-counter");
        app.fpsCounter = document.getElementById("fps-counter");
        app.brushSizeRange = document.getElementById("brush-size-range");
        app.ctx = app.canvas.getContext("2d");
        app.particleList = document.getElementById("particle-list");
        app.config.SIM_HEIGHT = Math.floor(app.config.HEIGHT / app.config.PX_SIM_RATIO);
        app.config.SIM_WIDTH = Math.floor(app.config.WIDTH / app.config.PX_SIM_RATIO);
        app.config.CANVAS_HEIGHT = app.canvas.height;
        app.config.CANVAS_WIDTH = app.canvas.width;

        app.imageData = app.ctx.createImageData(app.config.CANVAS_WIDTH, app.config.CANVAS_HEIGHT);

        // Add event listeners
        app.canvas.addEventListener("contextmenu", e => e.preventDefault());

        app.canvas.addEventListener('mousedown', function(event) {
            if(event.button == 0){
                app.isDrawing = true;
                app.isErasing = false;
            }

            if(event.button == 2){
                app.isDrawing = false;
                app.isErasing = true;
            }
            var mousePos = app.getMousePos(app.canvas, event);
            app.mousePos = mousePos;
            app.mousevx = app.mousevy = 0;

            // Debug
            if(app.debug_mode && event.button == 1){
                event.preventDefault();
                console.log(simulation.getOccupied(Math.round(mousePos.x / app.config.PX_SIM_RATIO), Math.round(mousePos.y/ app.config.PX_SIM_RATIO)))
            }
        });
    
        app.canvas.addEventListener('mousemove', function(event) {
            
            var mousePos = app.getMousePos(app.canvas, event);
            if (app.isDrawing) {
                app.mousevx = app.config.LAUNCH_SPEED_MUL * (mousePos.x - app.mousePos.x);
                app.mousevy = app.config.LAUNCH_SPEED_MUL * (mousePos.y - app.mousePos.y);
            }

            if (app.isErasing) {
                app.eraseParticleFromInput()

            }
            
            app.mousePos = mousePos;
        });

        app.canvas.addEventListener('wheel', function(event) {
            event.preventDefault();
            if (event.deltaY < 0) {
                if(app.brushSize < 5){
                    app.brushSize++;
                }}
            else {if(app.brushSize > 1){
                app.brushSize--;
                }
            }
            app.brushSizeRange.value = app.brushSize;
        });
    
        app.canvas.addEventListener('mouseup', function() {
            app.isDrawing = false;
            app.isErasing = false;
        });
    
        app.canvas.addEventListener('mouseleave', function() {
            app.isDrawing = false;
        });

    
        app.canvas.addEventListener('touchstart', function(event) {
            app.isDrawing = true;
            var mousePos = app.getMousePos(app.canvas, event.touches[0]);
            app.mousePos = mousePos
            app.mousevx = app.mousevy = 0;
        });
    
        app.canvas.addEventListener('touchmove', function(event) {
            if(event.touches.length > 1) return;
            event.preventDefault();
            if (app.isDrawing) {
                var mousePos = app.getMousePos(app.canvas, event.touches[0]);
                let launchspd = 0.1;
                
                app.mousevx = app.config.LAUNCH_SPEED_MUL * (mousePos.x - app.mousePos.x);
                app.mousevy = app.config.LAUNCH_SPEED_MUL * (mousePos.y - app.mousePos.y);
                app.mousePos = mousePos;

            }
            
        });
    
        app.canvas.addEventListener('touchend', function() {
            app.isDrawing = false;
        });
    
        app.canvas.addEventListener('touchcancel', function() {
            app.isDrawing = false;
        });

        app.toggleButton.addEventListener('click', function(){
            app.toggle();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'P' || e.key === 'p') {app.toggle()}
            if (e.key === '1') {app.onDrawPressureGridButtonPressed()}
          });

        // Start the simulation
        simulation.start(app.config.SIM_WIDTH, app.config.SIM_HEIGHT, particle_data);

        // Add particle buttons
        for(const k of Object.keys(simulation.particleData)){
            let e = simulation.particleData[k]
            app.particleList.innerHTML += 
            '<div class="particle-item">'+
            `<button type="button" data-particleid="${k}" class="btn particle-button" style="background-color: ${(e.color || ["#000000"])[0]}"` 
            +  `data-bs-html="true" data-bs-toggle="tooltip" data-bs-title="${e.tooltip || "Click to select"}" data-bs-custom-class="particle-tooltip" onClick="app.onParticleButtonPressed(this)"></button>`+
            `${e.name || 'Missingno.'}`+
            '</div>'
        }
        
        
        // Bootstrap Tooltip Init
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

        // Add counter update interval
        setInterval(() => {
            app.particleCounter.innerHTML = "" + simulation.count_particles() + "/" + simulation.config.MAX_PARTICLES;
            app.fpsCounter.innerHTML = "" + (1000/app.frameTime).toFixed(1)
        }, 1000);

        app.resume();
    },

    drawParticleFromInput(){
        for(let i = -app.brushSize; i < app.brushSize; i++)
            for(let j = -app.brushSize; j < app.brushSize; j++)
                if(simulation.isAboveGround(app.mousePos.x / app.config.PX_SIM_RATIO + i, app.mousePos.y / app.config.PX_SIM_RATIO + j)){
                    simulation.addParticle(app.mousePos.x / app.config.PX_SIM_RATIO + i, app.mousePos.y / app.config.PX_SIM_RATIO + j, app.mousevx, app.mousevy, app.placingID)};
    },

    eraseParticleFromInput(){
        for(let i = -app.brushSize; i < app.brushSize; i++)
            for(let j = -app.brushSize; j < app.brushSize; j++)
                simulation.removeParticle(app.mousePos.x / app.config.PX_SIM_RATIO + i, app.mousePos.y / app.config.PX_SIM_RATIO + j, app.mousevx, app.mousevy, app.placingID);
   
    },

    switchToParticle(id){
        this.placingID = id;
    },

    onParticleButtonPressed(e){
        this.switchToParticle(parseInt(e.dataset.particleid));
        for(let i of app.particleList.getElementsByTagName("button")){
            i.classList.remove("btn-outline-primary", "particle-active-outline");
        }
        e.classList.add("btn-outline-primary", "particle-active-outline");


    },

    onDrawPressureGridButtonPressed(){
        this.drawPressureGrid = !this.drawPressureGrid;


    },

    toggle: function(){
        if(!app.running){app.resume()}else{app.pause()}
    },

    resume: function(){
        app.toggleButton.innerHTML = "Pause";
        app.running = true;
        app._updateID =  setInterval(app.update, 1000 / app.config.FPS);
    },

    pause: function(){
        app.toggleButton.innerHTML = "Resume";
        app.running = false;
        clearInterval(app._updateID);
        app._updateID = null;
    },

    update: function(){
        // Get FPS
        var nowLoop = Date.now()
        var nowFrameTime = nowLoop - app.lastTime;
        app.frameTime += (nowFrameTime - app.frameTime) / app.fpsWindow;
        app.lastTime = nowLoop;

        app.brushSize = app.brushSizeRange.value;
        
        // Update the simulation
        simulation.update(1 / app.config.FPS);
        
        if(app.isDrawing)
            app.drawParticleFromInput();        
        app.updateCanvas();
          
    },
    
    updateCanvas: function(){
        app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);
        app.imageData = app.ctx.createImageData(app.config.CANVAS_WIDTH, app.config.CANVAS_HEIGHT);
        
        // Draw the pressure
        if(app.drawPressureGrid){
            for(let i = 0; i < app.config.SIM_WIDTH; i++){
                for(let j = 0; j < app.config.SIM_HEIGHT; j++){ // Iterate for every simulation pixel

                    var vData = Math.floor(Math.max(Math.min(simulation.pressure_grid.qget(i, j) * app.config.PRESSURE_COLOR_RATIO, 255), -255));
                    var vP = (vData > 0)
                    for(var k = 0; k < app.config.PX_SIM_RATIO; k++){
                        for(var l = 0; l < app.config.PX_SIM_RATIO; l++){ // Iterate for every real pixel in simulated pix.
                            let n = app.config.CANVAS_WIDTH * (3*j + l) + 3*i + k;
                            app.imageData.data[4*n] = 0;
                            app.imageData.data[4*n+1] = vP? vData: 0;
                            app.imageData.data[4*n+2] = vP? 0 : -vData;
                            app.imageData.data[4*n+3] = 255; 

                        }
                    }
                }
            }

        }

        // Draw the particles
        const P = simulation.particles.length
        for(let i = 0; i < P; i++){
            let e = simulation.particles[i]
            if(!e.active){continue;}
            let c = e.base().color;
            for(var k = 0; k < app.config.PX_SIM_RATIO; k++){
                for(var l = 0; l < app.config.PX_SIM_RATIO; l++){
                    let n = app.config.CANVAS_WIDTH * (3*e.y + l) + 3*e.x + k;

                    app.imageData.data[4*n] = c[1];
                    app.imageData.data[4*n+1] = c[2];
                    app.imageData.data[4*n+2] = c[3];
                    app.imageData.data[4*n+3] = 255;
                }
            }
        }

        app.ctx.putImageData(app.imageData, 0, 0);
        
        
        // Draw the mouse cursor
        app.ctx.beginPath();
        app.ctx.arc(app.mousePos.x, app.mousePos.y, app.brushSize * app.config.PX_SIM_RATIO, 0, 2 * Math.PI, false);
        app.ctx.lineWidth = 1;
        app.ctx.strokeStyle = '#fff'; // Outline color
        app.ctx.stroke();
        return;
    }
}


const simulation = {
    particles: null,        // Particles[] containing every particle
    grid: null,             // Particles[WIDTH][HEIGHT] containing position of every particle
    pressure_grid: null,    // Vec2[WIDTH][HEIGHT] containing the 'pressure gradient' of a position
    velocity_grid_x: null,
    velocity_grid_y: null,
    pblock_grid: null,
    update_count: 0,        // Number of calls to update()
    particleData: null,     // Reference to data on particles
    config: {
        MAX_PARTICLES: 20000,
        WIDTH: null,        // Width of simulation (Currently auto-set in App startup)
        HEIGHT: null,       // Height of simulation
    
        G: 9.8,             // Default gravity
        COLLISION_CONST: 0.8,
        GROUND_HEIGHT: 3
    },

    default_particle: default_particle,
    
    count_particles: function(){
        let a = 0; for(let i of simulation.particles){if(i.active){a++}} return a;
    },

    start: function(sizeX, sizeY, particle_data){
        this.config.WIDTH = sizeX;
        this.config.HEIGHT = sizeY;
        this.particleData = particle_data;

        // Instantiate the arrays
        simulation.particles = new Array(simulation.config.MAX_PARTICLES).fill().map(e => new Particle(0, 0, 0, 0))
        simulation.grid = new Array(simulation.config.WIDTH + 10).fill().map(e => new Array(simulation.config.HEIGHT + 10))
        
        simulation.pressure_grid =      new Float32Array2D((simulation.config.WIDTH), (simulation.config.HEIGHT)) // Contains the pressure
        simulation.velocity_grid_x =    new Float32Array2D((simulation.config.WIDTH), (simulation.config.HEIGHT))
        simulation.velocity_grid_y =    new Float32Array2D((simulation.config.WIDTH), (simulation.config.HEIGHT))
        simulation.pblock_grid =        new Float32Array2D((simulation.config.WIDTH), (simulation.config.HEIGHT))

        // To save lookup time, pre-copy undefined base particle properties
        for(let property in this.default_particle)
            for(let particleName in this.particleData)
                if(!Object.hasOwn(this.particleData[particleName], property)){
                    this.particleData[particleName][property] = this.default_particle[property];
            }
        },



    update: function(dt){
        simulation.update_count++;
        
        // The whole pressure wave simulation works by the following formulae:
        // 1. v(X, t + dt) = v(X, t) + dt * grad[P(X, t)] * a,     as if Pressure acts as Acceleration
        // 2. v(X, t + dt) = v(X, t) * decay,                      as if Velocity is lost to heat by friction
        // 3. P(X, t + dt) = P(X, t) - b * div[Iv(X, t)] * dt,     as if incoming air molecules increase Pressure 
        // 4. P(X) undergoes smoothing with nearby pixels, to reduce interference patterns
        // a, b is a constant

        simulation.update_pressure(dt);
        simulation.update_velocity(dt);

        let j = 0
        simulation.particles.forEach(e => {
            if(!e.active){return;}
            if(!simulation.isInBound(e.x, e.y)){e.deactivate(); return;}
            e.update(dt);
        }
    );

        


    },

    update_velocity: function(dt){
        const a = 50;
        const decay = 0.99;
        for(let i = 1; i < app.config.SIM_WIDTH - 1; i++){
            for(let j = 1; j < app.config.SIM_HEIGHT - 1; j++){
            /* Update Velocity */
                let gradx = (simulation.pressure_grid.qget(i - 1, j) - simulation.pressure_grid.qget(i + 1, j));
                let grady = (simulation.pressure_grid.qget(i, j - 1) - simulation.pressure_grid.qget(i, j + 1));

                    
                    simulation.velocity_grid_x.qinc(i, j, dt * gradx * a);
                    simulation.velocity_grid_y.qinc(i, j,  dt * grady * a);

                    simulation.velocity_grid_x.qset(i, j, simulation.velocity_grid_x.qget(i, j) * decay);
                    simulation.velocity_grid_y.qset(i, j, simulation.velocity_grid_y.qget(i, j) * decay);
                }    
        }
    },

    update_pressure: function(dt){
        
        const b = 10;
        for(let i = 1; i < app.config.SIM_WIDTH - 1; i++){
            for(let j = 1; j < app.config.SIM_HEIGHT - 1; j++){
                    /* Update Pressure */

                    // Get divergence
                    let gain = 0
    
                    gain += (simulation.velocity_grid_x.qget(i - 1, j) - simulation.velocity_grid_x.qget(i + 1, j))
                    gain += (simulation.velocity_grid_y.qget(i, j - 1) - simulation.velocity_grid_y.qget(i, j + 1))

                    // Alter pressure according to divergence
                    simulation.pressure_grid.qinc(i, j, gain * dt * b);

                    // Smoothe the pressure
                    let avg = 0
                    for(let p = -1; p <= 1; p++) for(let q = -1; q <= 1; q++){
                        avg += simulation.pressure_grid.qget(i + p, j + q)
                    }
                    
                    simulation.pressure_grid.qset(i, j, avg / 9);
        }}

    },

    // Is the position in bound?
    isInBound: function (x, y){
        return (y < simulation.config.HEIGHT) && 0 < x && x < simulation.config.WIDTH && 0 < y;
    },

    
    // Is the position above ground?
    isAboveGround: function (x, y){
        return y < simulation.config.HEIGHT - simulation.config.GROUND_HEIGHT;
    },


    // Is the position occupied?
    getOccupied: function(x, y, self){
        return simulation.grid[x][y];
    },

    isOccupied: function(x, y, self){
        return (simulation.isInBound(x,y) && simulation.grid[x][y] !== undefined) && (simulation.grid[x][y] !== self);
    },
    qIsOccupied: function(x, y){
        return simulation.isInBound(x,y) && simulation.grid[x][y] !== undefined;
    },
    addParticle: function(x, y, vx = 0, vy = 0, id = 1){
        if(simulation.isOccupied(Math.floor(x), Math.floor(y), null)) return -1;
        for (let e of this.particles){
            if(e.active){continue;}
            e._x = x;
            e._y = y;
            e.x = Math.floor(x);
            e.y = Math.floor(y);
            e.vx = vx;
            e.vy = vy;
            e.active = true;
            e.id = id;
            simulation.setGrid(e);
            return 1;
        }
        return -1; // Fail
    },

    removeParticle: function(x, y){
        let _x = Math.floor(x); let _y = Math.floor(y)
        if(simulation.isOccupied(_x, _y, null)){
            simulation.getOccupied(_x, _y, null).deactivate();
            simulation.unsetGrid(_x, _y);
        }
    },
    setGrid(obj){
        if (obj.x < 0 || obj.x > simulation.config.WIDTH || obj.y < 0 || obj.y > simulation.config.HEIGHT){return -1;}
        simulation.grid[obj.x][obj.y] = obj;
        return 0;
    },

    unsetGrid(x, y){
        if (x < 0 || x > simulation.config.WIDTH || y < 0 || y > simulation.config.HEIGHT){return -1;}
        simulation.grid[x][y] = undefined;
        return 0;
    },

    iterAround: function(x, y, callback){
        for(let pos of [[-1, 1], [-1, 0], [-1, -1], [0, -1], [0, 1], [1, 1], [1, 0], [1, -1]]){
            if(callback(x + pos[0], y + pos[1])) break;
        }
    },

    getPressureGradient(origX, origY){
        let pgrad = [0, 0]
        let P = simulation.pressure_grid.get(origX, origY)
        simulation.iterAround(0, 0, (x, y) =>{
            let dirgrad = simulation.pressure_grid.get(origX + x, origY + y) - P;
            if(isNaN(dirgrad)) return;
            pgrad[0] += x * dirgrad
            pgrad[1] += y * dirgrad
        });

        return pgrad;
    }
}

// 2D array stored in 1D format
class Float32Array2D extends Float32Array{
    constructor(w, h){
        super(w * h);
        this.fill(0);
    }
    isInBound(w, h){let v = w * (simulation.config.HEIGHT) + h; return 0 < v && v < this.length}
    
    // Array lookup with bounds check
    get(w, h){
        if(h >= simulation.config.HEIGHT || h < 0) return;
        return this[w * (simulation.config.HEIGHT) + h]
    }
    set(w, h, val){
        if(h >= simulation.config.HEIGHT || h < 0) return;
        this[w * (simulation.config.HEIGHT) + h] = val}
    inc(w, h, val){
        if(h >= simulation.config.HEIGHT || h < 0) return;
        this[w * (simulation.config.HEIGHT) + h] += val
    }

    // Quick array lookup without bounds check
    qget(w, h){
        return this[w * (simulation.config.HEIGHT) + h]
    }
    qset(w, h, val){
        this[w * (simulation.config.HEIGHT) + h] = val}
    qinc(w, h, val){
        this[w * (simulation.config.HEIGHT) + h] += val
    }
}

class Particle {
    constructor(x = 0, y = 0, vx = 0, vy = 0){
        this._x = x;
        this._y = y;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.id = 0;
        this.active = false;
        this.ticks = 0;
        this.stable = false;
    }

    base(){
        return simulation.particleData[this.id];
    }

    get(property){
        return this.base()[property];
    }
    
    update(dt){
        if(Object.hasOwn(this.base(), 'pre_physics_update')){
            this.base().pre_physics_update(this, dt);
        }
        
    
        for(let i of this.get('interact')){
            if(!((Math.floor(i[2] * Math.random()))% i[2])){
                simulation.iterAround(this.x, this.y, (x, y) => {
                    let occ =simulation.getOccupied(x, y, null)
                    if (simulation.isOccupied(x, y, null) && simulation.getOccupied(x, y, null).id == i[0]){
                        i[1](this, dt, occ);
                        return true;
                    }
                });
            }
        }

        if(!this.active) return;

        if(Object.hasOwn(this.base(), 'override_physics')){
            this.base().override_physics(this, dt);
        } else {
            this.update_physics(dt);
        }

    }

    update_physics(dt){

        // Lifespan Calculation
        let LIFESPAN = this.get('lifespan')
        if(LIFESPAN < Infinity){
            this.ticks++;
            if(this.ticks >= LIFESPAN){
                this.deactivate();
                return;
            }
        }
        
        // _ N _
        // W X E
        // _ S _
        // Get occupancy of SE and SW and S
        let SE = simulation.isOccupied(this.x + 1, this.y + 1, null);
        let SW = simulation.isOccupied(this.x - 1, this.y + 1, null);
        let S = simulation.isOccupied(this.x, this.y + 1, null);


        
        // Accelerate the particle in the air velocity direction
        let m = this.get('mass')
        this.vx += simulation.velocity_grid_x.qget(this.x, this.y) / 8 / m * dt;
        this.vy += simulation.velocity_grid_y.qget(this.x, this.y)  / 8 / m * dt;
        if (this.stable && (Math.abs(this.vx) > this.get('cohesion') || Math.abs(this.vy) > this.get('cohesion') || !S)) this.stable = false;
        if (this.stable) return;
        // Unset current pos
        simulation.unsetGrid(this.x, this.y);
        let aboveGround = simulation.isAboveGround(this.x, this.y); // Will be changed to more abstract

        
        if(S){
            // When grounded
            if(!this.stable){

            // apply x direction dispersion due to local gradient
                this.vx -= ((+SE) - (+SW)) * Math.random() * this.get('dispersion_rate') * dt;
                // if SE == SW == false, randomly collapse the "tower"
                if(!SE && !SW){
                    this.vx += (-1 + 2 * Math.random()) * this.get('dispersion_rate') * dt
                }
                //velocity loss due to friction
                this.vx *= Math.max(0, (1- this.get('friction') * dt));
            }

            // If grounded (or early stages of S falling)
            let bvy = simulation.getOccupied(this.x, this.y + 1, null).vy
            if(bvy < 0.1 && bvy < this.vy){
                this.vy = bvy;
            }
            
    
        } else {
            if(aboveGround){
                // apply gravity
                this.vy += this.getGravity() * dt;
            }
        }
        
        if (!aboveGround){
            this._y = simulation.config.HEIGHT - simulation.config.GROUND_HEIGHT;
            this.vx = 0;
            this.vy = 0;
        }

        this._x += this.vx;
        this._y += this.vy;

        let prevX = this.x;
        let prevY = this.y;
        
        // Get collisions
        
        for(var pos of this.getPassingPoints(this.x, this.y, Math.floor(this._x), Math.floor(this._y))){
            if(simulation.isOccupied(pos.x, pos.y, this)){
                this._x = prevX;
                this._y = prevY;
                let o = simulation.getOccupied(pos.x, pos.y, this);
                // Actual collision simulation

                if(o.get('solid')){ this.vx = 0; this.vy = 0;}
                else if(this.get('do_collision_sim') && o.get('do_collision_sim')){
                    // This part of the code is really slow, especially in high-velocity explosions. Will have to optimize
                    const e = (this.get('e') + o.get('e')) / 2;
                    const m1 = this.get('mass');
                    const m2 = o.get('mass');
                    
                    const ca = (m1 - e * m2)
                    const cb = (m2 * (1 + e))
                    this.vx = (ca * this.vx + cb * o.vx) / (m1 + m2)
                    this.vy = (ca * this.vy + cb * o.vy) / (m1 + m2)
                    
                    const da = (m1 * (1 + e))
                    const db = (m2 - e * m1)
                    o.vx = (da * this.vx + db * o.vx) / (m1 + m2)
                    o.vy = (da * this.vy + db * o.vy) / (m1 + m2)
                    


                }
                break;
            }
            prevX = pos.x;
            prevY = pos.y;
        }
        
        this.x = Math.floor(this._x);
        this.y = Math.floor(this._y);
        
        simulation.setGrid(this);

        this.stable = (Math.abs(this.vx) < this.get('cohesion') && Math.abs(this.vy) < this.get('cohesion') && S)

    }

    
    getGravity(){
        if(Object.hasOwn(this.base(), 'gravity')){
            return this.base().gravity;
        } else return simulation.config.G;
    }

    deactivate(){
        simulation.unsetGrid(this.x, this.y);
        this.x = 0;
        this.y = 0;
        this._x = 0;
        this._y = 0;
        this.vx = 0;
        this.vy = 0;
        this.ticks = 0;
        this.active = false;
    }

    // Get all passing points in the path of the particle (uses an algorithm I forgot the name of)
    getPassingPoints = function (a, b, c, d) {
        let result = [];
        const dx = Math.abs(c - a);
        const dy = Math.abs(d - b);
        const sx = a < c ? 1 : -1;
        const sy = b < d ? 1 : -1;
        let err = dx - dy;
        let x = a;
        let y = b;
      
        while (true) {
      
          if ((x === c && y === d) || !simulation.isInBound(x, y)) {
            break;
          }
      
          const e2 = 2 * err;
      
          if (e2 > -dy) {
            err -= dy;
            x += sx;
          }
      
          if (e2 < dx) {
            err += dx;
            y += sy;
          }
          
          result.push({ x, y });
        }
      
        return result;
      }
}


// Start the app
app.start()

// Add some particles to the app
for(let i = 2; i < 10; i += 1){
    simulation.addParticle(10, 10 * i / app.config.PX_SIM_RATIO);
}

for(let i = 0; i < 10; i += 1){
    simulation.addParticle(15, 10 * i / app.config.PX_SIM_RATIO, 1, -1);
}