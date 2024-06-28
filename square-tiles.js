import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let squares = [], dragObject = null, raycaster, mouse;
const container = document.getElementById('square-container');



init();
animate();

function init() {


    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    // camera = new THREE.OrthographicCamera(container.clientWidth / -2, container.clientWidth / 2, container.clientHeight / 2, container.clientHeight / -2, 0.0001, 1000);
    
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0xffffff, 1); // White background
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // // Plane
    // const planeGeometry = new THREE.PlaneGeometry(20, 20);
    // const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
    // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.rotation.x = Math.PI / 2;
    // scene.add(plane);

    // Squares
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
    const squareGeometry = new THREE.PlaneGeometry(1, 1);
    colors.forEach(color => {
        const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        const square = new THREE.Mesh(squareGeometry, material);
        square.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, 1); // Slightly above the plane
        scene.add(square);
        squares.push(square);
    });

    // Raycaster and Mouse
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mouseup', onMouseUp, false);
}

function onWindowResize() {
    const container = document.getElementById('square-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function onMouseDown(event) {
    event.preventDefault();

    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(squares);

    if (intersects.length > 0) {
        dragObject = intersects[0].object;
        controls.enabled = false;
    }
}


function onMouseMove(event) {
    event.preventDefault();

    if (dragObject) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([scene.getObjectByName("ground")]);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            dragObject.position.set(intersect.point.x, 0.01, intersect.point.z);
        }
    }
}

function onMouseUp(event) {
    event.preventDefault();
    dragObject = null;
    controls.enabled = true;
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
