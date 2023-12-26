"use strict";

// Particle Sandbox in JS. Copyright Kevin Choe, 2023.

// app performs direct DOM manipulation
const app = {
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
        LAUNCH_SPEED_MUL: 0.1
    },

    getMousePos(canvas, event) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.floor(event.clientX - rect.left),
            y: Math.floor(event.clientY - rect.top)
        };
    },


    start: function(){
        console.log("App starting(", Math.round(Math.random() * 100000), ")");        
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

        simulation.start(app.config.SIM_WIDTH, app.config.SIM_HEIGHT, particle_data);

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
                simulation.addParticle(app.mousePos.x / app.config.PX_SIM_RATIO + i, app.mousePos.y / app.config.PX_SIM_RATIO + j, app.mousevx, app.mousevy, app.placingID);
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
        simulation.update(1 / app.config.FPS);
        if(app.isDrawing)
            app.drawParticleFromInput();        
        app.updateCanvas();
          
        //if(this.animationID !== -1) cancelAnimationFrame(this.animationID)
        //this.animationID = requestAnimationFrame(simulation.update_canvas);
    },
    
    updateCanvas: function(e){
        /// Debug pressure view

        if(app.drawPressureGrid){
            
            for(let i = 0; i < app.config.SIM_WIDTH; i++){
                for(let j = 0; j < app.config.SIM_HEIGHT; j++){ // Iterate for every simulation pixel
                    
                    var vData = Math.floor(Math.min((Math.abs(simulation.pressure_grid.get(i, j, 0)) + Math.abs(simulation.pressure_grid.get(i, j, 1))) * 10, 255));
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
        
        // Draw the particles
        simulation.particles.forEach((e) => {
            if(!e.active){return;}
            app.ctx.fillStyle = (simulation.particleData[e.id].color  || ["#000000"])[0];
            // Draw particles
            app.ctx.fillRect(Math.round(e.x) * app.config.PX_SIM_RATIO, Math.round(e.y) * app.config.PX_SIM_RATIO, app.config.PX_SIM_RATIO, app.config.PX_SIM_RATIO);

        })

        // Draw the mouse cursor
        app.ctx.beginPath();
        app.ctx.arc(app.mousePos.x, app.mousePos.y, app.brushSize * app.config.PX_SIM_RATIO, 0, 2 * Math.PI, false);
        app.ctx.lineWidth = 1;
        app.ctx.strokeStyle = '#fff'; // Outline color
        app.ctx.stroke();
    }
}


const simulation = {
    particles: null,        // Particles[] containing every particle
    grid: null,             // Particles[WIDTH][HEIGHT] containing position of every particle
    pressure_grid: null,    // Vec2[WIDTH][HEIGHT] containing the 'pressure gradient' of a position
    _pressure_grid: null,
    update_count: 0,        // Number of calls to update()
    particleData: null,     // Reference to data on particles

    pUpdateCycle: 0,
    config: {
        MAX_PARTICLES: 20000,
        WIDTH: null,        // Width of simulation (Currently auto-set in App startup)
        HEIGHT: null,       // Height of simulation
    
        G: 9.8,             // Default gravity
        COLLISION_CONST: 0.8
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
        
        // 2D array flattening
        // pressure_grid[i][j][k] = pressure_grid[w * (simulation.config.WIDTH + 10) + h * (simulation.config.HEIGHT + 10)]
        simulation.pressure_grid = new PressureArray((simulation.config.WIDTH + 10), (simulation.config.HEIGHT + 10)) // Contains the pressure

        simulation._pressure_grid = new PressureArray((simulation.config.WIDTH + 10), (simulation.config.HEIGHT + 10)) // Contains the pressure
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

        
        // The iteration order is shuffled to prevent directional wave speed differences.
        // Not the most mathematically sound solution.
        switch(this.pUpdateCycle = (this.pUpdateCycle + 1) % 4){
            case 0:
                for(let i = 0; i < app.config.SIM_WIDTH; i++){
                    for(let j = 0; j < app.config.SIM_HEIGHT; j++){
                        this._update_pressure_iter(i, j, dt);
                    }
                }
                break;

            case 1:
                for(let i = app.config.SIM_WIDTH - 1; i > -1; i--){
                    for(let j = 0; j < app.config.SIM_HEIGHT; j++){
                        this._update_pressure_iter(i, j, dt);
                    }
                }
                break;
            case 2:
                for(let j = 0; j < app.config.SIM_HEIGHT; j++){
                    for(let i = 0; i < app.config.SIM_WIDTH; i++){
                        this._update_pressure_iter(i, j, dt);
                    }
                }
                break;
            case 3:
                for(let j = app.config.SIM_HEIGHT; j > -1; j--){
                    for(let i = 0; i < app.config.SIM_WIDTH; i++){
                        this._update_pressure_iter(i, j, dt);
                    }
                }
                break;
        }

    },

    _update_pressure_iter(i, j, dt){
        const DISP_RATE = 3 * dt;       // Dispersion of pressure
        const FADE_RATE = 1 * dt;       // Loss of pressure
        const SPEED = 2;
        let px = simulation.pressure_grid.get(i, j, 0);
        let py = simulation.pressure_grid.get(i, j, 1);

        // For every pixel in the x gradient direction convey the pressure
        if (simulation.isInBound(i + SPEED * Math.sign(px), j)){
            simulation.pressure_grid.incr(i + SPEED * Math.sign(px), j, 0, DISP_RATE * px);
            
        }

        if (simulation.isInBound(i + SPEED * Math.sign(px), j + SPEED)){
            simulation.pressure_grid.incr(i + SPEED * Math.sign(px), j + SPEED, 0, DISP_RATE * px);
            
        }

        if (simulation.isInBound(i + SPEED* Math.sign(px), j - SPEED)){
            simulation.pressure_grid.incr(i + SPEED * Math.sign(px), j - SPEED, 0, DISP_RATE * px);
            
        }

        // For every pixel in the y gradient direction convey the pressure
        if (simulation.isInBound(i + SPEED, j + SPEED * Math.sign(py))){
            simulation.pressure_grid.incr(i + SPEED, j + SPEED * Math.sign(py), 1, DISP_RATE * py);
        }

        if (simulation.isInBound(i, j + SPEED* Math.sign(py))){
            simulation.pressure_grid.incr(i ,j + SPEED * Math.sign(py), 1, DISP_RATE * py);
        }

        if (simulation.isInBound(i - SPEED, j + SPEED* Math.sign(py))){
            simulation.pressure_grid.incr(i - SPEED, j + SPEED * Math.sign(py), 1, DISP_RATE * py);
        }

        // Update self
        simulation.pressure_grid.set(i, j, 0, (1 - 3 * DISP_RATE - FADE_RATE) * px);
        simulation.pressure_grid.set(i, j, 1, (1 - 3 * DISP_RATE - FADE_RATE) * py);
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
    }
}

class PressureArray extends Float32Array{
    constructor(w, h){
        super(w * h * 2);
        this.fill(0);
    }
    
    get(w, h, n){return this[w * (simulation.config.HEIGHT + 10) * 2 + h * 2 + n]}
    set(w, h, n, val){this[w * (simulation.config.HEIGHT + 10) * 2 + h * 2 + n] = val}
    incr(w, h, n, val){this[w * (simulation.config.HEIGHT + 10) * 2 + h * 2 + n] += val}

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
        
        for(let i of this.get('interact')){
            if(!((Math.floor(i[2] * Math.random()))% i[2])){
                for(let pos of [[-1, 1], [-1, 0], [-1, -1], [0, -1], [0, 1], [1, 1], [1, 0], [1, -1]]){
                    if (simulation.isOccupied(this.x + pos[0], this.y + pos[1], null) && simulation.getOccupied(this.x + pos[0], this.y + pos[1], null).id == i[0]){
                        i[1](this, dt);
                        break;
                    }
                }
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
        if(this.get('lifespan') < Infinity){
            this.ticks++;
            if(this.ticks == this.get('lifespan')){
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

        
        this.vx += (simulation.pressure_grid.get(this.x, this.y, 0) / this.get('mass') / 100)
        this.vy += (simulation.pressure_grid.get(this.x, this.y, 1) / this.get('mass') / 100)
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
                let o = simulation.getOccupied(pos.x, pos.y, this);

                // Actual collision simulation
                if(this.get('do_collision_sim') || o.get('do_collision_sim')){
                    let e = (this.get('e') + o.get('e')) / 2;
                    let m1 = this.get('mass');
                    let m2 = o.get('mass');

                    let ca = (m1 - e * m2) / (m1 + m2)
                    let cb = (m2 * (1 + e))/ (m1 + m2)
                    this.vx = ca * this.vx + cb * o.vx;
                    this.vy = ca * this.vy + cb * o.vy;

                    let da = (m1 * (1 + e)) / (m1 + m2)
                    let db = (m2 - e * m1) / (m1 + m2)

                    o.vx = da * this.vx + db * o.vx;
                    o.vy = da * this.vy + db * o.vy;
                    //let vxS = (o.vx + this.vx)
                    //let vyS = (o.vy + this.vy)
                    //this.vx = vxS * (1 - e);
                    //o.vx = vxS * e;
                    //this.vy = vyS * (1 - e);
                    //o.vy = vyS * e;
                }
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