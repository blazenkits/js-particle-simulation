

const app = {
    running: false,
    config: {
        G: 9.8,
        FPS: 60,
        HEIGHT: 600,
        WIDTH: 600,

        POOL_MAX: 2000,
        PX_SIM_RATIO : 3, // Actual pixels HEIGHT(WIDTH) * PX_SIM_RATIO
        PX_SIZE : 3
    },

    getMousePos(canvas, event) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    },

    start: function(){
        app.canvas = document.getElementById("main-canvas");
        app.toggleButton = document.getElementById("toggle-button");
        app.ctx = app.canvas.getContext("2d");
        app.config.PIX_HEIGHT = Math.floor(app.config.HEIGHT / app.config.PX_SIM_RATIO);
        app.config.PIX_WIDTH = Math.floor(app.config.WIDTH / app.config.PX_SIM_RATIO);

        app.canvas.addEventListener('mousedown', function(event) {
            app.isDrawing = true;
            var mousePos = app.getMousePos(app.canvas, event);
            simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, 1, -1);
        });
    
        app.canvas.addEventListener('mousemove', function(event) {
            if (app.isDrawing) {
                var mousePos = app.getMousePos(app.canvas, event);
                simulation.addParticle(mousePos.x / app.config.PX_SIM_RATIO, mousePos.y / app.config.PX_SIM_RATIO, 1, -1);
            }
        });
    
        app.canvas.addEventListener('mouseup', function() {
            app.isDrawing = false;
        });
    
        app.canvas.addEventListener('mouseleave', function() {
            app.isDrawing = false;
        });

    

        app.toggleButton.addEventListener('click', function(){
            if(!app.running){app.resume()}else{app.pause()}
        });
        simulation.particles = new Array(app.config.POOL_MAX).fill().map(e => new SandParticle(0, 0, 0, 0))
        app.resume();
    },

    resume: function(){
        app.running = true;
        app._updateID =  setInterval(app.update, 1000 / app.config.FPS);
    },

    pause: function(){
        
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
    update: function(dt){
        app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);
        simulation.particles.forEach((e) => {
            if(!this.isInBound(e.x, e.y)){e.deactivate(); return;}
            if(!e.active){return;}
            e.update(dt)
            app.ctx.fillStyle = e.color;
            // smooth
            app.ctx.fillRect(e.x * app.config.PX_SIM_RATIO, e.y * app.config.PX_SIM_RATIO, app.config.PX_SIZE, app.config.PX_SIZE);
            // blocky
            // app.ctx.fillRect(Math.round(e.x) * app.config.PX_SIM_RATIO, Math.round(e.y) * app.config.PX_SIM_RATIO, app.config.PX_SIZE, app.config.PX_SIZE);
        })
    },
    isInBound: function (x, y){
        return 0 < x && x < app.config.PIX_WIDTH && 0 < y; // No check for ground yet
    },

    isAboveGround: function (x, y){
        return y < app.config.PIX_HEIGHT;
    },

    // Currently O(n^2), must optimize
    isOccupied: function(x, y, self){
        let asd = x;
        return simulation.particles.some((e) => (e.active && Math.round(e.x - x) == 0 && Math.round(e.y - y) == 0 && e != self));
    },

    addParticle: function(x, y, vx = 0, vy = 0){
        for (let e of this.particles){
            if(e.active){continue;}
            e.x = x;
            e.y = y;
            e.vx = vx;
            e.vy = vy;
            e.active = true;
            return 1;
        }
        return -1; // Fail
    }
}


class Particle {
    constructor(x, y, vx = 0, vy = 0){
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.e = 0.1
        this.active = false;
    }

    update(dt){
        // dy = v dt
        let _x = this.x + Math.sign(this.vx);
        let _y = this.y + Math.sign(this.vy); 
        let aboveGround = simulation.isAboveGround(_x, _y); // Next pos oob
        let occupied = simulation.isOccupied(this.x, this.y, this); // This pos occupied
        if (occupied){
            // Dispersion due to overlap
            this.vx = -1 + 2 * Math.random();
        }

        this.x += this.vx;
        this.y += this.vy;

        if (!aboveGround){
            this.y = app.config.PIX_HEIGHT;
            this.vx = 0;
            this.vy = 0;
            return;
        }

        
        // dv = g dt
        this.vy += app.config.G * dt;
    }

    deactivate(){
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.active = false;
    }
}

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
