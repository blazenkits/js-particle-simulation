"use strict";

// app performs direct DOM manipulation
const app = {
    running: false,
    drawPressureGrid: false,
    canvas: null,
    toggleButton: null,
    ctx: null,
    imageData: null,
    placingID: 1,
    animationID: -1,
    pMousePos: null,

    config: { // Contains config for the App. For config of Simulation, modify the config there.
        FPS: 60,            // FPS
        HEIGHT: 800,        // Height of visible area
        WIDTH: 800,         // Width of visible area
        
        CANVAS_HEIGHT: -1,  // Height of canvas (ASSIGNED AT STARTUP)
        CANVAS_WIDTH: -1,   // Width of canvas (ASSIGNED AT STARTUP)
        PX_SIM_RATIO : 3,   // Actual pixels HEIGHT(WIDTH) * PX_SIM_RATIO

        SIM_WIDTH: null,    // Set auto
        SIM_HEIGHT: null,   // Set auto
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
        app.ctx = app.canvas.getContext("2d");
        app.particleList = document.getElementById("particle-list");
        app.config.SIM_HEIGHT = Math.floor(app.config.HEIGHT / app.config.PX_SIM_RATIO);
        app.config.SIM_WIDTH = Math.floor(app.config.WIDTH / app.config.PX_SIM_RATIO);
        app.config.CANVAS_HEIGHT = app.canvas.height;
        app.config.CANVAS_WIDTH = app.canvas.width;

        app.imageData = app.ctx.createImageData(app.config.CANVAS_WIDTH, app.config.CANVAS_HEIGHT);

        // Add event listeners
        app.canvas.addEventListener('mousedown', function(event) {
            app.isDrawing = true;
            var mousePos = app.getMousePos(app.canvas, event);
            app.pMousePos = mousePos
            simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, 0, 0, app.placingID);
        });
    
        app.canvas.addEventListener('mousemove', function(event) {
            if (app.isDrawing) {
                var mousePos = app.getMousePos(app.canvas, event);
                let launchspd = 0.1;
                simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, launchspd * (mousePos.x - app.pMousePos.x), launchspd * (mousePos.y - app.pMousePos.y), app.placingID);
                app.pMousePos = mousePos;
            }
        });
    
        app.canvas.addEventListener('mouseup', function() {
            app.isDrawing = false;
        });
    
        app.canvas.addEventListener('mouseleave', function() {
            app.isDrawing = false;
        });

    
        app.canvas.addEventListener('touchstart', function(event) {
            app.isDrawing = true;
            var mousePos = app.getMousePos(app.canvas, event.touches[0]);
            app.pMousePos = mousePos
            simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, 0, 0, app.placingID);
        });
    
        app.canvas.addEventListener('touchmove', function(event) {
            if (app.isDrawing) {
                var mousePos = app.getMousePos(app.canvas, event.touches[0]);
                let launchspd = 0.1;
                simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, launchspd * (mousePos.x - app.pMousePos.x), launchspd * (mousePos.y - app.pMousePos.y), app.placingID);
                app.pMousePos = mousePos;

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
          });

        simulation.start(app.config.SIM_WIDTH, app.config.SIM_HEIGHT, particle_data);

        for(const k of Object.keys(simulation.particleData)){
            let e = simulation.particleData[k]
            app.particleList.innerHTML += 
            '<div class="particle-item">'+
            `<button type="button" data-particleid="${k}" class="btn particle-button" style="background-color: ${(e.color || ["#000000"])[0]}" onClick="app.onParticleButtonPressed(this)"></button>`+
            `${e.name || 'Missingno.'}`+
            '</div>'
        }
        
        // Add counter update interval
        setInterval(() => {
            app.particleCounter.innerHTML = "" + simulation.count_particles();
        }, 1000);

        app.resume();
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
        simulation.update(1 / app.config.FPS);        
        app.updateCanvas();
          
        //if(this.animationID !== -1) cancelAnimationFrame(this.animationID)
        //this.animationID = requestAnimationFrame(simulation.update_canvas);
    },
    
    updateCanvas: function(e){
        /// Debug pressure view

        if(app.drawPressureGrid){
            
            for(let i = 0; i < app.config.SIM_WIDTH;i++){
                for(let j = 0; j < app.config.SIM_HEIGHT; j++){ // Iterate for every simulation pixel
                    
                    var vData = Math.floor(Math.min((Math.abs(simulation.pressure_grid[i][j][0]) + Math.abs(simulation.pressure_grid[i][j][1])) * 10, 255));
                    for(var k = 0; k < app.config.PX_SIM_RATIO; k++){
                        for(var l = 0; l < app.config.PX_SIM_RATIO; l++){ // Iterate for every real pixel in simulated pix.
                            let n = app.config.CANVAS_WIDTH * (3*j + l) + 3*i + k;
                            app.imageData.data[4*n] = 0;
                            app.imageData.data[4*n+1] = vData;    // RED (0-255);    // GREEN (0-255)
                            app.imageData.data[4*n+2] = 0;    // BLUE (0-255)
                            app.imageData.data[4*n+3] = 255; 

                        }
                    }
                }
            }
            app.ctx.putImageData(app.imageData, 0, 0);

        }
        simulation.particles.forEach((e) => {
            if(!e.active){return;}
            app.ctx.fillStyle = (simulation.particleData[e.id].color  || ["#000000"])[0];
            // Draw particles
            app.ctx.fillRect(Math.round(e.x) * app.config.PX_SIM_RATIO, Math.round(e.y) * app.config.PX_SIM_RATIO, app.config.PX_SIM_RATIO, app.config.PX_SIM_RATIO);

        })
    }
}


const simulation = {
    particles: null,        // Particles[] containing every particle
    grid: null,             // Particles[WIDTH][HEIGHT] containing position of every particle
    pressure_grid: null,    // Vec2[WIDTH][HEIGHT] containing the 'pressure gradient' of a position
    update_count: 0,        // Number of calls to update()
    particleData: null,     // Reference to data on particles

    config: {
        MAX_PARTICLES: 8000,
        WIDTH: null,        // Width of simulation (Currently auto-set in App startup)
        HEIGHT: null,       // Height of simulation
    
        G: 9.8,             // Default gravity
    },

    default_particle: {
        name: "Dev Block",
        dispersion_rate: 10,
        friction: 10,
        mass: 1,
        interact:[],
        color: ["#777777"]
    },
    
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
        simulation.pressure_grid = new Array(simulation.config.WIDTH + 10).fill().map(e => new Array(simulation.config.HEIGHT + 10).fill().map(e=> new Float32Array(2))) // Contains the pressure
    },

    update: function(dt){
        simulation.update_count++;
        app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);
        // Update pressure
        simulation.update_pressure(dt);
        simulation.particles.forEach((e) => {
            if(!e.active){return;}
            if(!simulation.isInBound(e.x, e.y)){e.deactivate(); return;}
            e.update(dt)
        });
        


    },

    update_pressure: function(dt){
        for(let i = 0; i < app.config.SIM_WIDTH; i++){
            for(let j = 0; j < app.config.SIM_HEIGHT; j++){
                const DISP_RATE = 3 * dt;       // Dispersion of pressure
                const FADE_RATE = 0 * dt;       // Loss of pressure
                let px = simulation.pressure_grid[i][j][0];
                let py = simulation.pressure_grid[i][j][1];

                // For every pixel in the x gradient direction convey the pressure
                if (simulation.isInBound(i + Math.sign(px), j)){
                    simulation.pressure_grid[i + Math.sign(px)][j][0] += DISP_RATE * px;
                    
                }

                if (simulation.isInBound(i + Math.sign(px), j + 1)){
                    simulation.pressure_grid[i + Math.sign(px)][j + 1][0] += DISP_RATE * px;
                    
                }

                if (simulation.isInBound(i + Math.sign(px), j - 1)){
                    simulation.pressure_grid[i + Math.sign(px)][j - 1][0] += DISP_RATE * px;
                    
                }

                // For every pixel in the y gradient direction convey the pressure
                if (simulation.isInBound(i + 1, j + Math.sign(py))){
                    simulation.pressure_grid[i + 1][j + Math.sign(py)][1] += DISP_RATE * py;
                }

                if (simulation.isInBound(i, j + Math.sign(py))){
                    simulation.pressure_grid[i][j + Math.sign(py)][1] += DISP_RATE * py;
                }

                if (simulation.isInBound(i - 1, j + Math.sign(py))){
                    simulation.pressure_grid[i - 1][j + Math.sign(py)][1] += DISP_RATE * py;
                }

                // Update self
                simulation.pressure_grid[i][j][0] = (1 - 3 * DISP_RATE - FADE_RATE) * px
                simulation.pressure_grid[i][j][1] = (1 - 3 * DISP_RATE - FADE_RATE) * py

            

                    
                
            }

        }




    },

    isInBound: function (x, y){
        return (y < simulation.config.HEIGHT + 5) && 0 < x && x < simulation.config.WIDTH && 0 < y;
    },

    isAboveGround: function (x, y){
        return y < app.config.SIM_HEIGHT;
    },

    // Does not check for validity
    getOccupied: function(x, y, self){
        return simulation.grid[x][y];
    },

    isOccupied: function(x, y, self){
        return (simulation.isInBound(x,y) && simulation.grid[x][y] !== undefined) && (simulation.grid[x][y] !== self);
    },

    addParticle: function(x, y, vx = 0, vy = 0, id = 1){
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
            return 1;
        }
        return -1; // Fail
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
    }

    base(){
        return simulation.particleData[this.id];
    }

    get(property){
        if(Object.hasOwn(this.base(), property)){
            return this.base()[property];
        }
        return simulation.default_particle[property];
    }
    
    update(dt){
        if(Object.hasOwn(this.base(), 'pre_physics_update')){
            this.base().pre_physics_update(this, dt);
        }
        if(!((simulation.update_count + Math.floor(10 * Math.random()))% 10)){
            for(let i of this.get('interact')){
                for(let pos of [[-1, 1], [-1, 0], [-1, -1], [0, -1], [0, 1], [1, 1], [1, 0], [1, -1]]){
                    if (simulation.isOccupied(this.x + pos[0], this.y + pos[1], null) && simulation.getOccupied(this.x + pos[0], this.y + pos[1], null).id == i[0]){
                        i[1](this, dt);
                        break;
                    }
                }
            }
        }

        if(Object.hasOwn(this.base(), 'override_physics')){
            this.base().override_physics(this, dt);
        } else {
            this.update_physics(dt);
        }

    }

    update_physics(dt){
        
        // _ N _
        // W X E
        // _ S _
        // Get occupancy of SE and SW and S
        let SE = simulation.isOccupied(this.x + 1, this.y + 1, null);
        let SW = simulation.isOccupied(this.x - 1, this.y + 1, null);
        let S = simulation.isOccupied(this.x, this.y + 1, null);

        if(S && SE && SW && Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1){return;}

        // Unset current pos
        simulation.unsetGrid(this.x, this.y);

        let aboveGround = simulation.isAboveGround(this.x, this.y); // Will be changed to more abstract
        // When grounded (or falling but a particle at S)
        if(S){
            // get x direction dispersion due to local gradient
            this.vx -= ((+SE) - (+SW)) * Math.random() * this.get('dispersion_rate') * dt;

            // if SE == SW == false, randomly collapse the "tower"
            if(!SE && !SW){
                this.vx += (-1 + 2 * Math.random()) * this.get('dispersion_rate') * dt
            }

            //velocity loss due to friction
            if ((this.vy - simulation.getOccupied(this.x, this.y + 1, this).vy) > -0.1){
                this.vx *= Math.max(0, (1- this.get('friction') * dt));
            }

            // If grounded (or early stages of S falling)
            if(simulation.getOccupied(this.x, this.y + 1, null).vy < 0.1){
                this.vy = 0;
            }
    
        } else {
            if(aboveGround){
                
                // apply gravity
                this.vy += this.getGravity() * dt;
            }
        }
        
        this.vx += (simulation.pressure_grid[this.x][this.y][0] / this.get('mass') / 100)
        this.vy += (simulation.pressure_grid[this.x][this.y][1] / this.get('mass') / 100)
        if (!aboveGround){
            this._y = app.config.SIM_HEIGHT;
            this.vx = 0;
            this.vy = 0;
        }

        this._x += this.vx;
        this._y += this.vy;

        let prevX = this.x;
        let prevY = this.y;
        for(let pos of this.getPassingPoints(this.x, this.y, Math.floor(this._x), Math.floor(this._y))){
            if(simulation.isOccupied(pos.x, pos.y, this)){
                this._x = prevX;
                this._y = prevY;
                break;
            }
            prevX = pos.x;
            prevY = pos.y;
        }
        
        this.x = Math.floor(this._x);
        this.y = Math.floor(this._y);
        
        simulation.setGrid(this);

    }
    
    getGravity(){
        if(Object.hasOwn(this.base(), 'gravity')){
            return this.base().gravity;
        } else return simulation.config.G
    }

    deactivate(){
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.active = false;
    }

    getPassingPoints = function* (a, b, c, d) {
        
        const dx = Math.abs(c - a);
        const dy = Math.abs(d - b);
        const sx = a < c ? 1 : -1;
        const sy = b < d ? 1 : -1;
        let err = dx - dy;
        let x = a;
        let y = b;
      
        while (true) {
          yield { x, y };
      
          if (x === c && y === d) {
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
        }
      
        return;
      }
}


app.start()

for(let i = 2; i < 10; i += 1){
    simulation.addParticle(10, 10 * i / app.config.PX_SIM_RATIO);
}

for(let i = 0; i < 10; i += 1){
    simulation.addParticle(15, 10 * i / app.config.PX_SIM_RATIO, 1, -1);
}