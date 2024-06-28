import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
// import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
// // import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';

const container = document.getElementById('sphere-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0xffffff, 1); // White background
container.appendChild(renderer.domElement);

const radius = 5;
const dodecahedronGeometry = new THREE.DodecahedronGeometry(radius);
const vertices = dodecahedronGeometry.attributes.position.array;    

//// Create white sphere geometry and material
const sphereGeometry = new THREE.SphereGeometry(radius-0.005, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff , opacity: 0.9, transparent: true});

// Create sphere mesh
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 0, 0);
scene.add(sphere);

function createSphericalArc(start, end) {
    const points = [];
    for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        const point = new THREE.Vector3().lerpVectors(start, end, t);
        point.normalize().multiplyScalar(radius);
        points.push(point);
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    return new THREE.Line(geometry, material);
}

const projectionGroup = new THREE.Group();

for (let i = 0; i < vertices.length; i += 3) {
    const v1 = new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
    for (let j = i + 3; j < vertices.length; j += 3) {
        const v2 = new THREE.Vector3(vertices[j], vertices[j+1], vertices[j+2]);
        if (v1.distanceTo(v2) < radius * 1.) {
            const arc = createSphericalArc(v1, v2);
            projectionGroup.add(arc);
        }
    }
}

scene.add(projectionGroup);

camera.position.z = 15;

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // optional smooth damping effect


// Create text sprite for tooltip
const spriteMaterial = new THREE.SpriteMaterial({ map: new THREE.TextureLoader().load('textures/sprite.png') });
const sprite = new THREE.Sprite(spriteMaterial);
sprite.scale.set(10, 5, 1);
scene.add(sprite);
sprite.visible = false;


// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Event listener for mouse move
document.addEventListener('mousemove', onDocumentMouseMove);

function onDocumentMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObject(sphere);

    if (intersects.length >= 0) 
        {
        const intersect = intersects[0];
        // Display tooltip text or message
        // sprite.position.copy(intersect.point);
        sprite.position.set(mouse.x, mouse.y, 0);
        sprite.visible = true;
    } else {
        sprite.visible = false;
    }
}


function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls in every animation frame
    renderer.render(scene, camera);
}

animate();

// // Collapsible functionality
// const collapsibles = document.querySelectorAll('.collapsible');
// collapsibles.forEach(collapsible => {
//     collapsible.addEventListener('click', function() {
//         this.classList.toggle('active');
//         const content = this.nextElementSibling;
//         if (content.style.display === 'block') {
//             content.style.display = 'none';
//         } else {
//             content.style.display = 'block';
//             init(); // Initialize Three.js when content is shown
//         }
//     });
// });
