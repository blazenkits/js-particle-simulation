"use strict";

// Particle Sandbox in JS!
// 

// app performs direct DOM manipulation

const OverlayEnum = {
    NONE:   0,
    PRESSURE: 1,
    VELOCITYX: 2,
    VELOCITYY: 3,
    GAME: 4,
    DETONATOR_PLACEMENT: 5
    
}
const app = {
    debug_mode: false,
    running: false,
    overlayMode: OverlayEnum.NONE,
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
    detonateAtFrame: false,
    fpsWindow: 20,
    frameTime: 0, 
    lastTime: Date.now(),


    config: { // Contains config for the App. For config of Simulation, modify the config there.
        FPS: 60,            // FPS
        
        VISIBLE_HEIGHT: -1,
        VISIBLE_WIDTH: -1,
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
            x: Math.floor(event.clientX - rect.left) * (app.config.CANVAS_WIDTH / app.config.VISIBLE_WIDTH),
            y: Math.floor(event.clientY - rect.top) * (app.config.CANVAS_HEIGHT / app.config.VISIBLE_HEIGHT)
        };
    },

    updateCanvasSize(){
        app.config.VISIBLE_HEIGHT = parseInt(window.getComputedStyle(app.canvas).height);
        app.config.VISIBLE_WIDTH = parseInt(window.getComputedStyle(app.canvas).width);
        
    },
    start: function(){
        // Get Elements
        app.canvas = document.getElementById("main-canvas");
        app.toggleButton = document.getElementById("toggle-button");
        app.particleCounter = document.getElementById("particle-counter");
        app.fpsCounter = document.getElementById("fps-counter");
        app.brushSizeRange = document.getElementById("brush-size-range");
        app.ctx = app.canvas.getContext("2d");
        app.destructableWallParticleList = document.getElementById("destructable-wall-particles");
        app.indestructableParticleList = document.getElementById("indestructable-particles");
        app.particleList = document.getElementById("particles");
        
        // Dynamically set 
        // Set Config

        app.updateCanvasSize();
        app.config.CANVAS_HEIGHT = app.canvas.height;
        app.config.CANVAS_WIDTH = app.canvas.width;
        
        app.config.SIM_HEIGHT = Math.floor(app.config.CANVAS_HEIGHT / app.config.PX_SIM_RATIO);
        app.config.SIM_WIDTH = Math.floor(app.config.CANVAS_WIDTH / app.config.PX_SIM_RATIO);

        

        app.imageData = app.ctx.createImageData(app.config.CANVAS_WIDTH, app.config.CANVAS_HEIGHT);

        // Add event listeners
        app.canvas.addEventListener("contextmenu", e => e.preventDefault());

        window.addEventListener('resize', app.updateCanvasSize);
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
                console.log(simulation.pressure_grid.get(Math.round(mousePos.x / app.config.PX_SIM_RATIO), Math.round(mousePos.y/ app.config.PX_SIM_RATIO)))
            }
        });
    
        app.canvas.addEventListener('mousemove', function(event) {
            
            var mousePos = app.getMousePos(app.canvas, event);
            if (app.isDrawing) {
                app.mousevx = app.config.LAUNCH_SPEED_MUL * (mousePos.x - app.mousePos.x);
                app.mousevy = app.config.LAUNCH_SPEED_MUL * (mousePos.y - app.mousePos.y);
                
                app.drawParticleFromInput();        
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
        document.getElementById("menu").addEventListener('scroll', function(event){
            document.getElementById("scroll-info").style.display = 'none'
            
        })


        app.canvas.addEventListener('mouseup', function() {
            app.isDrawing = false;
            app.isErasing = false;
        });
    
        app.canvas.addEventListener('mouseleave', function() {
            app.isDrawing = false;
        });

    
        app.canvas.addEventListener('touchstart', function(event) {
            if (app.running) event.preventDefault();
            app.isDrawing = true;
            var mousePos = app.getMousePos(app.canvas, event.touches[0]);
            app.mousePos = mousePos
            app.mousevx = app.mousevy = 0;
        });
    
        app.canvas.addEventListener('touchmove', function(event) {
            if(event.touches.length > 1) return;
            if (app.running) event.preventDefault();
            if (app.isDrawing) {
                var mousePos = app.getMousePos(app.canvas, event.touches[0]);
                let launchspd = 0.1;
                app.mousevx = app.config.LAUNCH_SPEED_MUL * (mousePos.x - app.mousePos.x);
                app.mousevy = app.config.LAUNCH_SPEED_MUL * (mousePos.y - app.mousePos.y);
                app.mousePos = mousePos;
                app.drawParticleFromInput();

            }
            
        });
    
        app.canvas.addEventListener('touchend', function() {
            if (app.running) event.preventDefault();
            app.isDrawing = false;
        });
    
        app.canvas.addEventListener('touchcancel', function() {
            app.isDrawing = false;
        });

        app.toggleButton.addEventListener('click', function(){
            app.toggle();
        });

        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'P':
                case 'p':
                    app.toggle()
                    break;
                
                case 'Q':
                case 'q':
                    app.detonateAtFrame = true
                    break;
                case '`':
                case '0':
                    app.overlayChange(OverlayEnum.NONE);
                    break;
                case '1':
                    app.overlayChange(OverlayEnum.PRESSURE);
                    break;
                case '2':
                    app.overlayChange(OverlayEnum.VELOCITYX);
                    break;
                case '3':
                    app.overlayChange(OverlayEnum.VELOCITYY);
                    break;
                //case '4':
                //    app.overlayChange(OverlayEnum.GAME);
                //    break;
                default:
                    break;
            }
          });

        // Start the simulation
        simulation.start(app.config.SIM_WIDTH, app.config.SIM_HEIGHT, particle_data);

        // Add particle buttons
        for(const k of Object.keys(simulation.particleData)){
            let e = simulation.particleData[k]
            let t = '<div class="particle-item">'+
            `<button type="button" data-particleid="${k}" class="btn particle-button" style="background-color: ${(e.color || ["#000000"])[0]}"` 
            +  `data-bs-html="true" data-bs-toggle="tooltip" data-bs-title="${e.tooltip || "Click to select"}" data-bs-custom-class="particle-tooltip" onClick="app.onParticleButtonPressed(this)"></button>`+
            `${e.name || 'Missingno.'}`+
            '</div>'
            switch (e.class) {
                case ParticleClass.POWDER:
                    app.particleList.innerHTML += t
                    break;
            
                case ParticleClass.DESTRUCTABLE_WALL:
                    app.destructableWallParticleList.innerHTML += t
                    break;
                case ParticleClass.INDESTRUCTABLE:
                    app.indestructableParticleList.innerHTML += t
                    break;
            }

        }
        
        
        // Bootstrap Tooltip Init
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

        // Add counter update interval
        setInterval(() => {
            app.particleCounter.innerHTML = "" + simulation.count_particles() + "/" + simulation.config.MAX_PARTICLES;
            app.fpsCounter.innerHTML = "" + (1000/app.frameTime).toFixed(1)
        }, 1000);

        // app.resume();
    },

    drawParticleFromInput(){
        if(app.overlayMode === OverlayEnum.GAME) return;
        else if(app.overlayMode === OverlayEnum.DETONATOR_PLACEMENT){
            
            for(let i = -1; i < 1; i++){
                for(let j = -1; j < 1; j++){
                    simulation.addParticle(app.mousePos.x / app.config.PX_SIM_RATIO + i, app.mousePos.y / app.config.PX_SIM_RATIO + j, app.mousevx, app.mousevy, Particles.DETONATOR, true);
                    
                }
            }
            alert("Press Q to detonate!");
        }
        else {
        for(let i = -app.brushSize; i < app.brushSize; i++)
            for(let j = -app.brushSize; j < app.brushSize; j++)
                if(simulation.isAboveGround(app.mousePos.x / app.config.PX_SIM_RATIO + i, app.mousePos.y / app.config.PX_SIM_RATIO + j)){
                    simulation.addParticle(app.mousePos.x / app.config.PX_SIM_RATIO + i, app.mousePos.y / app.config.PX_SIM_RATIO + j, app.mousevx, app.mousevy, app.placingID)};
        }
    },

    eraseParticleFromInput(){
        if(app.overlayMode === OverlayEnum.GAME) return;

        for(let i = -app.brushSize; i < app.brushSize; i++)
            for(let j = -app.brushSize; j < app.brushSize; j++){
                if(app.overlayMode == OverlayEnum.DETONATOR_PLACEMENT){
                    simulation.removeParticle(app.mousePos.x / app.config.PX_SIM_RATIO + i, app.mousePos.y / app.config.PX_SIM_RATIO + j, app.placingID);
                }
                simulation.removeParticle(app.mousePos.x / app.config.PX_SIM_RATIO + i, app.mousePos.y / app.config.PX_SIM_RATIO + j);
            }
   
    },

    switchToParticle(id){
        this.placingID = id;
    },

    onParticleButtonPressed(e){
        this.switchToParticle(parseInt(e.dataset.particleid));
        for(let i of document.getElementsByTagName("button")){
            i.classList.remove("btn-outline-primary", "particle-active-outline");
        }
        e.classList.add("btn-outline-primary", "particle-active-outline");


    },

    overlayChange(id){
        this.overlayMode = id;
    },
    overlayChangeCycle(){
        var a = [0,1,2,3]
        this.overlayMode = a[(++this.overlayMode) % a.length];
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
        
        app.ctx.font = '32px Barlow';
        app.ctx.fillStyle = 'white';
        app.ctx.fillText("PAUSED", (app.config.CANVAS_WIDTH - 120) /2, app.config.CANVAS_HEIGHT/2); 
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
        if(app.overlayMode == OverlayEnum.GAME)
            game.update(1 / app.config.FPS);
        
            
        simulation.update(1 / app.config.FPS);
        app.updateCanvas();
        app.detonateAtFrame = false
    },
    
    updateCanvas: function(){
        app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);
        app.imageData = app.ctx.createImageData(app.config.CANVAS_WIDTH, app.config.CANVAS_HEIGHT);

        // Draw the pressure
        if(app.overlayMode === OverlayEnum.PRESSURE){
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

        else if(app.overlayMode === OverlayEnum.VELOCITYX){
            for(let i = 0; i < app.config.SIM_WIDTH; i++){
                for(let j = 0; j < app.config.SIM_HEIGHT; j++){ // Iterate for every simulation pixel

                    var vData = Math.floor(Math.max(Math.min((simulation.velocity_grid_x.qget(i, j)) * app.config.PRESSURE_COLOR_RATIO, 255), -255));
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
        else if(app.overlayMode === OverlayEnum.VELOCITYY){
            for(let i = 0; i < app.config.SIM_WIDTH; i++){
                for(let j = 0; j < app.config.SIM_HEIGHT; j++){ // Iterate for every simulation pixel

                    var vData = Math.floor(Math.max(Math.min((simulation.velocity_grid_y.qget(i, j)) * app.config.PRESSURE_COLOR_RATIO, 255), -255));
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
        
        else if(app.overlayMode === OverlayEnum.GAME){
            for(let i of game.capture_area){

                for(let x = 0; x < i.cx2 - i.cx1; x++){
                    for(let y = 0; y < i.cy2 - i.cy1; y++){
                        if(simulation.isOccupied((x + i.cx1), (y + i.cy1), null)){
                            let n = app.config.CANVAS_WIDTH * (y + Math.floor(i.dy1)) + (x + Math.floor(i.dx1));
                            app.imageData.data[4 * n] = 255;
                            app.imageData.data[4 * n + 1] = 0;
                            app.imageData.data[4 * n + 2] = 0;
                            app.imageData.data[4 * n + 3] = 255;
                        }
                    }
                }
            }
        }

        // Draw the particles
        if(app.overlayMode !== OverlayEnum.GAME){
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

        }
        
        app.ctx.putImageData(app.imageData, 0, 0);
        let txt = ""
        switch(app.overlayMode){
            case OverlayEnum.PRESSURE:
                txt = "Pressure View"
                break;
            case OverlayEnum.VELOCITYX:
                txt = "Velocity X View"
                break;
            case OverlayEnum.VELOCITYY:
                txt = "Velocity Y View"
                break;
            case OverlayEnum.GAME:
                txt = "Game View, this will allow placing particle contraptions into the world. Currently under construction :)"
                break;
            case OverlayEnum.DETONATOR_PLACEMENT:
                txt = "Detonator Edit"
                break;
        }
        app.ctx.font = '16px Barlow';
        app.ctx.fillStyle = 'white';
        app.ctx.fillText(txt, 10, app.config.CANVAS_HEIGHT - 10); 
        // Draw the mouse cursor
        app.ctx.beginPath();
        app.ctx.arc(app.mousePos.x, app.mousePos.y, app.brushSize * app.config.PX_SIM_RATIO, 0, 2 * Math.PI, false);
        app.ctx.lineWidth = 1;
        app.ctx.strokeStyle = '#fff'; // Outline color
        app.ctx.stroke();
        
        // Debug
        // app.ctx.strokeRect(10 * app.config.PX_SIM_RATIO, 10 * app.config.PX_SIM_RATIO, 30 * app.config.PX_SIM_RATIO, 30 * app.config.PX_SIM_RATIO);


    
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
                if(simulation.pblock_grid.qget(i, j)){
                    simulation.velocity_grid_x.qset(i, j, 0);
                    simulation.velocity_grid_y.qset(i, j, 0);
                    continue;
                }
                let gradx = ((simulation.pblock_grid.qget(i - 1, j) ? simulation.pressure_grid.qget(i, j) : simulation.pressure_grid.qget(i - 1, j)) - (simulation.pblock_grid.qget(i + 1, j) ? simulation.pressure_grid.qget(i, j) : simulation.pressure_grid.qget(i + 1, j)));
                let grady = ((simulation.pblock_grid.qget(i, j - 1) ? simulation.pressure_grid.qget(i, j) : simulation.pressure_grid.qget(i, j - 1)) - (simulation.pblock_grid.qget(i, j + 1) ? simulation.pressure_grid.qget(i, j) : simulation.pressure_grid.qget(i, j + 1)));
                
                    
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
                    if(!simulation.pblock_grid.qget(i, j)){
                    gain += (simulation.velocity_grid_x.qget(i - 1, j) - simulation.velocity_grid_x.qget(i + 1, j))
                    gain += (simulation.velocity_grid_y.qget(i, j - 1) - simulation.velocity_grid_y.qget(i, j + 1))
                    } else continue;
                    // Alter pressure according to divergence
                    simulation.pressure_grid.qinc(i, j, gain * dt * b);

                    // Smoothe the pressure
                    let avg = 0
                    let n = 0
                    for(let p = -1; p <= 1; p++) for(let q = -1; q <= 1; q++){
                        if(simulation.pblock_grid.qget(i + p, j + q)) continue;
                        avg += simulation.pressure_grid.qget(i + p, j + q)
                        n++;
                    }
                    
                    simulation.pressure_grid.qset(i, j, avg / n);
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
    addParticle: function(x, y, vx = 0, vy = 0, id = 1, force = false){
        if(!force && simulation.isOccupied(Math.floor(x), Math.floor(y), null)) return -1;
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

    removeParticle: function(x, y, id = null){
        let _x = Math.floor(x); let _y = Math.floor(y)
        if(simulation.isOccupied(_x, _y, null)){
            let p =  simulation.getOccupied(_x, _y, null)
            if(id !== null && p.id !== id) return;
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
class Int8Array2D extends Int8Array{
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
        
        let op = this.get('overpressure')
        if(op[0] < Infinity && (simulation.pressure_grid.qget(this.x   , this.y) > op[0] ||
           simulation.pressure_grid.qget(this.x -1, this.y) > op[0] ||
           simulation.pressure_grid.qget(this.x +1, this.y) > op[0] ||
           simulation.pressure_grid.qget(this.x, this.y -1) > op[0] ||
           simulation.pressure_grid.qget(this.x, this.y +1) > op[0] 
           )){
            op[1](this, dt, null);
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
        this.base().on_deactivate(this);
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


/* Not implemented */
const game = {
    capture_area: [
        {
            cx1: 10,
            cy1: 10,
            cx2: 40,
            cy2: 40,
            dx1: 100,
            dy1: 100,
            vx: 0,
            vy: 0,
            r: 0,
            mass: 100
        }
    ],

    update: function(dt){
        for(let i of this.capture_area){
            i.vy += 200 * dt
            if(i.dy1 > 700 && i.vy >= 0){
                i.vx *= 0.9
                i.vy = 0
            }
            if(i.dy1 < 10 && i.vy <= 0){
                i.vx *= 0.9
                i.vy = 0
            }
            i.dy1 += i.vy * dt
            i.dx1 += i.vx * dt
            // Physics simulation
            let vyTotal = 0
            for(let x = i.cx1; x < i.cx2; x++){ // y Velocity in y = min, y = max
                vyTotal += simulation.velocity_grid_y.get(x, i.cy1)
                vyTotal += simulation.velocity_grid_y.get(x, i.cy2)
            }
            let vxTotal = 0
            for(let y = i.cy1; y < i.cy2; y++){ // x Velocity in x = min, x = max
                vxTotal += simulation.velocity_grid_x.get(i.cx1, y)
                vxTotal += simulation.velocity_grid_x.get(i.cx2, y)
            }
            // Move opposite of air vx
            i.vx -= vxTotal / i.mass;
            i.vy -= vyTotal / i.mass;
        }
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
