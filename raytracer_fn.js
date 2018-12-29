// Track created objects with global variable
var worldObjects = [];
var lightObjects = [];
var canvas = document.getElementById("raytracerCanvas");

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

// Main function, initiates all functions
function rayTracer(width, height, fov, near, far, mode) {
	console.log('start raytracer...');
	// Establish the FOV for horizonal and vertical view
	let vfov = (height / width) * fov;
	let fovInc = fov / width;
	let vfovInc = vfov / height;
	let xPos = [];
	let yPos = [];
	// Per-pixel pos/vector horizontally
	for (let i = 1; i <= width; i++) {
		let currFov = (fovInc *  i) - (fov / 2);
		let htan = Math.tan(currFov * (Math.PI / 180));
		xPos.push(htan * near);
	// Per-pixel pos/vector vertically
	} for (let i = 1; i <= height; i++) {
		let currVFov = (vfovInc *  i) - (vfov / 2);
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
			drawPixel([incX, incY], mode, result.obj, result.pos);
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
		let a = Math.pow(dirVec[0], 2) + Math.pow(dirVec[1], 2) + Math.pow(dirVec[2], 2);
		let b = 2 * ((rayPos[0] * dirVec[0]) + (rayPos[1] * dirVec[1]) + (rayPos[2] * dirVec[2]));
		let c = Math.pow(rayPos[0], 2) + Math.pow(rayPos[1], 2) + Math.pow(rayPos[2], 2) - Math.pow(obj.radius, 2);
		// Collect both possible solutions for sphere intersection
		let quad1 = ((-1 * b) + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		let quad2 = ((-1 * b) - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		// Collect resulting intersection positions
		let point1 = rayPos.map((val, idx) => val + (quad1 * dirVec[idx]) + objPos[idx]);
		let point2 = rayPos.map((val, idx) => val + (quad2 * dirVec[idx]) + objPos[idx]);
		// Check for valid solutions and return the closest
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
function drawPixel(pos, mode, obj, intrsctPos) {
	let color;
	let ctx = canvas.getContext("2d");
	if (obj === null || intrsctPos === null) {
		color = "#000000";
	} else if (mode === "bool") {
		color = "#FFFFFF";
	} else if (mode === "color") {
		color = rgb2hex(obj.color);
	} else if (mode === "lighting") {
		let mult = 0;
		lightObjects.forEach((light) => {
			if (light instanceof DirectionalLight) {
				mult += lightPixel(light.dirVec, light.intensity, obj, intrsctPos);
			} else {
				mult += light.intensity;
			}
		})
		color = rgb2hex(obj.color.map(val => val * mult));
	}
	ctx.fillStyle = color;
	ctx.fillRect(pos[0], pos[1], 1, 1);
}

function rgb2hex (rgb) { 
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

function lightPixel(lightDir, intensity, obj, intrsctPos) {
	let objPos = [obj.x, obj.y, obj.z];
	let normalVec = intrsctPos.map((val, idx) => (val - objPos[idx]) / obj.radius);
	let dotProd = 0;
	let directLight = normalVec.forEach((val, idx) => {
		dotProd = dotProd + (val * lightDir[idx]);
	});
	if (dotProd < 0) {
		return 0;
	} else {
		return (dotProd * intensity);
	}
}

// Dev testing values
var vec = [0, 0, 25000];
var sphere1 = new Sphere(vec, 1000, [255,0,0]);
var vec = [2000, 2800, 15000];
var sphere2 = new Sphere(vec, 1000, [255,255,0]);
var vec = [-2000, -600, 10000];
var sphere3 = new Sphere(vec, 1000, [0,255,255]);
var vec = [1000, -300, 5000];
var sphere4 = new Sphere(vec, 1000, [150,240,20]);
var dirLight1 = new DirectionalLight([0,0,0], [0,0,0], 0.3, [0,.707,.707,0]);
var dirLight1 = new DirectionalLight([0,0,0], [0,0,0], 0.1, [0.707,0,0.707]);
var ambLight1 = new AmbientLight([0,0,0], [0,0,0], 0.1);
rayTracer(canvas.width, canvas.height, 30, 1000, 100000, "lighting");