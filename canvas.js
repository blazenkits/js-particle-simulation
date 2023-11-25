"use strict"

const app = {
    running: false,
    config: {
        G: 9.8,
        FPS: 60,
        HEIGHT: 600,
        WIDTH: 600,

        POOL_MAX: 2000,
        PX_SIM_RATIO : 3, // Actual pixels HEIGHT(WIDTH) * PX_SIM_RATIO
        PX_SIZE : 3,

        PIX_WIDTH: null, // Set auto
        PIX_HEIGHT: null, // Set auto
        GRID_SUBDIVISIONS: 10 // divide by this amount for spatial hash 
    },

    getMousePos(canvas, event) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.floor(event.clientX - rect.left),
            y: Math.floor(event.clientY - rect.top)
        };
    },

    pMousePos: null,
    start: function(){        
        app.canvas = document.getElementById("main-canvas");
        app.toggleButton = document.getElementById("toggle-button");
        app.ctx = app.canvas.getContext("2d");
        app.config.PIX_HEIGHT = Math.floor(app.config.HEIGHT / app.config.PX_SIM_RATIO);
        app.config.PIX_WIDTH = Math.floor(app.config.WIDTH / app.config.PX_SIM_RATIO);
        if(app.config.PIX_HEIGHT > 1000 || app.config.PIX_WIDTH > 1000){
            console.log("Too many pixels. Did not implement a proper hashmap yet sry")
            return;
        }
        app.canvas.addEventListener('mousedown', function(event) {
            app.isDrawing = true;
            var mousePos = app.getMousePos(app.canvas, event);
            app.pMousePos = mousePos
            simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, 0, 0);
        });
    
        app.canvas.addEventListener('mousemove', function(event) {
            if (app.isDrawing) {
                var mousePos = app.getMousePos(app.canvas, event);
                let launchspd = 0.1;
                simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, launchspd * (mousePos.x - app.pMousePos.x), launchspd * (mousePos.y - app.pMousePos.y));
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
            simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, 0, 0);
        });
    
        app.canvas.addEventListener('touchmove', function(event) {
            if (app.isDrawing) {
                var mousePos = app.getMousePos(app.canvas, event.touches[0]);
                let launchspd = 0.1;
                simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, launchspd * (mousePos.x - app.pMousePos.x), launchspd * (mousePos.y - app.pMousePos.y));
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
            if(!app.running){app.resume()}else{app.pause()}
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'P' || e.key === 'p') {
                if(!app.running){app.resume()}else{app.pause()}
            }
          });
        // Instantiating the particle pool
        simulation.particles = new Array(app.config.POOL_MAX).fill().map(e => new SandParticle(0, 0, 0, 0))

        // MAX 800x800 grid, memory seems fine
        simulation.grid = new Array(app.config.PIX_HEIGHT + 10).fill().map(e => new Array(app.config.PIX_WIDTH + 10))
        app.resume();
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

          
    }
}


const simulation = {
    particles: null,
    grid: null,
    update: function(dt){
        app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);
        simulation.particles.forEach((e) => {
            if(!this.isInBound(e.x, e.y)){e.deactivate(); return;}
            if(!e.active){return;}
            e.update(dt)
            app.ctx.fillStyle = e.color;
            // smooth
            //app.ctx.fillRect(e.x * app.config.PX_SIM_RATIO, e.y * app.config.PX_SIM_RATIO, app.config.PX_SIZE, app.config.PX_SIZE);
            // blocky
            app.ctx.fillRect(Math.round(e.x) * app.config.PX_SIM_RATIO, Math.round(e.y) * app.config.PX_SIM_RATIO, app.config.PX_SIZE, app.config.PX_SIZE);
        })
    },
    isInBound: function (x, y){
        return (y < app.config.PIX_HEIGHT + 5) && 0 < x && x < app.config.PIX_WIDTH && 0 < y; // No check for ground yet
    },

    isAboveGround: function (x, y){
        return y < app.config.PIX_HEIGHT;
    },

    // Does not check for validity
    getOccupied: function(x, y, self){
        return simulation.grid[x][y];
    },

    isOccupied: function(x, y, self){
        return (simulation.isInBound(x,y) && simulation.grid[x][y] !== undefined) && (simulation.grid[x][y] !== self);


    },

    addParticle: function(x, y, vx = 0, vy = 0){
        for (let e of this.particles){
            if(e.active){continue;}
            e._x = x;
            e._y = y;
            e.x = Math.floor(x);
            e.y = Math.floor(y);
            e.vx = vx;
            e.vy = vy;
            e.active = true;
            return 1;
        }
        return -1; // Fail
    },
    setGrid(obj){
        if (obj.x < 0 || obj.x > app.config.PIX_WIDTH || obj.y < 0 || obj.y > app.config.PIX_HEIGHT){return -1;}
        simulation.grid[obj.x][obj.y] = obj;
        return 0;
    },

    unsetGrid(x, y){
        if (x < 0 || x > app.config.PIX_WIDTH || y < 0 || y > app.config.PIX_HEIGHT){return -1;}
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

        this.active = false;
    }

    update(dt){

        // Unset current pos
        simulation.unsetGrid(this.x, this.y);

        // _ N _
        // W X E
        // _ S _
        // Get occupancy of SE and SW and S
        let SE = simulation.isOccupied(this.x + 1, this.y + 1, null);
        let SW = simulation.isOccupied(this.x - 1, this.y + 1, null);
        let S = simulation.isOccupied(this.x, this.y + 1, null);

        let aboveGround = simulation.isAboveGround(this.x, this.y); // Will be changed to more abstract
        // When grounded (or falling but a particle at S)
        if(S){
            // get x direction dispersion due to local gradient
            this.vx -= ((+SE) - (+SW)) * Math.random() * this.dispersion_rate * dt;

            // if SE == SW, randomly collapse the "tower"
            if(!SE && !SW){
                this.vx += (-1 + 2 * Math.random()) * this.dispersion_rate * dt
            }

            //velocity loss due to friction
            if ((this.vy - simulation.getOccupied(this.x, this.y + 1, this).vy) > -0.1){
                this.vx *= Math.max(0, (1- this.friction * dt));
            }

            // If grounded (or early stages of S falling)
            if(simulation.getOccupied(this.x, this.y + 1, null).vy < 0.1){
                this.vy = 0;
            }
    
        } else {
            if(aboveGround){
                
                // apply gravity
                this.vy += app.config.G * dt;
            }
        }
        
        this._x += this.vx;
        this._y += this.vy;

        if (!aboveGround){
            this._y = app.config.PIX_HEIGHT;
            this.vx = 0;
            this.vy = 0;
        }

        this._x += this.vx;
        this._y += this.vy;

        let prevX = this.x;
        let prevY = this.y
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

Particle.prototype.e = 0.1;
Particle.prototype.dispersion_rate = 10;
Particle.prototype.friction = 10;


class SandParticle extends Particle {
    color = "#c4c356";
    constructor(x, y, vx, vy){
        super(x, y, vx, vy);
    }
}

app.start()

for(let i = 2; i < 10; i += 1){
    simulation.addParticle(10, 10 * i / app.config.PX_SIM_RATIO);
}

for(let i = 0; i < 10; i += 1){
    simulation.addParticle(15, 10 * i / app.config.PX_SIM_RATIO, 1, -1);
}