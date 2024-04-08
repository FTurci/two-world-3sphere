import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let renderer, scene, camera;
let skyMapOld;
let factor = 1;
let confs = [];
let index = 1;
let counter =0; 
let N;
let dt = 0.001;
let R = 2.103;
let sigma = 0.1;
// Create a group to hold all the spheres
let sphereGroup = new THREE.Group();

init();
animate();

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
	camera.position.set( 0, 0, -0.1 );

	new OrbitControls( camera, renderer.domElement );

	
	const tj = globalFileContent.split('\n');
	
	N = parseInt(tj[0]);
	const nconfs = Math.floor((tj.length)/(N+2),)
	console.log("Ecco",N,nconfs);
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

	console.log(confs[0]['x']);
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

	// for (let i = 0; i < 10; i++) {
	// 	const geometry = new THREE.SphereGeometry(0.1, 32,   32 );
	// 	// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	// 	const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 1000 }); // shiny green material
	// 	// const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 1, roughness: 0 });
	// 	const sphere = new THREE.Mesh(geometry, material);
	// 	sphere.position.set(i-5,i-5,i-5);
	// 	sphereGroup.add(sphere); // Add sphere to the group
	// }
	scene.add(sphereGroup);
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(1, 1, 1).normalize();
	scene.add(directionalLight);
	const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(-1, -1, -1).normalize();
	scene.add(directionalLight2);
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white ambient light
	scene.add(ambientLight);


	const parameters={'dt':dt};

	function update() {
		dt = parameters.dt;
	}

	// GUI panel
	const gui = new GUI();
	gui.add( parameters, 'dt', 0.001, 0.1, 0.001 ).onChange( update );
	document.body.appendChild( gui.domElement );

	// switch scene by pressing a key
	document.addEventListener('keydown', onKeyDown, false);

}

// Switch scene function
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


function animate() {

	requestAnimationFrame( animate );

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

		counter += dt;
		
		index = Math.floor(counter);
		index %= confs.length;
		// console.log(index,dt);
	}


	renderer.render( scene, camera );

}
