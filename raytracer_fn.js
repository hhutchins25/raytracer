var worldObjects = [];
var canvas = document.getElementById("raytracerCanvas");

function Intersection(obj, pos) {
	this.obj = obj;
	this.pos = pos;
}

function WorldObject(posVec) {
	this.x = posVec[0];
	this.y = posVec[1];
	this.z = posVec[2];
}

function Sphere(posVec, radius) {
	WorldObject.call(this, posVec);
	this.radius = radius;
	worldObjects.push(this);
}

function rayTracer(width, height, fov, near, far, mode) {
	console.log('start raytracer...');
	let vfov = (height / width) * fov;
	let fovInc = 90 / width;
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
		color = "#FFFF00";
	} else if (mode === "color") {
		color = obj.color;
	}
	ctx.fillStyle = color;
	ctx.fillRect(pos[0], pos[1], 1, 1);
}

var vec = [0, 0, 25000];
var sphere1 = new Sphere(vec, 1000);
document.getElementById("initRaytracer").onclick = rayTracer(canvas.width, canvas.height, 90, 100, 100000, "bool");