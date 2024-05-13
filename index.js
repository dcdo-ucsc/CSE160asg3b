let VERTEX_SHADER = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;

    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }
`;

let FRAGMENT_SHADER = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform int u_whichTexture;

    void main() {

        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;
        } else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        } else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);
        } else {
            gl_FragColor = vec4(1, 0.2, 0.2, 1);
        }
    }
`;

let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_whichTexture;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;

function setUpWebGL() {
    canvas = document.getElementById("webgl");

    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
    if (!gl) {
        console.log("Failed to get WebGL context.");
        return -1;
    }

    gl.enable(gl.DEPTH_TEST);
}

function vGLSL() {

    if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
        console.log("Failed to load/compile shaders");
        return -1;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }


    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0){
        console.log("Failed to get the storage location of u_Sampler0");
        return false;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1){
        console.log("Failed to get the storage location of u_Sampler1");
        return false;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture){
        console.log("Failed to get the storage location of u_whichTexture");
        return false;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

function initTextures(){

    var image1 = new Image();
    if(!image1){
        console.log("Failed to create the image1 object");
        return false;
    }
    image1.onload = function(){ sendTextureToGLSL(image1, 0); };

    image1.src = 'Pixel Art.jpeg';

    var image2 = new Image();
    if(!image2){
        console.log("Failed to create the image2 object");
        return false;
    }
    image2.onload = function(){ sendTextureToGLSL(image2, 1); };

    image2.src = 'Sky.jpg';

   
    return true;
}

function sendTextureToGLSL(image, textureUnit){
    var texture = gl.createTexture();
    if(!texture){
        console.log("Failed to create the texture object");
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    if (textureUnit === 0) {
        gl.uniform1i(u_Sampler0, 0);
    } else if (textureUnit === 1) {
        gl.uniform1i(u_Sampler1, 1);
    }

    console.log('Finished loadTexture');
}

let g_globalAngle = 0;
let g_lastSegmentAngle = 0;
let g_secondLastSegmentAngle = 0;
let g_animation = false;
let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;
let camera;
let blockMap = {};

function HTMLactions(){
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    document.onkeydown = keydown;
}

function main() {

    console.log("Hai :D!!!");

    setUpWebGL();

    vGLSL();

    HTMLactions();

    initTextures();

    camera = new Camera(canvas);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    requestAnimationFrame(tick);

}

var g_previousFrameTime = performance.now();

function tick(){
    var currentTime = performance.now();
    var deltaTime = currentTime - g_previousFrameTime;
    g_previousFrameTime = currentTime;

    renderScene();

    var fps = 1000 / deltaTime;
    sendTextToHTML("Seconds: " + (currentTime/1000).toFixed(2) + " fps: " + fps.toFixed(2), "performanceData");

    requestAnimationFrame(tick);
}

function keydown(ev) {
    switch (ev.keyCode) {
        case 87:
            camera.moveForward(0.1);
            break;
        case 83:
            camera.moveBackward(0.1);
            break;
        case 65:
            camera.moveLeft(0.1);
            break;
        case 68:
            camera.moveRight(0.1);
            break;
        case 81:
            camera.panLeft(5);
            break;
        case 69:
            camera.panRight(5);
            break;
        case 67:
            addBlockAtCamera();
            break;
        case 86:
            removeBlockAtCamera();
            break;
    }

    renderScene();
}

function addBlockAtCamera() {
    const blockKey = `${camera.eye.elements[0]},${camera.eye.elements[1]},${camera.eye.elements[2]}`;
    if (!blockMap[blockKey]) {
        const newBlock = new Cube();
        newBlock.matrix.translate(camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
        blockMap[blockKey] = newBlock;
    }
}

function removeBlockAtCamera() {
    const blockKey = `${camera.eye.elements[0]},${camera.eye.elements[1]},${camera.eye.elements[2]}`;
    if (blockMap[blockKey]) {
        delete blockMap[blockKey];
    }
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

let g_XAngle = 0;
let g_YAngle = 0;

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    const newX = event.clientX;
    const newY = event.clientY;

    const deltaX = newX - lastMouseX;
    const deltaY = newY - lastMouseY;

    g_YAngle = (g_YAngle - deltaX / 5) % 360; // Y-axis rotation
    g_XAngle = (g_XAngle - deltaY / 5) % 360; // X-axis rotation (inverted to match typical FPS controls)

    lastMouseX = newX;
    lastMouseY = newY;

    renderScene();
}

function convertCoord(ev){
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return [x, y];
}

function renderScene(){

    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

    var globalRotMat = new Matrix4().rotate(g_YAngle, 0, 1, 0);
    globalRotMat.rotate(g_XAngle, 1, 0, 0);

    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var cube1 = new Cube();
    cube1.color = [0.1, 0.8, 0.1, 1.0];
    cube1.matrix = new Matrix4(); 
    cube1.matrix.translate(-0.25, -0.25, -0.25);
    cube1.matrix.scale(0.25, 0.25, 0.25);
    cube1.textureNum = -2;
    cube1.render();

    var cube2 = new Cube();
    cube2.color = [0.1, 0.8, 0.1, 1.0];
    cube2.matrix = new Matrix4(); 
    cube2.matrix.translate(0.0, 0.0, 0.0);
    cube2.matrix.scale(0.25, 0.25, 0.25);
    cube2.textureNum = -1;
    cube2.render();

    var cube3 = new Cube();
    cube3.color = [0.1, 0.8, 0.1, 1.0];
    cube3.matrix = new Matrix4(); 
    cube3.matrix.translate(0.25, 0.25, 0.25);
    cube3.matrix.scale(0.25, 0.25, 0.25);
    cube3.textureNum = 0;
    cube3.render();

    var cube4 = new Cube();
    cube4.color = [0.1, 0.8, 0.1, 1.0];
    cube4.matrix = new Matrix4(); 
    cube4.matrix.translate(-.5, -.5, -.5);
    cube4.matrix.scale(0.25, 0.25, 0.25);
    cube4.textureNum = 2;
    cube4.render();

    var ground = new Cube();
    ground.color = [0.1, 0.8, 0.1, 1.0];
    ground.matrix = new Matrix4(); 
    ground.matrix.translate(-50.5, -.75, -49.5);
    ground.matrix.scale(100, 0.01, 100);
    ground.textureNum = -2;
    ground.render();

    var skybox = new Cube();
    skybox.color = [0.1, 0.8, 0.1, 1.0];
    skybox.matrix = new Matrix4(); 
    skybox.matrix.translate(-50.5, -.75, -49.5);
    skybox.matrix.scale(90, 90, 90);
    skybox.textureNum = 1;
    skybox.render();

    for (let key in blockMap) {
        blockMap[key].render();
    }
        
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}