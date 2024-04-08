import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Variables to store camera movement and rotation
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let mouseX = 0;
let mouseY = 0;

// Event listeners for keyboard and mouse input
document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);
document.addEventListener('mousemove', onMouseMove, false);

// Functions to handle keyboard and mouse events
function onKeyDown(event) {
    switch (event.keyCode) {
        case 38: // up arrow
            moveForward = true;
            break;
        case 40: // down arrow
            moveBackward = true;
            break;
        case 37: // left arrow
            moveLeft = true;
            break;
        case 39: // right arrow
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.keyCode) {
        case 38: // up arrow
            moveForward = false;
            break;
        case 40: // down arrow
            moveBackward = false;
            break;
        case 37: // left arrow
            moveLeft = false;
            break;
        case 39: // right arrow
            moveRight = false;
            break;
    }
}

function onMouseMove(event) {
       // Calculate the normalized mouse coordinates relative to the window center
       const mouseXNormalized = (event.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
       const mouseYNormalized = (event.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
   
       // Calculate the angles for the camera rotation based on the normalized mouse coordinates
       const cameraYaw = Math.PI * mouseXNormalized;
       const cameraPitch = Math.PI * mouseYNormalized;
   
       // Update the camera rotation
       camera.rotation.y = cameraYaw;
       camera.rotation.x = cameraPitch;}
// Reset mouseX and mouseY values after each frame update
function resetMouseMovement() {
    mouseX = 0;
    mouseY = 0;
}

// Update camera position and rotation based on input
function updateCamera() {
    if (moveForward) camera.translateZ(-0.1);
    if (moveBackward) camera.translateZ(0.1);
    if (moveLeft) camera.translateX(-0.1);
    if (moveRight) camera.translateX(0.1);

    resetMouseMovement(); // Reset mouse movement after each frame
}


// Create a group to hold all the spheres
const sphereGroup = new THREE.Group();
// Create spheres
for (let i = 0; i < 10; i++) {
    const geometry = new THREE.SphereGeometry(1, 32,   32 );
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 1000 }); // shiny green material
    // const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 1, roughness: 0 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
    sphereGroup.add(sphere); // Add sphere to the group
    // Add sphere to the scene
    // scene.add(sphere);
}

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white ambient light
scene.add(ambientLight);
// Add the group to the scene
// scene.add(sphereGroup);
// add a large white sphere to encompass the sphere
// Create a sphere geometry
const cloudGeometry = new THREE.SphereGeometry(20, 32,   32 ); // Increase radius for a larger sphere

// Create a material with transparency
const cloudMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0xffffff , transparent: true, opacity: 0.5 });

// Create a mesh for the cloud sphere
const cloudSphere = new THREE.Mesh(cloudGeometry, cloudMaterial);

// Position the cloud sphere
cloudSphere.position.set(0, 0, 0); // You may need to adjust this based on your scene setup

// Add the cloud sphere to the scene
scene.add(cloudSphere);
const pointLight = new THREE.PointLight(0xffffff, 1, 10); // color, intensity, distance
pointLight.position.set(0, 0, 0); // Set light position relative to the sphere
pointLight.intensity = 1.5; 
// Create an ambient light inside the cloud sphere
const ambientLightInsideSphere = new THREE.AmbientLight(0xffffff, 0.5); // color, intensity
cloudSphere.add(ambientLightInsideSphere);
cloudSphere.add(pointLight);

camera.position.z = 5;

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
    updateCamera();
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
}
animate();