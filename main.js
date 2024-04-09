import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
// import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';


// globals
let renderer, scene, camera;
let cameraPosOld;
let factor = 1;
let confs = [];
let icos = [];
let index = 1;
let counter =0; 
let N;
let dt = 0.5;
let R = 2.103;
let sigma = 0.15;



// Create a group to hold all the spheres
let sphereGroup = new THREE.Group();

// Keyboard controls
const speed = 0.1;
const keys = {};

document.addEventListener('keydown', (event) => {
	keys[event.code] = true;
});
document.addEventListener('keyup', (event) => {
	keys[event.code] = false;
});

init();
animate();

// -----------------------------------------------------------------------------

// FUNCTIONS

function mapValueToColor(value, min, max) {
    // Normalize the value between 0 and 1
    var t = (value - min) / (max - min);
    
    // Define the range of colors in the HSL space (e.g., blue to red)
    var hueStart = 0.; // Blue
    var hueEnd = 0.5;   // Red
    
    // Interpolate the hue value
    var hue = (1 - t) * hueStart + t * hueEnd;
    
    // Set the saturation and lightness to constant values
    var saturation = 1.0;
    var lightness = 0.5;
    
    // Create a new color based on the HSL values
    var color = new THREE.Color().setHSL(hue, saturation, lightness);
    
    return color;
}


function init() {

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
	camera.position.set( 0, 0, 0. );
	cameraPosOld = camera.position.clone();
	new OrbitControls( camera, renderer.domElement );

	// parsing the coordinates\
	console.log("Reading the coordinates...")
	const tj = coordFile.content.split('\n');
	N = parseInt(tj[0]);
	const nconfs = Math.floor((tj.length)/(N+2),)

	// read all confs 
	const blockLen = N+2;

	for (let i = 0; i < nconfs; i++) {
		var frame = {'x':[],'y':[],'z':[],'w':[]};
		for (let j = 2; j < N+2; j++) {
			const line = tj[i*blockLen+j].split(/\s+|\t+/);
			frame['x'].push(parseFloat(line[1]));
			frame['y'].push(parseFloat(line[2]));
			frame['z'].push(parseFloat(line[3]));
			frame['w'].push(parseFloat(line[4]));
		}
		confs.push(frame);
		
	}
	console.log("Read ", N, "coordinates of",confs.length, "frames");

	// parsing the icosahedral clusters

	console.log("Reading the icosahedral clusters...")
	const icotj = icoFile.content.split('\n');
	let first = true;
	var frame ;
	for (let i = 0; i < icotj.length; i++) {
		
		if (icotj[i].includes("Frame")){
			
			if (first==false){
				icos.push(frame)
			}
			frame = []
			first = false;

		}
		else {
			let clusterIndices = icotj[i].split(' ').map(str => parseInt(str));;
			// skip first value because it is the cluster ID
			frame.push(clusterIndices.slice(1));
		}
		
	}
	// add last one
	icos.push(frame)
	console.log(icos);

	// Sky

	const canvas = document.createElement( 'canvas' );
	canvas.width = 1;
	canvas.height = 32;

	const context = canvas.getContext( '2d' );
	const gradient = context.createLinearGradient( 0, 0, 0, 32 );
	gradient.addColorStop( 0.0, '#014a84' );
	gradient.addColorStop( 0.5, '#0561a0' );
	gradient.addColorStop( 1.0, '#437ab6' );
	context.fillStyle = gradient;
	context.fillRect( 0, 0, 1, 32 );

	const skyMap = new THREE.CanvasTexture( canvas );
	skyMap.colorSpace = THREE.SRGBColorSpace;

	const sky = new THREE.Mesh(
		new THREE.SphereGeometry( R ),
		new THREE.MeshBasicMaterial( { map: skyMap, side: THREE.BackSide } )
	);

	sky.name  = "sky";
	scene.add( sky );
	// Create spheres

	console.log("Here is confs", confs[index]);
	for (let i = 0; i < confs[0]['x'].length; i++) {
		const geometry = new THREE.SphereGeometry(sigma, 32,   32 );
		// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		// const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 1000 }); // shiny green material
		const material = new THREE.MeshPhongMaterial({ color: mapValueToColor(confs[index]['w'][i],-R,R), shininess: 1000 }); // shiny green material
		// const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 1, roughness: 0 });
		const sphere = new THREE.Mesh(geometry, material);
		// console.log("spheres ",confs[index]['x'][i],confs[index]['y'][i],confs[index]['z'][i]);
		if (confs[index]['w'][i]*factor>0){
			sphere.position.set(confs[index]['x'][i],confs[index]['y'][i],confs[index]['z'][i]);
			sphereGroup.add(sphere); // Add sphere to the group
		}
	}

	scene.add(sphereGroup);

	// now the icosahedra
	

	// lights
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(1, 1, 1).normalize();
	scene.add(directionalLight);
	const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(-1, -1, -1).normalize();
	scene.add(directionalLight2);
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white ambient light
	scene.add(ambientLight);

	// parameters for GUI
	const parameters={'dt':dt};

	function update() {
		dt = parameters.dt;
	}

	// GUI panel
	const gui = new GUI();
	gui.add( parameters, 'dt', 0.001, 1.0, 0.001 ).onChange( update );
	document.body.appendChild( gui.domElement );

	// switch scene by pressing a key
	document.addEventListener('keydown', onKeyDown, false);

}

// Function to Change World (i.e. if the fourth coordinate is positive/negative we are in paradise/hell)
function switchScene() {
	// change sign  of factor selective positive/negative w
	factor*=-1;
	changeMessage();
	let skyMaterial;
	scene.traverse(function(child) {
		if (child instanceof THREE.Mesh && child.name === 'sky') {

			skyMaterial = child.material;
		}	
	});

	if (skyMaterial) {
		// Access the canvas from the sky material's map
		const canvas = skyMaterial.map.image;

		// Access the canvas context
		const context = canvas.getContext('2d');
		const gradient = context.createLinearGradient( 0, 0, 0, 32 );

		if (factor>0){
	
		gradient.addColorStop( 0.0, '#014a84' );
		gradient.addColorStop( 0.5, '#0561a0' );
		gradient.addColorStop( 1.0, '#437ab6' );

		}
		else{
			gradient.addColorStop(0.0, '#ff0000'); // Red
			gradient.addColorStop(0.5, '#ffff00'); // Yellow
			gradient.addColorStop(1.0, '#FF25FB'); // Blue
		}

		// Update the canvas with the new gradient
		context.fillStyle = gradient;
		context.fillRect(0, 0, 1, 32);

		// Recreate the texture with the updated canvas
		const skyMap = new THREE.CanvasTexture(canvas);
		skyMap.colorSpace = THREE.SRGBColorSpace;

		// Update the material's map property with the new texture
		skyMaterial.map = skyMap;
		skyMaterial.needsUpdate = true; // Ensure material update
	}

	window.addEventListener('resize', onWindowResize);	
}



function onKeyDown(event) {
    switch (event.code) {
        case 'Space':
            switchScene();
            break;
        default:
            break;
    }
}

// Function to change message
function changeMessage() {
    var textElement = document.getElementById('textOverlay');
	if (factor<0){
	    textElement.innerHTML = "<h2> Hyper-hemisphere w<0 </h2>";
	}
	else{textElement.innerHTML = "<h2> Hyper-hemisphere w>0 </h2>";}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {

	requestAnimationFrame( animate );

	// keyboard control
	const forwardDirection = new THREE.Vector3(); // Create a vector to store the forward direction
	camera.getWorldDirection(forwardDirection); // Get the camera's forward direction
	if (keys['ArrowUp']) {
		cameraPosOld = camera.position.clone();
		camera.position.addScaledVector(forwardDirection, speed); // Move camera forward
		console.log(camera.position);
	}
	if (keys['ArrowDown']) {
		camera.position.addScaledVector(forwardDirection, -speed); // Move camera backward
		console.log(camera.position);
	}
	
	// move to the other world if you go forward
	const origin = new THREE.Vector3(0, 0, 0);
	const distanceFromOrigin = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
	const distanceFromOriginOld = cameraPosOld.distanceTo(new THREE.Vector3(0, 0, 0));

	if (distanceFromOrigin>R && keys['ArrowUp'] && distanceFromOriginOld<R){
	
		 camera.lookAt(origin);
		const newPos = camera.position.normalize().multiplyScalar(0.99*R);	
		console.log(newPos);
		camera.position.set(newPos.x, newPos.y,newPos.z ) ;

		console.log(camera.position);
		// move to the other world
		switchScene();
	}
	// console.log(sphereGroup);	
	// `clear and redraw
	// clear`
	while (sphereGroup.children.length) {
        const child = sphereGroup.children[0];
        sphereGroup.remove(child);
        child.geometry.dispose(); // Dispose of geometry
        child.material.dispose(); // Dispose of material
    }


	for (let i = 0; i < N; i++) {
		const geometry = new THREE.SphereGeometry(sigma, 32,   32 );
		// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		// const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 1000 }); // shiny green material
		const material = new THREE.MeshPhongMaterial({ 
			color: mapValueToColor(confs[index]['w'][i],-R,R), 
		shininess: 1,
		specular: 0x000000, // Set specular color to black to reduce metallic appearance
		flatShading: false, // Enable smooth shading for a more rubbery appearance
		// transparent: true, 
		// opacity: 0.9
	
	}); // shiny green material
		// const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 1, roughness: 0 });
		const sphere = new THREE.Mesh(geometry, material);
		if (confs[index]['w'][i]*factor>0){
			sphere.position.set(confs[index]['x'][i],confs[index]['y'][i],confs[index]['z'][i]);
			sphereGroup.add(sphere); // Add sphere to the group
		}
		

	}

	// now the icosahdra
	// Create a ConvexHull object

	// console.log(index,icos[index].length);

		
	for (let j = 0; j < icos[index].length; j++) {
		
		// generating the indices
		let indices = icos[index][j];
		let x = confs[index].x;
		let y = confs[index].y;
		let z = confs[index].z;
		let w = confs[index].w;
		const xCoordinates = indices.map(idx => x[idx]);
		const yCoordinates = indices.map(idx => y[idx]);
		const zCoordinates = indices.map(idx => z[idx]);
		const wCoordinates = indices.map(idx => z[idx]);

		// if (wCoordinates.every(value => value*factor>0))
		{
		const vertices = xCoordinates.map((x, dd) => new THREE.Vector3(x, yCoordinates[dd], zCoordinates[dd]));
		// console.log(vertices);
		const meshMaterial = new THREE.MeshLambertMaterial( {
			color: 0xffffff,
			opacity: 0.33,
			emissive: 0xfffff,
			side: THREE.DoubleSide,
			transparent: true
		} );

		const meshGeometry = new ConvexGeometry( vertices );

		const mesh = new THREE.Mesh( meshGeometry, meshMaterial );
		// console.log("mesh",mesh)
		sphereGroup.add( mesh );
		}
	}

	// console.log("children", sphereGroup.children.length),index;
	

	
	// index = 35;
	counter += dt;
	index = Math.floor(counter);
	index %= confs.length;
	// console.log(index,dt);





	renderer.render( scene, camera );

}
