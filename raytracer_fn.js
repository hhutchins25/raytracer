var worldObjects = [];
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

function rayTracer(width, height, fov, near, far, mode) {
	console.log('start raytracer...');
	let vfov = (height / width) * fov;
	let fovInc = fov / width;
	let vfovInc = vfov / height;
	let xPos = [];
	let yPos = [];
	for (let i = 1; i <= width; i++) {
		let currFov = (fovInc *  i) - (fov / 2);
		let htan = Math.tan(currFov * (Math.PI / 180));
		xPos.push(htan * near);
	} for (let i = 1; i <= height; i++) {
		let currVFov = (vfovInc *  i) - (vfov / 2);
		let vtan = Math.tan(currVFov * (Math.PI / 180));
		yPos.push(vtan * near);
	}
	console.log(xPos);
	console.log(xPos);
	let incX = 0;
	xPos.forEach((x) => {
		incX += 1;
		let incY = 0;
		yPos.forEach((y) => {
			incY += 1;
			result = rayCheck([x, y, near]);
			drawPixel([incX, incY], mode, result.obj, result.pos);
		});
	});
	console.log('finish raytracer!');
}

function rayCheck(dirVec) {
	allIntrscts = [];
	worldObjects.forEach((obj) => {
		let objPos = [obj.x, obj.y, obj.z];
		let rayPos = dirVec.map((val, idx) => val - objPos[idx]);
		a = Math.pow(dirVec[0], 2) + Math.pow(dirVec[1], 2) + Math.pow(dirVec[2], 2);
		b = 2 * ((rayPos[0] * dirVec[0]) + (rayPos[1] * dirVec[1]) + (rayPos[2] * dirVec[2]));
		c = Math.pow(rayPos[0], 2) + Math.pow(rayPos[1], 2) + Math.pow(rayPos[2], 2) - Math.pow(obj.radius, 2);
		quad1 = ((-1 * b) + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		quad2 = ((-1 * b) - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		point1 = rayPos.map((val, idx) => val + (quad1 * dirVec[idx]) + objPos[idx]);
		point2 = rayPos.map((val, idx) => val + (quad2 * dirVec[idx]) + objPos[idx]);
		if (!Number.isNaN(quad1) && !Number.isNaN(quad2)) {
			allIntrscts.push(new Intersection(obj, Math.min(quad1, quad2)));
		} else if (!Number.isNaN(quad1)) { 
			allIntrscts.push(new Intersection(obj, point1));
		} else if (!Number.isNaN(quad2)) {
			allIntrscts.push(new Intersection(obj, point2));
		}
	});
	return closestToOrigin(allIntrscts);
}

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

function drawPixel(pos, mode, obj, intrsctPos) {
	let color;
	let ctx = canvas.getContext("2d");
	if (obj === null || intrsctPos === null) {
		color = "#000000";
	} else if (mode === "bool") {
		color = "#FFFFFF";
	} else if (mode === "color") {
		color = obj.color;
	}
	ctx.fillStyle = color;
	ctx.fillRect(pos[0], pos[1], 1, 1);
}

var vec = [0, 0, 25000];
var sphere1 = new Sphere(vec, 1000, "#FF0000");
var vec = [4000, 1200, 12000];
var sphere2 = new Sphere(vec, 1000, "#FFFF00");
var vec = [-4000, -1200, 8000];
var sphere3 = new Sphere(vec, 1000, "#00FFFF");
document.getElementById("initRaytracer").onclick = rayTracer(canvas.width, canvas.height, 65, 1000, 100000, "color");