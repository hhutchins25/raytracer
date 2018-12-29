var worldObjects = [];
var canvas = document.getElementById("raytracerCanvas");

function Intersection(obj, pos) {
	this.obj = obj;
	this.pos = pos;
}

function WorldObject(posVec) {
	console.log(posVec);
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
		let currFov = (fovInc *  i) + (fov / 2);
		let htan = Math.tan(currFov * (Math.PI / 180));
		xPos.push(htan * near);
	} for (let i = 1; i <= height; i++) {
		let currVFov = (vfovInc *  i) + (vfov / 2);
		let vtan = Math.tan(currVFov * (Math.PI / 180));
		yPos.push(vtan * near);
	}
	console.log(xPos);
	console.log(yPos)
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
	console.log('finished!');
}

function rayCheck(dirVec) {
	allIntrscts = [];
	worldObjects.forEach((obj) => {
		let rayPos = [(dirVec[0] - obj.x), (dirVec[1] - obj.y), (dirVec[2] - obj.z)];
		console.log(rayPos);
		console.log(dirVec);
		console.log(obj.radius);
		a = Math.pow(dirVec[0], 2) + Math.pow(dirVec[1], 2) + Math.pow(dirVec[2], 2);
		console.log("a is " + String(a))
		b = (rayPos[0] * dirVec[0]) + (rayPos[1] * dirVec[1]) + (rayPos[2] + dirVec[2]);
		console.log("b is " + String(b))
		c = Math.pow(rayPos[0], 2) + Math.pow(rayPos[1], 2) + Math.pow(rayPos[2], 2) - Math.pow(obj.radius, 2);
		console.log("c is " + String(c))
		quad1 = ((-1 * b) + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		quad2 = ((-1 * b) - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
		console.log(quad1);
		console.log(quad2);
		if (quad1 !== null && quad2 !== null) {
			allIntrscts.push(new Intersection(obj, Math.min(quad1, quad2)));
		} else if (quad2) { 
			allIntrscts.push(new Intersection(obj, quad2));
		} else if (quad1) {
			allIntrscts.push(new Intersection(obj, quad1));
		}
	});
	return closestToOrigin(allIntrscts);
}

function closestToOrigin(intersections) {
	console.log("begin checking intrscts...")
	let minVal = Infinity;
	let minIntrsct = new Intersection(null, null);
	intersections.forEach((intrsct) => {
		dist = Math.pow(intrsct.x, 2) + Math.pow(intrsct.y, 2) + Math.pow(intrsct.z, 2);
		console.log(dist);
		if (dist < minVal) { 
			minVal = dist;
			minIntrsct = intrsct;
		}
	});
	return minIntrsct;
}

function drawPixel(pos, mode, obj, intrsctPos) {
	let color;
	let ctx = canvas.getContext("2d");
	if (obj === null) {
		color = "#000000";
	} else if (mode === "bool") {
		color = "#FFFFFF";
	} else if (mode === "color") {
		color = obj.color;
	}
	ctx.fillStyle = color;
	ctx.fillRect(pos[0], pos[1], 1, 1);
}

var vec = [0, 0, 100];
var sphere1 = new Sphere(vec, 100);
console.log(rayCheck([0,0,1]))
console.log(worldObjects);
// document.getElementById("initRaytracer").onclick = rayTracer(canvas.width, canvas.height, 90, 1000, 100000, "bool");