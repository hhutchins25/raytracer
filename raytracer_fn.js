// Track created objects with global variable
var worldObjects = [];
var lightObjects = [];
var canvas = document.getElementById("raytracerCanvas");
var ctx = canvas.getContext("2d");

// Functions for instatiating objects/intersections
function Intersection(obj, pos) {
	this.obj = obj;
	this.pos = pos;
}

function WorldObject(posVec, color) {
	this.x = posVec[0];
	this.y = posVec[1];
	this.z = posVec[2];
	this.color = color;
}

function Sphere(posVec, radius, color) {
	WorldObject.call(this, posVec, color);
	this.radius = radius;
	worldObjects.push(this);
}

// Functions for creating lights
function Light(posVec, color, intensity) {
	WorldObject.call(this, posVec, color);
	this.intensity = intensity;
}

function AmbientLight(posVec, color, intensity) {
	Light.call(this, posVec, color, intensity);
	lightObjects.push(this);
}

function DirectionalLight(posVec, color, intensity, dirVec) {
	Light.call(this, posVec, color, intensity);
	this.dirVec = dirVec;
	lightObjects.push(this);
}

// Basic vector math
function dotProd(vec1, vec2) {
	return vec1.reduce((sum, val, idx) => {
		return sum + (val * vec2[idx]);
	}, 0);
}

function normalVec(vec) {
	let vecMag = Math.sqrt(vec.reduce((sum, val) => {
		return (sum + (Math.pow(val, 2)));
	}, 0));
	return vec.map(val => val / vecMag);
}

// Main function, initiates all functions
function rayTracer(width, height, fov, near, far, mode) {
	console.log('start raytracer...');
	// Establish the FOV for horizonal and vertical view 
	// TODO - compensate for condensing around FOV border
	let vfov = (height / width) * fov;
	let fovInc = fov / width;
	let vfovInc = vfov / height;
	let xPos = [];
	let yPos = [];
	// Per-pixel pos/vector horizontally
	for (let i = 1; i <= width; i++) {
		let currFov = (fovInc * i) - (fov / 2);
		let htan = Math.tan(currFov * (Math.PI / 180));
		xPos.push(htan * near);
	// Per-pixel pos/vector vertically
	} for (let i = 1; i <= height; i++) {
		let currVFov = (vfovInc * i) - (vfov / 2);
		let vtan = Math.tan(currVFov * (Math.PI / 180));
		yPos.push(vtan * near);
	}
	// With values gathered, loop through each pixel and
	// check for the intersection
	let incX = 0;
	xPos.forEach((x) => {
		incX += 1;
		let incY = 0;
		yPos.forEach((y) => {
			incY += 1;
			let result = rayCheck([x, y, near]);
			drawPixel([incX, incY], mode, result.obj, result.pos, [x, y, near]);
		});
	});
	console.log('finish raytracer!');
}

// Used for per-pixel intersection checks
function rayCheck(dirVec) {
	allIntrscts = [];
	worldObjects.forEach((obj) => {
		// Combine obj axes for easier mapping
		let objPos = [obj.x, obj.y, obj.z];
		// Adjust rayPos to simulate the sphere being placed at [0,0,0]
		let rayPos = dirVec.map((val, idx) => val - objPos[idx]);
		// Collect a, b, and c for quadratic formula
		// a = dirVec • dirVec
		// b = 2 * (dirVec • rayPos)
		// c = rayPos • dirVec - obj.radius(squared)
		let a = dotProd(dirVec, dirVec);
		let b = 2 * dotProd(dirVec, rayPos);
		let c = dotProd(rayPos, rayPos) - Math.pow(obj.radius, 2);
		// Collect both possible solutions for sphere intersection
		let quad1 = ((-1 * b) + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		let quad2 = ((-1 * b) - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		// Collect resulting intersection positions
		let point1 = rayPos.map((val, idx) => val + (quad1 * dirVec[idx]) + objPos[idx]);
		let point2 = rayPos.map((val, idx) => val + (quad2 * dirVec[idx]) + objPos[idx]);
		// Check for valid solutions and return the closest 
		// TODO - V MESSY, FIX
		if (!Number.isNaN(quad1) && !Number.isNaN(quad2)) {
			if (0 < quad1 < quad2) {
				allIntrscts.push(new Intersection(obj, point1));
			} else if (quad2 > 0) {
				allIntrscts.push(new Intersection(obj, point2));
			}
		} else if (!Number.isNaN(quad1) && quad1 > 0) {
			allIntrscts.push(new Intersection(obj, point1));
		} else if (!Number.isNaN(quad2) && quad2 > 0) {
			allIntrscts.push(new Intersection(obj, point2));
		}
	});
	return closestToOrigin(allIntrscts);
}

// Loop through all intersections and return the 
// closest to the camera
function closestToOrigin(intersections) {
	let minVal = Infinity;
	let minIntrsct = new Intersection(null, null);
	intersections.forEach((intrsct) => {
		let pointDist = Math.pow(intrsct.obj.x, 2) + Math.pow(intrsct.obj.y, 2) + Math.pow(intrsct.obj.z, 2);
		if (pointDist < minVal) {
			minVal = pointDist;
			minIntrsct = intrsct;
		}
	});
	return minIntrsct;
}

// Determines how a pixel should be colored based 
// on the informations gathered and given
function drawPixel(pos, mode, obj, intrsctPos, camRay) {
	let color;
	if (obj === null || intrsctPos === null) {
		color = "#000000";
	} else if (mode === "bool") {
		color = "#FFFFFF";
	} else if (mode === "color") {
		color = rgb2hex(obj.color);
	} else if (mode === "lighting" || mode === "spec") {
		let mult = 0;
		lightObjects.forEach((light) => {
			if (light instanceof DirectionalLight) {
				mult += lightPixel(light.dirVec, light.intensity, obj, intrsctPos, camRay, mode);
			} else {
				mult += light.intensity;
			}
		})
		color = rgb2hex(obj.color.map(val => Math.min(255, (val * mult))));
	}
	ctx.fillStyle = color;
	ctx.fillRect(pos[0], pos[1], 1, 1);
}

// Convert RGB values to hex for HTML usage
function rgb2hex(rgb) {
	str = "#";
	rgb.forEach((val) => {
		num = Math.round(val);
		currHex = Number(num).toString(16);
		if (currHex.length < 2) {
			currHex = "0" + currHex;
		}
		str += currHex;
	});
	return (str);
}

// Determines light intensity per pixel
function lightPixel(lightDir, intensity, obj, intrsctPos, camRay, mode) {
	// Calculate light intensity
	let objPos = [obj.x, obj.y, obj.z];
	let objNormVec = intrsctPos.map((val, idx) => (val - objPos[idx]) / obj.radius);
	let unitCamRay = normalVec(camRay);
	let lightMag = dotProd(objNormVec, lightDir);
	// Calculate specular intensity
	let specMult = 0;
	if (mode === "spec") {
		let incidVec = lightDir.map(val => val * -1);
		let incidNormDot = dotProd(incidVec, objNormVec);
		let reflVec = [0, 0, 0];
		incidVec.forEach((val, idx) => {
			reflVec[idx] = val - (2 * objNormVec[idx] * incidNormDot);
		});
		specMult = Math.max(0, dotProd(reflVec, unitCamRay));
	}
	// Return an intensity scalar combining lighting and specular
	if (lightMag < 0) {
		return 0;
	} else {
		return ((lightMag * intensity) + ((Math.pow(specMult, 32)) * intensity));
	}
}

// For tweaking values 
// TODO - VERY messy code, should clean
function initRaytracer() {
	// Delete all previous objects
	worldObjects = [];
	lightObjects = [];
	// Clear the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Instantiate all objects
	sph1elems = document.getElementById("sphere1").elements;
	var vec = [Number(sph1elems[0].value), Number(sph1elems[1].value), Number(sph1elems[2].value)];
	var sphere1 = new Sphere(vec, Number(sph1elems[3].value), [Number(sph1elems[4].value), Number(sph1elems[5].value), Number(sph1elems[6].value)]);
	sph2elems = document.getElementById("sphere2").elements;
	var vec = [Number(sph2elems[0].value), Number(sph2elems[1].value), Number(sph2elems[2].value)];
	var sphere1 = new Sphere(vec, Number(sph2elems[3].value), [Number(sph2elems[4].value), Number(sph2elems[5].value), Number(sph2elems[6].value)]);
	sph3elems = document.getElementById("sphere3").elements;
	var vec = [Number(sph3elems[0].value), Number(sph3elems[1].value), Number(sph3elems[2].value)];
	var sphere1 = new Sphere(vec, Number(sph3elems[3].value), [Number(sph3elems[4].value), Number(sph3elems[5].value), Number(sph3elems[6].value)]);
	dirLight1Elems = document.getElementById("dirLight1").elements;
	var dirLight1Vec = normalVec([Number(dirLight1Elems[1].value), Number(dirLight1Elems[2].value), Number(dirLight1Elems[3].value)]);
	var dirLight1 = new DirectionalLight([0, 0, 0], [0, 0, 0], Number(dirLight1Elems[0].value), dirLight1Vec);
	dirLight2Elems = document.getElementById("dirLight2").elements;
	var dirLight2Vec = normalVec([Number(dirLight2Elems[1].value), Number(dirLight2Elems[2].value), Number(dirLight2Elems[3].value)]);
	var dirLight2 = new DirectionalLight([0, 0, 0], [0, 0, 0], Number(dirLight2Elems[0].value), dirLight2Vec);
	ambLightElems = document.getElementById("ambLight").elements;
	var ambLight1 = new AmbientLight([0, 0, 0], [0, 0, 0], Number(ambLightElems[0].value));
	var modeSelect = document.getElementById("modeSelect");
	var mode = modeSelect.options[modeSelect.selectedIndex].value;
	console.log(mode);
	// Initialize raytracing process
	rayTracer(canvas.width, canvas.height, 30, 1000, 100000, mode);
}

initRaytracer();