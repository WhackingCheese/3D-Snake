var gl;
var canvas;
var program;
var vPosition;
var colorLoc;
var proLoc;
var mvLoc;

var mv;
var spinX = -50;
var spinY = 0;
var zDist = -5;
var movement;
var grid_size = 13;

var origin;
var grid;
var worldmap;
var tree;
var cars;
var turtles;
var logs;
var frog;
var points = 0;
var pointsElem;

window.onload = function main() {
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
    gl.uniformMatrix4fv(proLoc, false, flatten(perspective(90.0, 1.0, 0.01, 100)));
    init();
    render();
}

document.addEventListener("DOMContentLoaded", () => {
    pointsElem = document.getElementById("points");
});

function update_points() {
    points += 1;
    pointsElem.innerHTML = points;
}

function init() {
    origin = new Origin();
    grid = new Grid();
    worldmap = new WorldMap();
    tree = new Tree();
    cars = new Cars();
    turtles = new Turtles();
    logs = new Logs();
    frog = new Frog();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mv = lookAt(vec3(0, 0, zDist), vec3(0, 0, 1+zDist), vec3(0, 1, 0));
    mv = mult(mv, mult(rotateX(spinX), rotateY(spinY)));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    // Absolute Draw
    origin.draw();
    mv = mult(mv, translate(
        -(frog.pos.x+0.5),
        0,
        -(frog.pos.z+0.5)
    ))
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    grid.draw();
    worldmap.draw();
    tree.draw();
    cars.draw(mv);
    turtles.draw(mv);
    logs.draw(mv);
    frog.draw(mv);
    requestAnimationFrame(render);
}

function frogCollide() {
    frog = new Frog();
    spinX = -50;
    spinY = 0;
}

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gl-canvas");
    
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

    canvas.addEventListener("mousewheel", function(e){
        if( e.wheelDelta > 0.0 ) {
            zDist += 0.05;
        } else {
            zDist -= 0.05;
        }
    });

    document.addEventListener("keydown", function(e){
        switch( e.keyCode ){
            case 37:
                frog.move(1, 0);
                break;
            case 38:
                frog.move(0, 1);
                break;
            case 39:
                frog.move(-1, 0);
                break;
            case 40:
                frog.move(0, -1);
                break;
            case 79:
                grid.enable_draw = !grid.enable_draw;
                break;
            case 80:
                origin.enable_draw = !origin.enable_draw;
                break;
        }
    });
});

function cubeVertices(x, y, z) {
    return [
        vec3(x, y, z),
        vec3(x, y, 0),
        vec3(x, 0, z),
        vec3(x, 0, 0),
        vec3(0, y, z),
        vec3(0, y, 0),
        vec3(0, 0, z),
        vec3(0, 0, 0)
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

class DrawableObject {
    constructor(color, vertices, draw_mode) {
        this.color = color;
        this.vertices = vertices
        this.draw_mode = draw_mode
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);
    }

    load() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(gl.vPosition, 3, gl.FLOAT, false, 0, 0);
    }

    draw() {
        this.load();
        gl.uniform4fv(colorLoc, this.color);
        gl.drawArrays(this.draw_mode, 0, this.vertices.length);
    }
}

class Origin extends DrawableObject {
    constructor() {
        super(
            [
                vec4(1.0, 0.0, 0.0, 1.0),
                vec4(0.0, 1.0, 0.0, 1.0),
                vec4(0.0, 0.0, 1.0, 1.0)
            ],
            [
                vec3(-10.0, 0, 0), vec3(10.0, 0, 0),
                vec3(0, -10.0, 0), vec3(0, 10.0, 0),
                vec3(0, 0, -10.0), vec3(0, 0, 10.0)
            ],
            gl.LINES
        );
        this.enabble_draw = false;
    }

    draw() {
        if(!this.enable_draw){return;}
        this.load();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(gl.vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.uniform4fv(colorLoc, this.color[0]);
        gl.drawArrays(this.draw_mode, 0, 2);
        gl.uniform4fv(colorLoc, this.color[1]);
        gl.drawArrays(this.draw_mode, 2, 3);
        gl.uniform4fv(colorLoc, this.color[2]);
        gl.drawArrays(this.draw_mode, 4, 5);
    }
}

class Grid extends DrawableObject {
    constructor() {
        super(vec4(1.0, 1.0, 1.0, 1.0), Grid.createVertices(), gl.LINES);
        this.enabble_draw = false;
    }

    draw() {
        if(!this.enable_draw){return;}
        this.load();
        gl.uniform4fv(colorLoc, this.color);
        for(var i = 0; i < this.vertices.length; i+=6) {
            gl.drawArrays(this.draw_mode, i, i+6);
        }
    }

    static createVertices() {
        var vert_x = [];
        var vert_z = [];
        for(var i = 0; i <= grid_size; i++) {
            vert_x.push(vec3(i, 0.0, 0));
            vert_x.push(vec3(i, 0.0, grid_size));
            vert_z.push(vec3(0, 0.0, i));
            vert_z.push(vec3(grid_size, 0.0, i));
        }
        return vert_x.concat(vert_z);
    }
}

class WorldMap extends DrawableObject {
    constructor() {
        super(
            [
                vec4(0.2, 0.2, 0.7, 1.0),
                vec4(0.1, 0.1, 0.1, 1.0),
                vec4(0.4, 0.4, 0.8, 1.0)
            ],
            [
                vec3(grid_size, -0.2, 1), vec3(0        , -0.2,  1), vec3(0        , -0.2,  6),
                vec3(0        , -0.2, 6), vec3(grid_size, -0.2,  1), vec3(grid_size, -0.2,  6),
                vec3(grid_size,  0  , 0), vec3(grid_size, -0.2,  0), vec3(0        ,  0  ,  0),
                vec3(0        ,  0  , 0), vec3(grid_size, -0.2,  0), vec3(0        , -0.2,  0),
                vec3(0        ,  0  , 0), vec3(0        ,  0  ,  1), vec3(grid_size,  0  ,  1),
                vec3(0        ,  0  , 0), vec3(grid_size,  0  ,  0), vec3(grid_size,  0  ,  1),
                vec3(grid_size,  0  , 1), vec3(grid_size, -0.2,  1), vec3(0        ,  0  ,  1),
                vec3(0        ,  0  , 1), vec3(grid_size, -0.2,  1), vec3(0        , -0.2,  1),
                vec3(0        ,  0  , 0), vec3(0        , -0.2,  1), vec3(0        ,  0  ,  1),
                vec3(0        ,  0  , 0), vec3(0        , -0.2,  0), vec3(0        , -0.2,  1),
                vec3(grid_size,  0  , 0), vec3(grid_size, -0.2,  1), vec3(grid_size,  0  ,  1),
                vec3(grid_size,  0  , 0), vec3(grid_size, -0.2,  0), vec3(grid_size, -0.2,  1),
                vec3(0        , -0.2, 6), vec3(grid_size, -0.2,  6), vec3(0        ,  0  ,  6),
                vec3(grid_size, -0.2, 6), vec3(grid_size,  0  ,  6), vec3(0        ,  0  ,  6),
                vec3(0        ,  0  , 6), vec3(0        ,  0  ,  7), vec3(grid_size,  0  ,  6),
                vec3(0        ,  0  , 7), vec3(grid_size,  0  ,  7), vec3(grid_size,  0  ,  6),
                vec3(grid_size,  0  , 7), vec3(grid_size, -0.2,  7), vec3(0        ,  0  ,  7),
                vec3(0        ,  0  , 7), vec3(grid_size, -0.2,  7), vec3(0        , -0.2,  7),
                vec3(0        ,  0  , 6), vec3(0        , -0.2,  7), vec3(0        ,  0  ,  7),
                vec3(0        ,  0  , 6), vec3(0        , -0.2,  6), vec3(0        , -0.2,  7),
                vec3(grid_size,  0  , 6), vec3(grid_size, -0.2,  7), vec3(grid_size,  0  ,  7),
                vec3(grid_size,  0  , 6), vec3(grid_size, -0.2,  6), vec3(grid_size, -0.2,  7),
                vec3(0        , -0.2, 12), vec3(grid_size, -0.2,  12), vec3(0        ,  0  ,  12),
                vec3(grid_size, -0.2, 12), vec3(grid_size,  0  ,  12), vec3(0        ,  0  ,  12),
                vec3(0        ,  0  , 12), vec3(0        ,  0  ,  13), vec3(grid_size,  0  ,  12),
                vec3(0        ,  0  , 13), vec3(grid_size,  0  ,  13), vec3(grid_size,  0  ,  12),
                vec3(grid_size,  0  , 13), vec3(grid_size, -0.2,  13), vec3(0        ,  0  ,  13),
                vec3(0        ,  0  , 13), vec3(grid_size, -0.2,  13), vec3(0        , -0.2,  13),
                vec3(0        ,  0  , 12), vec3(0        , -0.2,  13), vec3(0        ,  0  ,  13),
                vec3(0        ,  0  , 12), vec3(0        , -0.2,  12), vec3(0        , -0.2,  13),
                vec3(grid_size,  0  , 12), vec3(grid_size, -0.2,  13), vec3(grid_size,  0  ,  13),
                vec3(grid_size,  0  , 12), vec3(grid_size, -0.2,  12), vec3(grid_size, -0.2,  13),
                vec3(grid_size, -0.2, 7), vec3(grid_size, -0.2, 12), vec3(0        , -0.2, 12), 
                vec3(grid_size, -0.2, 7), vec3(0        , -0.2,  7), vec3(0        , -0.2, 12),
                
            ],
            gl.TRIANGLES
        );
    }

    draw() {
        this.load();
        gl.uniform4fv(colorLoc, this.color[1]);
        gl.drawArrays(this.draw_mode, 0, 6);
        gl.uniform4fv(colorLoc, this.color[0]);
        gl.drawArrays(this.draw_mode, 6, 90);
        gl.uniform4fv(colorLoc, this.color[2]);
        gl.drawArrays(this.draw_mode, 90, this.vertices.length);
    }
}

class Tree extends DrawableObject {
    constructor(size=0.3) {
        super(vec4(0.2, 0.5, 0.2, 1.0), cubeTriangles(size, size/2, size), gl.TRIANGLES);
        this.size = size;
        this.pos = {
            x : 0,
            z : 0
        }
    }

    draw() {
        for(var i = 0; i < grid_size; i+=2){
            tree.copy(i, 6);
        }
    }
    
    copy(x, z) {
        this.load();
        this.pos.x = x;
        this.pos.z = z;
        gl.uniformMatrix4fv(mvLoc, false, flatten(mult(mv, translate(
            tree.pos.x + (1-tree.size)/2,
            0,
            tree.pos.z + (1-tree.size)/2
        ))));
        gl.uniform4fv(colorLoc, this.color);
        gl.drawArrays(this.draw_mode, 0, this.vertices.length);
    }
}

class Car extends DrawableObject {
    constructor(color, pos, speed, size=0.6) {
        super(color, cubeTriangles(size, size, size), gl.TRIANGLES);
        this.size = size;
        this.pos = pos;
        this.speed = speed;
    }

    draw(mv) {
        this.load();
        gl.uniformMatrix4fv(mvLoc, false, flatten(mult(mv, translate(
            this.pos.x + (1-this.size)/2,
            -0.2,
            this.pos.z + (1-this.size)/2
        ))));
        gl.uniform4fv(colorLoc, this.color);
        gl.drawArrays(this.draw_mode, 0, this.vertices.length);
        this.move();
    }

    move() {
        this.pos.x += this.speed;
        if(this.speed > 0 && this.pos.x > grid_size) {
            this.pos.x = -1;
        } else
        if (this.speed < 0 && this.pos.x < -1) {
            this.pos.x = grid_size;
        }
    }
}

class Cars {
    constructor() {
        this.cars = Cars.create_cars();
    }

    draw(mv) {
        for(var i = 0; i < this.cars.length; i++) {
            for(var j = 0; j < this.cars[i].length; j++) {
                this.cars[i][j].draw(mv);
            }
        }
        if(frog.pos.z > 0 && frog.pos.z < 6) {
            for(var car of this.cars[frog.pos.z-1]) {
                if(
                    frog.pos.x +     (1-frog.size)/2 < car.pos.x + 1 - (1-car.size)/2 &&
                    frog.pos.x +     (1-frog.size)/2 > car.pos.x +     (1-car.size)/2 || 
                    frog.pos.x + 1 - (1-frog.size)/2 < car.pos.x + 1 - (1-car.size)/2 &&
                    frog.pos.x + 1 - (1-frog.size)/2 > car.pos.x +     (1-car.size)/2
                ) {
                    frogCollide();
                }
            }
        }
    }

    static create_cars() {
        var cars = [];
        for(var i = 0; i < 5; i++) {
            var lane_count = randRangeInt(1, 3);
            var lane_speed = 0.1/randRangeInt(2, 3);
            if(i % 2 == 0) {lane_speed = -lane_speed;}
            var spacing = randRangeInt(2, 3);
            var lane_color = vec4(
                randRangeInt(50, 100)/100,
                randRangeInt(50, 100)/100,
                randRangeInt(50, 100)/100,
                1.0
            );
            cars.push([]);
            for(var j = 1; j < lane_count+1; j++) {
                cars[i].push(new Car(
                    lane_color,
                    {z : i+1, x : randRangeInt(1, 4)+j*spacing}, 
                    lane_speed
                ));
            }
        }
        return cars;
    }
}

class Turtle extends DrawableObject {
    constructor(color, pos, speed, size=0.8) {
        super(color, cubeTriangles(size, size/8, size), gl.TRIANGLES);
        this.size = size;
        this.pos = pos;
        this.speed = speed;
        this.diving = false;
        this.dive_depth = 0;
    }

    draw(mv) {
        this.load();
        if(this.diving && this.dive_depth < 0.3) {
            this.dive_depth += 0.001;
        }
        if(!this.diving && this.dive_depth >= 0) {
            this.dive_depth = 0;
        }
        gl.uniformMatrix4fv(mvLoc, false, flatten(mult(mv, translate(
            this.pos.x + (1-this.size)/2,
            -0.2-this.dive_depth,
            this.pos.z + (1-this.size)/2
        ))));
        if(this.diving) {
            gl.uniform4fv(colorLoc, vec4(0.7, 0.4, 0.4, 1.0));
        } else {
            gl.uniform4fv(colorLoc, this.color);
        }
        gl.drawArrays(this.draw_mode, 0, this.vertices.length);
        this.move();
    }

    move() {
        this.pos.x += this.speed;
        if(this.speed > 0 && this.pos.x > grid_size) {
            this.pos.x = -1;
        } else 
        if(this.speed < 0 && this.pos.x < -1) {
            this.pos.x = grid_size;
        }
    }
}

class Turtles {
    constructor() {
        this.turtles = Turtles.create_turtles();
    }
    
    draw(mv) {
        for(var i = 0; i < this.turtles.length; i++) {
            for(var j = 0; j < this.turtles[i].length; j++) {
                this.turtles[i][j].draw(mv);
                if(!this.turtles[i][j].diving && this.turtles[i][j].dive_depth == 0 && Math.random() < 0.001) {
                    this.turtles[i][j].diving = true;
                }
                if(this.turtles[i][j].diving && this.turtles[i][j].dive_depth >= 0.2) {
                    this.turtles[i][j].diving = false;
                }
            }
        }
        if(frog.pos.z == 7 || frog.pos.z == 10) {
            var index;
            if(frog.pos.z == 7) {index = 0;} else {index = 1;}
            if(!frog.on_item) {
                for(var turtle of this.turtles[index]) {
                    if(
                        (
                            frog.pos.x +     (1-frog.size)/2 < turtle.pos.x + 1 - (1-turtle.size)/2 &&
                            frog.pos.x +     (1-frog.size)/2 > turtle.pos.x +     (1-turtle.size)/2 || 
                            frog.pos.x + 1 - (1-frog.size)/2 < turtle.pos.x + 1 - (1-turtle.size)/2 &&
                            frog.pos.x + 1 - (1-frog.size)/2 > turtle.pos.x +     (1-turtle.size)/2
                        )
                        && !turtle.diving
                    ) {
                        frog.on_item = true;
                        frog.speed = turtle.speed;
                        return;
                    }
                }
                frogCollide();
            }
        }
    }
    
    static create_turtles() {
        var turtles = [[], []];
        var color = vec4(0.4, 0.7, 0.4, 1.0);
        var offset = 0;
        for(var i = 0; i < grid_size; i++) {
            if(i % 4 == 0) {
                offset ++;
            } else {
                turtles[0].push(new Turtle(
                    color,
                    {x : i+offset, z : 7},
                    0.05
                ));
            }
        }
        for(var i = 0; i < grid_size; i++) {
            turtles[1].push(new Turtle(
                color,
                {x : i, z : 10},
                0.03
            ))
            turtles[1].push(new Turtle(
                color,
                {x : i+1, z : 10},
                0.03
            ))
            i += 4;
        }
        return turtles;
    }
}

class Log extends DrawableObject {
    constructor(pos, speed, size=0.8, length=randRangeInt(2, 4)) {
        super(vec4(0.545, 0.270, 0.074, 1.0), cubeTriangles(length-(1-size)/2, size/4, size), gl.TRIANGLES);
        this.size = size;
        this.length = length; 
        this.pos = pos;
        this.speed = speed;
    }

    draw(mv) {
        this.load();
        gl.uniformMatrix4fv(mvLoc, false, flatten(mult(mv, translate(
            this.pos.x + (1-this.size)/2,
            -0.2,
            this.pos.z + (1-this.size)/2
        ))));
        gl.uniform4fv(colorLoc, this.color);
        gl.drawArrays(this.draw_mode, 0, this.vertices.length);
        this.move();
    }

    move() {
        this.pos.x += this.speed;
        if(this.speed > 0 && this.pos.x > grid_size) {
            this.pos.x = -this.length;
        } else
        if(this.speed < 0 && this.pos.x < -this.length) {
            this.pos.x = grid_size;
        }
    }
}

class Logs {
    constructor() {
        this.logs = Logs.create_logs();
    }

    draw(mv) {
        for(var i = 0; i < this.logs.length; i++) {
            for(var j = 0; j < this.logs[i].length; j++) {
                this.logs[i][j].draw(mv);
            }
        }
        if(frog.pos.z == 8 || frog.pos.z == 9 || frog.pos.z == 11) {
            var index;
            if(frog.pos.z == 8) {index = 0;} else if(frog.pos.z == 9) {index = 1;} else {index = 2;}
            if(!frog.on_item) {
                for(var log of this.logs[index]) {
                    if (
                        frog.pos.x +     (1-frog.size)/2 < log.pos.x + log.length - (1-log.size)/2 &&
                        frog.pos.x +     (1-frog.size)/2 > log.pos.x +     (1-log.size)/2 || 
                        frog.pos.x + 1 - (1-frog.size)/2 < log.pos.x + log.length - (1-log.size)/2 &&
                        frog.pos.x + 1 - (1-frog.size)/2 > log.pos.x +     (1-log.size)/2
                    ) {
                        frog.on_item = true;
                        frog.speed = log.speed;
                        return;
                    }
                }
                frogCollide();
            }
        }
    }

    static create_logs() {
        var logs = [[], [], []];
        var speed = randRangeInt(2, 3);
        for(var i = 0; i < grid_size; i++) {
            logs[0].push(new Log(
                {x : i, z : 8},
                -0.1/speed,
                0.8,
                2
            ));
            i+=4;
        }
        speed = randRangeInt(5, 10);
        for(var i = 0; i < grid_size; i++) {
            logs[1].push(new Log(
                {x : i, z : 9},
                -0.1/speed,
                0.8,
                4
            ));
            i+=8;
        }
        speed = randRangeInt(3, 5);
        for(var i = 0; i < grid_size; i++) {
            logs[2].push(new Log(
                {x : i, z : 11},
                -0.1/speed,
                0.8,
                3
            ));
            i+=5
        }
        return logs;
    }
}

class Frog extends DrawableObject {
    constructor(size=0.5) {
        super(vec4(0.2, 0.5, 0.2, 1.0), cubeTriangles(size, size/2, size), gl.TRIANGLES);
        this.size = size;
        this.pos = {
            x : 6,
            z : 0
        }
        this.on_item = false;
        this.speed = 0;
    }

    draw(mv) {
        this.load();
        if(this.on_item) {
            this.pos.x += this.speed;
            this.on_item = false;
        }
        if(this.pos.z > 11) {
            update_points();
            frogCollide();
        }
        if(this.pos.z < 0) {
            this.pos.z = 0;
        } else if(this.pos.z > grid_size-1) {
            this.pos.z = grid_size-1;
        }
        if(this.pos.x < 0) {
            this.pos.x = 0;
        } else if(this.pos.x > grid_size-1) {
            this.pos.x = grid_size-1;
        }
        if(frog.pos.z > 0 && frog.pos.z < 6) {
            gl.uniformMatrix4fv(mvLoc, false, flatten(mult(mv, translate(
                frog.pos.x + (1-frog.size)/2,
                -0.2,
                frog.pos.z + (1-frog.size)/2
            ))));
        } else 
        if(frog.pos.z == 7 || frog.pos.z == 10) {
            gl.uniformMatrix4fv(mvLoc, false, flatten(mult(mv, translate(
                frog.pos.x + (1-frog.size)/2,
                -0.1,
                frog.pos.z + (1-frog.size)/2
            ))));
        } else {
            gl.uniformMatrix4fv(mvLoc, false, flatten(mult(mv, translate(
                frog.pos.x + (1-frog.size)/2,
                0,
                frog.pos.z + (1-frog.size)/2
            ))));
        }
        gl.uniform4fv(colorLoc, this.color);
        gl.drawArrays(this.draw_mode, 0, this.vertices.length);
    }

    move(x, z) {
        if(this.pos.x + x <= grid_size-1 && this.pos.x + x >= 0 && this.pos.z + z <= grid_size-1 && this.pos.z + z >= 0) {
            frog.on_item = false;
            this.pos.x += x;
            this.pos.z += z;
        }
    }
}

function randRangeInt(min, max) {
    return ((Math.random() * (max+1 - min)) + min) >> 0;
}
