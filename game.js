// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff,0.6));
const dirLight = new THREE.DirectionalLight(0xffffff,1);
dirLight.position.set(5,10,7.5);
scene.add(dirLight);

// --- Track function ---
function createTrack(pointsArray) {
    const curve = new THREE.CatmullRomCurve3(pointsArray);
    const geometry = new THREE.TubeGeometry(curve, 200, 3, 20, false);
    const material = new THREE.MeshStandardMaterial({color:0x333333});
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return curve;
}

// --- Stages setup ---
const stages = [
    [
        new THREE.Vector3(0,0,0),
        new THREE.Vector3(5,0,-20),
        new THREE.Vector3(-5,0,-40),
        new THREE.Vector3(10,0,-60),
        new THREE.Vector3(0,0,-80),
        new THREE.Vector3(0,0,-100)
    ],
    [
        new THREE.Vector3(0,0,0),
        new THREE.Vector3(-5,0,-20),
        new THREE.Vector3(5,0,-40),
        new THREE.Vector3(-10,0,-60),
        new THREE.Vector3(0,0,-80),
        new THREE.Vector3(5,0,-100)
    ]
];

let currentStage = 0;
let trackCurve = createTrack(stages[currentStage]);

// --- Obstacles ---
let obstacles = [];
function createObstacles(curve){
    // מחיקת מכשולים ישנים
    obstacles.forEach(o => scene.remove(o));
    obstacles = [];
    for(let i=0;i<10;i++){
        const obsGeo = new THREE.BoxGeometry(1,1,1);
        const obsMat = new THREE.MeshStandardMaterial({color:0x00ff00});
        const obs = new THREE.Mesh(obsGeo, obsMat);
        const t = Math.random();
        const point = curve.getPointAt(t);
        obs.position.set(point.x+(Math.random()-0.5)*4,0.5,point.z);
        scene.add(obs);
        obstacles.push(obs);
    }
}
createObstacles(trackCurve);

// --- Player Car ---
const carGeometry = new THREE.BoxGeometry(1,0.5,2);
const carMaterial = new THREE.MeshStandardMaterial({color:0xff0000});
const playerCar = new THREE.Mesh(carGeometry, carMaterial);
playerCar.position.set(0,0.25,0);
scene.add(playerCar);

// --- AI Cars ---
const aiCars = [];
for(let i=0;i<3;i++){
    const aiCar = new THREE.Mesh(carGeometry.clone(), new THREE.MeshStandardMaterial({color:Math.random()*0xffffff}));
    aiCar.position.set(0,0.25, -i*5-10);
    aiCars.push({mesh:aiCar, progress: i*0.02, speed: 0.001+Math.random()*0.002});
    scene.add(aiCar);
}

// --- Controls ---
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()]=true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()]=false);

let speed = 0;
const maxSpeed = 0.4;
const accel = 0.02;
const turnSpeed = 0.03;

// --- Player movement ---
function movePlayer(){
    if(keys['w']) speed += accel;
    else if(keys['s']) speed -= accel;
    else speed *= 0.95;
    if(speed>maxSpeed) speed=maxSpeed;
    if(speed<-maxSpeed) speed=-maxSpeed;

    if(keys['a']) playerCar.rotation.y += turnSpeed*(speed/maxSpeed);
    if(keys['d']) playerCar.rotation.y -= turnSpeed*(speed/maxSpeed);

    playerCar.position.x -= Math.sin(playerCar.rotation.y)*speed;
    playerCar.position.z -= Math.cos(playerCar.rotation.y)*speed;
}

// --- AI movement ---
function moveAICars(){
    aiCars.forEach(ai=>{
        ai.progress += ai.speed;
        if(ai.progress>1) ai.progress=0; // חזרה להתחלה
        const point = trackCurve.getPointAt(ai.progress);
        ai.mesh.position.set(point.x,0.25,point.z);
        const tangent = trackCurve.getTangentAt(ai.progress);
        ai.mesh.rotation.y = Math.atan2(-tangent.x,-tangent.z);
    });
}

// --- Camera follow ---
function updateCamera(){
    const offset = new THREE.Vector3(0,5,10).applyMatrix4(playerCar.matrixWorld);
    camera.position.lerp(offset,0.1);
    camera.lookAt(playerCar.position);
}

// --- Stage switch ---
function nextStage(){
    currentStage++;
    if(currentStage >= stages.length) currentStage=0;
    trackCurve = createTrack(stages[currentStage]);
    createObstacles(trackCurve);
    aiCars.forEach(ai=> ai.progress = Math.random()*0.1);
    playerCar.position.set(0,0.25,0);
}

// --- Animate ---
let frameCount = 0;
function animate(){
    requestAnimationFrame(animate);
    movePlayer();
    moveAICars();
    updateCamera();

    frameCount++;
    if(frameCount % 2000 === 0){ // כל כמה שניות עוברים שלב
        nextStage();
    }

    renderer.render(scene,camera);
}
animate();

// --- Resize ---
window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
