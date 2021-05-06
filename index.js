// Setup
var gl;
var program;
var vPosition;
var colorLoc;
var proLoc;
var mvLoc;
var fovy = 90.0;
var zNear = 0.01;
var zFar = 10.0;

// Listeners
var canvas;
var spinX = -30;
var spinY = 50;
var zDist = -1.5;
var movement = false;

// Grid Sizes
var cellCount = {
    x : 50,
    y : 50,
    z : 50
}
var max = Math.max(cellCount.x, cellCount.y, cellCount.z);
var gridSize = {
    x : cellCount.x / max,
    y : cellCount.y / max,
    z : cellCount.z / max,
    max: max
}
var cellSize = gridSize.x / cellCount.x;

// Custom Objects
var wireframe;
var origin;
var snake;

window.onload = function main() {
    // Setup
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {alert("WebGL is not available.");}
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.15, 0.15, 0.15, 1.0);
    gl.enable(gl.DEPTH_TEST);
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    colorLoc = gl.getUniformLocation(program, "wireColor");
    proLoc = gl.getUniformLocation(program, "projection");
    mvLoc = gl.getUniformLocation(program, "modelview");
    gl.uniformMatrix4fv(proLoc, false, flatten(perspective(fovy, 1.0, zNear, zFar)));
    wireframe = new Wireframe();
    origin = new Origin();
    snake = new Snake();
    render();
}

function resize(){
    max = Math.max(cellCount.x, cellCount.y, cellCount.z);
    gridSize = {
        x : cellCount.x / max,
        y : cellCount.y / max,
        z : cellCount.z / max,
        max: max
    }
    cellSize = gridSize.x / cellCount.x;
    wireframe = new Wireframe();
    origin = new Origin();
    snake = new Snake();
}

// Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Grid Size
    var gird_x = document.getElementById("grid_x");
    var grid_x_text = document.getElementById("grid_x_text");
    var grid_y = document.getElementById("grid_y");
    var grid_y_text = document.getElementById("grid_y_text");
    var grid_z = document.getElementById("grid_z");
    var grid_z_text = document.getElementById("grid_z_text");

    grid_x.addEventListener("change", function(e){
        cellCount.x = e.target.value;
        grid_x_text.innerHTML = "Grid Size x-Axis : " + cellCount.x;
        resize();
    });

    grid_y.addEventListener("change", function(e){
        cellCount.y = e.target.value;
        grid_y_text.innerHTML = "Grid Size y-Axis : " + cellCount.y;
        resize();
    });

    grid_z.addEventListener("change", function(e){
        cellCount.z = e.target.value;
        grid_z_text.innerHTML = "Grid Size z-Axis : " + cellCount.z;
        resize();
    });

    // Origin
    var origin_absolute = document.getElementById("origin_absolute");
    var origin_relative = document.getElementById("origin_relative");

    origin_absolute.addEventListener("change", function(e){
        origin.draw_absolute = !origin.draw_absolute;
    });

    origin_relative.addEventListener("change", function(e){
        origin.draw_relative = !origin.draw_relative;
    });

    // Projection
    var fovy_elem = document.getElementById("fovy_elem");
    var fovy_elem_text = document.getElementById("fovy_elem_text");
    var zNear_elem = document.getElementById("zNear_elem");
    var zNear_elem_text = document.getElementById("zNear_elem_text");
    var zFar_elem = document.getElementById("zFar_elem");
    var zFar_elem_text = document.getElementById("zFar_elem_text");

    fovy_elem.addEventListener("input", function(e){
        fovy = e.target.value;
        gl.uniformMatrix4fv(proLoc, false, flatten(perspective(fovy, 1.0, zNear, zFar)));
        fovy_elem_text.innerHTML = "FOV : " + fovy;
    });

    zNear_elem.addEventListener("input", function(e){
        zNear = e.target.value/100;
        gl.uniformMatrix4fv(proLoc, false, flatten(perspective(fovy, 1.0, zNear, zFar)));
        zNear_elem_text.innerHTML = "zNear : " + zNear; 
    });

    zFar_elem.addEventListener("input", function(e){
        zFar = e.target.value/100;
        gl.uniformMatrix4fv(proLoc, false, flatten(perspective(fovy, 1.0, zNear, zFar)));
        zFar_elem_text.innerHTML = "zFar : " + zFar;
    });

    // Snake
    canvas = document.getElementById("gl-canvas");
    var randomize_snake = document.getElementById("randomize_snake");
    var snake_speed = document.getElementById("snake_speed");
    var snake_speed_text = document.getElementById("snake_speed_text");
    var initial_length = document.getElementById("initial_length");
    var initial_length_text = document.getElementById("initial_length_text");
    var growth_rate = document.getElementById("growth_rate");
    var growth_rate_text = document.getElementById("growth_rate_text");
    var distance_turn_x = document.getElementById("distance_turn_x");
    var distance_turn_x_text = document.getElementById("distance_turn_x_text");
    var distance_turn_y = document.getElementById("distance_turn_y");
    var distance_turn_y_text = document.getElementById("distance_turn_y_text");
    var distance_turn_z = document.getElementById("distance_turn_z");
    var distance_turn_z_text = document.getElementById("distance_turn_z_text");

    randomize_snake.addEventListener("click", function(e){
        // Speed
        snake.speed = randRangeInt(1, 5);
        snake_speed.value = snake.speed;
        snake_speed_text.innerHTML = "Movement Speed : 1/" + snake.speed;
        // Initial Length
        snake.start_length = randRangeInt(1, 100);
        initial_length.value = snake.start_length;
        initial_length_text.innerHTML = "Initial Length : " + snake.start_length;
        // Growth Rate
        snake.growth_rate = randRangeInt(1, 100);
        growth_rate.value = snake.growth_rate;
        growth_rate_text.innerHTML = "Grow Every : " + snake.growth_rate;
        // Travel Distance X Y Z
        snake.travel.x = randRangeInt(1, 25);
        distance_turn_x.value = snake.travel.x;
        distance_turn_x_text.innerHTML = "x-Axis : " + snake.travel.x;
        snake.travel.y = randRangeInt(1, 25);
        distance_turn_y.value = snake.travel.y;
        distance_turn_y_text.innerHTML = "y-Axis : " + snake.travel.y;
        snake.travel.z = randRangeInt(1, 25);
        distance_turn_z.value = snake.travel.z;
        distance_turn_z_text.innerHTML = "z-Axis : " + snake.travel.z;
    });

    snake_speed.addEventListener("input", function(e){
        snake.speed = e.target.value;
        snake_speed_text.innerHTML = "Movement Speed : 1/" + snake.speed;
    });

    initial_length.addEventListener("input", function(e){
        snake.start_length = e.target.value;
        initial_length_text.innerHTML = "Initial Length : " + snake.start_length;
    });

    growth_rate.addEventListener("input", function(e){
        snake.growth_rate = e.target.value;
        growth_rate_text.innerHTML = "Grow Every : " + snake.growth_rate;
    });

    distance_turn_x.addEventListener("input", function(e){
        snake.travel.x = e.target.value;
        distance_turn_x_text.innerHTML = "x-Axis : " + snake.travel.x;
    });

    distance_turn_y.addEventListener("input", function(e){
        snake.travel.y = e.target.value;
        distance_turn_y_text.innerHTML = "y-Axis : " + snake.travel.y;
    });

    distance_turn_z.addEventListener("input", function(e){
        snake.travel.z = e.target.value;
        distance_turn_z_text.innerHTML = "z-Axis : " + snake.travel.z;
    });

    // Control
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();
    });
    
    canvas.addEventListener("mouseup", function(e){
        movement = false;
    });

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
            spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (e.offsetY - origY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });

    document.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 38:
                zDist += 0.1;
                break;
            case 40:
                zDist -= 0.1;
                break;
        }
    });

    canvas.addEventListener("mousewheel", function(e){
        if( e.wheelDelta > 0.0 ) {
            zDist += 0.05;
        } else {
            zDist -= 0.05;
        }
    });

});

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var mv = mat4();
    mv = lookAt(vec3(0, 0, zDist), vec3(0, 0, 1+zDist), vec3(0, 1, 0));
    mv = mult(mv, mult(rotateX(spinX), rotateY(spinY)));
    mv = mult(mv, translate(-gridSize.x/2, -gridSize.y/2, -gridSize.z/2));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    // Absolute Draw
    wireframe.draw();
    if(origin.draw_absolute) { origin.draw(); }
    snake.draw(mv);
    if(!snake.alive) {
        snake.alive_timeout += 1;
        if(snake.alive_timeout == 180) {
            snake = new Snake();
        }
    }
    // Relative Draw
    mv = mult(mv, translate(gridSize.x/2, gridSize.y/2, gridSize.z/2));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    if(origin.draw_relative) { origin.draw(); }
    spinY += 0.2;
    //
    requestAnimationFrame(render);
}

class Snake {
    constructor() {
        this.body = [];
        this.alive = true;
        this.speed = snake_speed.value;
        this.alive_timeout = 0;
        this.speed_counter = 0;
        this.travel_counter = 0;
        this.travel = {
            x : distance_turn_x.value,
            y : distance_turn_y.value,
            z : distance_turn_z.value
        };
        this.growth_rate = growth_rate.value;
        this.growth_counter = 0;
        this.start_length = initial_length.value;
        for(var i = 0; i < this.start_length; i++) {
            this.body.push({
                x : (cellCount.x/2) >> 0,
                y : (cellCount.y/2) >> 0,
                z : (cellCount.z/2) >> 0
            })
        };
        this.direction = {
            x : 1,
            y : 0,
            z : 0
        };
        this.directions = [
            { x : -1, y :  0, z :  0 },
            { x :  1, y :  0, z :  0 },
            { x :  0, y : -1, z :  0 },
            { x :  0, y :  1, z :  0 },
            { x :  0, y :  0, z : -1 },
            { x :  0, y :  0, z :  1 }
        ];
        this.colors = [
            vec4(1.0, 0.3, 0.3, 1.0),
            vec4(0.2, 0.4, 1.0, 1.0),
            vec4(0.2, 0.7, 0.2, 1.0)
        ];
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeTriangles(cellSize, cellSize, cellSize)), gl.STATIC_DRAW);
    }

    draw(mv) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(gl.vPosition, 3, gl.FLOAT, false, 0, 0);
        for(var i = 0; i < this.body.length; i++) {
            if(this.alive) {
                switch (true) {
                    case i == 0:
                        gl.uniform4fv(colorLoc, this.colors[0]);
                        break;
                    case i % 2 == 0:
                        gl.uniform4fv(colorLoc, this.colors[1]);
                        break;
                    default:
                        gl.uniform4fv(colorLoc, this.colors[2]);
                        break;
                }
            } else {
                gl.uniform4fv(colorLoc, vec4(1.0, 0.0, 0.0, 1.0));
            }
            gl.uniformMatrix4fv(mvLoc, false, flatten(mult(mv, translate(
                cellSize * this.body[i].x,
                cellSize * this.body[i].y,
                cellSize * this.body[i].z
            )))); 
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        }
        this.speed_counter++;
        if(this.speed_counter % this.speed == 0) {
            this.speed_counter = 0;
            this.move();
        }
    }

    move() {
        if(!this.alive) {
            return;
        }
        var rng = Math.random();
        this.travel_counter++;
        switch (true) {
            case this.direction.x != 0:
                if(this.travel_counter % this.travel.x == 0) {
                    switch (true) {
                        case rng < 0.2:
                            this.direction = this.directions[2];
                            break;
                        case rng < 0.4:
                            this.direction = this.directions[3];
                            break;
                        case rng < 0.6:
                            this.direction = this.directions[4];
                            break;
                        case rng < 0.8:
                            this.direction = this.directions[5];
                            break;
                    }
                    this.travel_counter = 0;
                }
                break;
            case this.direction.y != 0:
                if(this.travel_counter % this.travel.y == 0) {
                    switch (true) {
                        case rng < 0.2:
                            this.direction = this.directions[0];
                            break;
                        case rng < 0.4:
                            this.direction = this.directions[1];
                            break;
                        case rng < 0.6:
                            this.direction = this.directions[4];
                            break;
                        case rng < 0.8:
                            this.direction = this.directions[5];
                            break;
                    }
                    this.travel_counter = 0;
                }
                break;
            case this.direction.z != 0:
                if(this.travel_counter % this.travel.z == 0) {
                    switch (true) {
                        case rng < 0.2:
                            this.direction = this.directions[0];
                            break;
                        case rng < 0.4:
                            this.direction = this.directions[1];
                            break;
                        case rng < 0.6:
                            this.direction = this.directions[2];
                            break;
                        case rng < 0.8:
                            this.direction = this.directions[3];
                            break;
                    }
                    this.travel_counter = 0;
                }
                break;
        }
        var part = this.body.pop();
        this.growth_counter++;
        if(this.growth_counter % this.growth_rate == 0) {
            this.body.push({x : part.x, y : part.y, z : part.z});
        }
        part.x = (this.body[0].x + this.direction.x) % cellCount.x;
        part.y = (this.body[0].y + this.direction.y) % cellCount.y;
        part.z = (this.body[0].z + this.direction.z) % cellCount.z;
        switch (true) {
            case part.x < 0:
                part.x = cellCount.x-1;
                break;
            case part.y < 0:
                part.y = cellCount.y-1;
                break;
            case part.z < 0:
                part.z = cellCount.z-1;
                break;
        }
        this.body.unshift(part);
        for(var i = 1; i < this.body.length; i++){
            if(
                this.body[0].x == this.body[i].x && 
                this.body[0].y == this.body[i].y && 
                this.body[0].z == this.body[i].z
            ) {
                this.alive = false;
                break;
            }
        }
    }
}

function randRangeInt(min, max) {
    return ((Math.random() * (max+1 - min)) + min) >> 0;
}

class Wireframe {
    constructor() {
        this.buffer = gl.createBuffer();
        this.color = vec4(1.0, 1.0, 1.0, 1.0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeLines(gridSize.x, gridSize.y, gridSize.z)), gl.STATIC_DRAW);
    }
    
    draw() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.uniform4fv(colorLoc, this.color);
        gl.vertexAttribPointer(gl.vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, 24);
    }
}

class Origin {
    constructor() {
        this.draw_relative = false;
        this.draw_absolute = false;
        this.color_x = vec4(1.0, 0.0, 0.0, 1.0);
        this.color_y = vec4(0.0, 1.0, 0.0, 1.0);
        this.color_z = vec4(0.0, 0.0, 1.0, 1.0);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(originLines(gridSize.x, gridSize.y, gridSize.z)), gl.STATIC_DRAW);
    }

    draw() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(gl.vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.uniform4fv(colorLoc, this.color_x);
        gl.drawArrays(gl.LINES, 0, 2);
        gl.uniform4fv(colorLoc, this.color_y);
        gl.drawArrays(gl.LINES, 2, 3);
        gl.uniform4fv(colorLoc, this.color_z);
        gl.drawArrays(gl.LINES, 4, 5);
    }
}

function cubeVertices(x, y, z) {
    return [
        vec3( x, y, z),
        vec3( x, y, 0),
        vec3( x, 0, z),
        vec3( x, 0, 0),
        vec3( 0, y, z),
        vec3( 0, y, 0),
        vec3( 0, 0, z),
        vec3( 0, 0, 0)
    ];
}

function cubeLines(x, y, z) {
    a = cubeVertices(x, y, z);
    return [
        a[6], a[4], a[4], a[0], a[0], a[2], a[2], a[6],
        a[7], a[5], a[5], a[1], a[1], a[3], a[3], a[7],
        a[6], a[7], a[4], a[5], a[0], a[1], a[2], a[3]
    ];
}

function cubeTriangles(x, y, z) {
    a = cubeVertices(x, y, z);
    return [
        a[4], a[6], a[2], a[4], a[2], a[0], 
        a[0], a[2], a[3], a[0], a[3], a[1], 
        a[2], a[6], a[7], a[2], a[7], a[3], 
        a[1], a[5], a[4], a[1], a[4], a[0], 
        a[7], a[5], a[1], a[7], a[1], a[3], 
        a[5], a[7], a[6], a[5], a[6], a[4]
    ];
}

function originLines(x, y, z) {
    return [
        vec3(-10.0, 0, 0), vec3(10.0, 0, 0),
        vec3(0, -10.0, 0), vec3(0, 10.0, 0),
        vec3(0, 0, -10.0), vec3(0, 0, 10.0)
    ];
}