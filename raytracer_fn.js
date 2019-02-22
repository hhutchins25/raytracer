var canvas = document.getElementById("raytracerCanvas");
var ctx = canvas.getContext("2d");

/*--------------------------------------------------------------*/
// CORE CLASSES
// All secondary classes derive from these objects
/*--------------------------------------------------------------*/

// Creates and initiates raytracer functionality
class RayTracer {
  constructor(width, height, fov, nearPlane, farPlane, mode, 
    worldObjects, lightObjects) {
    this.width = width;
    this.height = height;
    this.fov = fov; 
    this.vfov = (height / width) * fov;
    this.near = nearPlane;
    this.far = farPlane;
    this.mode = mode;
    this.worldObjects = worldObjects;
    this.lightObjects = lightObjects;
    this.camPos = new Vector3([0,0,0]);
  }
  // Initiates process of raytracing, 
  // mostly done in private functions
  init() { 
    console.log('start raytracer...');
    // With values gathered, loop through each pixel and
    // check for the intersection
    const pixelPos = this._calcPlanePositions();
    const { xPos, yPos } = pixelPos;
    this._loopThroughPixels(xPos, yPos);
    console.log('finish raytracer!');
  }
  // Calculates x and y values for each row and column of canvas
  _calcPlanePositions() {
    // TODO - compensate for condensing around FOV border
    const fovInc = this.fov / this.width;
    const vfovInc = this.vfov / this.height;
    const xPos = [];
    const yPos = [];
    // Per-pixel pos/vector horizontally
    for (let i = 1; i <= this.width; i += 1) {
      const currFov = (fovInc * i) - (this.fov / 2);
      const htan = Math.tan(currFov * (Math.PI / 180));
      xPos.push(htan * this.near);
    } 
    // Per-pixel pos/vector vertically
    for (let i = 1; i <= this.height; i += 1) {
      const currVFov = (vfovInc * i) - (this.vfov / 2);
      const vtan = Math.tan(currVFov * (Math.PI / 180));
      yPos.push(vtan * this.near);
    }
    return {xPos, yPos};
  }
  // Loops through each pixel and draws for the closest intersection
  _loopThroughPixels(xPos, yPos) {
    let startTime = Date.now() / 1000;
    let incX = 0;
    xPos.forEach((x) => {
      incX += 1;
      let incY = 0;
      yPos.forEach((y) => {
        incY += 1;
        let camVec = new Vector3([x, y, this.near]);
        let intersections = [];
        this.worldObjects.forEach((obj) => {
          intersections.push(obj.rayCheck(new Ray(this.camPos, camVec)));
        })
        const result = Intersection.closestToOrigin(intersections);
        this._drawPixel([incX, incY], this.mode, result, camVec);
      });
    });
    let endTime = Date.now() / 1000;
    console.log(endTime - startTime);
  }
  // Used for looping through each pixel of canvas and draw
  // resulting collisions 
  _drawPixel(pos, mode, collision, camRay) {
    let color;
    if (collision.obj === null || collision.intrsctPos === null) {
      color = '#000000';
    } else if (mode === 'bool') {
      color = '#FFFFFF';
    } else if (mode === 'color') {
      color = collision.obj.color.convertToHex();
    } else if (mode === 'lighting' || mode === 'spec') {
      let mult = 0;
      this.lightObjects.forEach((currLight) => {
        mult += currLight.lightPixel(collision, camRay, this.mode);
      });
      color = (collision.obj.color.multScalar(mult)).convertToHex();
    }
    ctx.fillStyle = color;
    ctx.fillRect(pos[0], pos[1], 1, 1);
  }
}

// All objects with a physical position in the world extend
// from this object and its children
class WorldObject {
  constructor(pos) {
    this.pos = pos;
  }
}

/*--------------------------------------------------------------*/
// SHAPE CLASSES
// Extends from: WorldObject
// Contains all shapes (2d/3d) and geometric objects (lines, rays, etc)
/*--------------------------------------------------------------*/

// Parent class for all shapes
class Shape extends WorldObject {
  constructor(pos, color) {
    super(pos);
    this.color = color;
  }
}

// Constructs physical sphere and contains related math
class Sphere extends Shape {
  constructor(pos, radius, color) {
    super(pos, color);
    this.radius = radius;
  }
  rayCheck(ray) {
    let rayPos = ray.pos.diff(this.pos);
    // Collect a, b, and c for quadratic formula
    const a = ray.dir.dotProd(ray.dir);
    const b = 2 * ray.dir.dotProd(rayPos);
    const c = rayPos.dotProd(rayPos) - (this.radius ** 2); 
    // Collect both possible solutions for sphere intersection
    let { quad1, quad2 } = GenAlg.findRoots(a, b, c);
    // Return the closest values
    if (quad1 > quad2) {
      if (quad2 > 0) return (new Intersection(this, (ray.pos.sum(ray.dir.multScalar(quad2))), ray));
    } else if (quad2 > quad1) {
      if (quad1 > 0) return (new Intersection(this, (ray.pos.sum(ray.dir.multScalar(quad1))), ray));
    } 
    return undefined;
  }
  getNormalFromPoint(point) {
    return (point.diff(this.pos)).normalize();
  }
}

// Constructs physical triangle and contains related math
class Triangle extends Shape {
  constructor(vert1, vert2, vert3, color) {
    const center = GenAlg.center([vert1, vert2, vert3]);
    super(center, color);
    this.vert1 = vert1;
    this.vert2 = vert2;
    this.vert3 = vert3;
    this.center = center;
    this.normal = getNormal();
  }
  // Returns normal of triangle (may be flipped)
  getNormal() {
    let ray1 = this.vert2.diff(this.vert1);
    let ray2 = this.vert3.diff(this.vert1);
    return (ray1.crossProd(ray2)).normalize();
  }
}

/*--------------------------------------------------------------*/
// HELPER CLASSES
// Extends from: WorldObject
// Contains non-physical objects placed in the world 
// (rays, dummies, intersections, etc)
/*--------------------------------------------------------------*/


// Constructs non-renderable ray
class Ray extends WorldObject {
  constructor(pos, dir) {
    super(pos);
    this.dir = dir;
  }
}

// Constructs intersections and contains sort functions
class Intersection extends WorldObject {
  constructor(obj, pos, incidRay) {
    super(pos);
    this.obj = obj;
    this.incidRay = incidRay;
  }
  // Returns the intersection closest to the origin (camera)
  static closestToOrigin(intersections) {
    let minVal = Infinity;
    let minIntrsct = new Intersection(null, null);
    intersections.forEach((intrsct) => {
      if (intrsct === undefined) { return undefined; }
      const pointDist = (intrsct.pos.x ** 2) + (intrsct.pos.y ** 2) + (intrsct.pos.z ** 2);
      if (pointDist < minVal) {
        minVal = pointDist;
        minIntrsct = intrsct;
      }
    });
    return minIntrsct;
  }
}

/*--------------------------------------------------------------*/
// LIGHT CLASSES
// Extends from: WorldObject
/*--------------------------------------------------------------*/

// Parent to all light classes
class Light extends WorldObject {
  // posVec : Vector3, color : RGBColor , intensity : number
  constructor(posVec, color, intensity) {
    super(posVec);
    this.color = color;
    this.intensity = intensity;
  }
  // Returns scalar used for per-pixel lighting
  lightPixel(scalar) {
    return scalar;
  }
}

// Lights all geometry with equal intensity
class AmbientLight extends Light {
  constructor(posVec, color, intensity) {
    super(posVec, color, intensity);
  }
  lightPixel(intersect, camRay, mode) {
    return super.lightPixel(this.intensity);
  }
}

// Directed light with no falloff, differs with modes
class DirectionalLight extends Light {
  constructor(posVec, color, intensity, dirVec) {
    super(posVec, color, intensity);
    this.dir = dirVec.normalize();
  }
  lightPixel(intersect, camRay, mode)
  {
    let { obj, pos } = intersect;
    // Calculate light intensity
    const objNormVec = obj.getNormalFromPoint(pos);
    const lightMag = objNormVec.dotProd(this.dir);
    if (lightMag <= 0) {
      return super.lightPixel(0);
    }
    // Calculate specular intensity
    let specMult = 0;
    if (mode === 'spec') {
      const unitCamRay = camRay.normalize();
      const incidVec = this.dir;
      const incidNormDot = incidVec.dotProd(objNormVec);
      const reflVec = incidVec.diff(objNormVec.multScalar(2 * incidNormDot))
      specMult = Math.max(0, reflVec.dotProd(unitCamRay));
    }
    // Return an intensity scalar combining lighting and specular
    return super.lightPixel((lightMag * this.intensity) + ((specMult ** 64) * this.intensity));
  }
}

/*--------------------------------------------------------------*/
// MATH CLASSES
// Contains the core math classes, objects, and functions
/*--------------------------------------------------------------*/

// Contains general algebra functions not found in Math()
class GenAlg {
  static mean(vals) {
    return (vals.reduce((sum, val) => sum + val, 0)) / (vals.length);
  }
  static findRoots(a, b, c) {
    const quad1 = ((-1 * b) + Math.sqrt((b ** 2) - (4 * a * c))) / (2 * a);
    const quad2 = ((-1 * b) - Math.sqrt((b ** 2) - (4 * a * c))) / (2 * a);
    return { quad1, quad2 };
  }
  static center(points) {
    const allX = point.map(val => val.x)
    const allY = point.map(val => val.y)
    const allZ = point.map(val => val.z)
    // Collect mins and maxes to calculate true center
    const minX = Math.min(allX);
    const maxX = Math.max(allX);
    const minY = Math.min(allY);
    const maxY = Math.max(allY);
    const minZ = Math.min(allZ);
    const maxZ = Math.max(allZ);
    // Average mins and maxes out to calculate true center
    return new Vector3([mean(minX, maxX), mean(minY, maxY), mean(minZ, maxZ)]);
  }

}

// Creation of three-value vectors and all math directly related
class Vector3 {
  constructor(val) {
    this.val = val;
    this.x = val[0];
    this.y = val[1];
    this.z = val[2];
  }
  mag() {
    return Math.sqrt(this.val.reduce((sum, val) => (sum + (val ** 2)), 0));
  }
  normalize() {
    return this.divScalar(this.mag());
  }
  sum(val2) {
    return new Vector3(this.val.map((val, idx) => val + val2.val[idx]));
  }
  diff(val2) {
    return new Vector3(this.val.map((val, idx) => val - val2.val[idx]));
  }
  dotProd(val2) {
    return this.val.reduce((sum, val, idx) => sum + (val * val2.val[idx]), 0);
  }
  crossProd(val2) {
    let xVal = (this.y * val2.z) - (this.z * val2.y);
    let yVal = (this.z * val2.x) - (this.x * val2.z);
    let zVal = (this.x * val2.y) - (this.y * val2.x); 
    return new Vector3([xVal, yVal, zVal]);
  }
  multScalar(scalar) {
    return new Vector3(this.val.map(val => val * scalar));
  }
  divScalar(scalar) {
    return new Vector3(this.val.map(val => val / scalar));
  }
}

// Creation of four-value vectors and all math directly related
class Vector4 {
	constructor(x,y,z,w) {
		this.val = [x,y,z,w];
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w
	}
	sum(val2) {
		return new Vector4(this.val.map((val, idx) => val + val2.val[idx]));
	}
	diff(val2) {
		return new Vector4(this.val.map((val, idx) => val - val2.val[idx]));
	}
	multScalar(scalar) {
    return new Vector4(this.val.map(val => val * scalar));
  }
  divScalar(scalar) {
    return new Vector4(this.val.map(val => val / scalar));
  }
  static createFromVector3(vector, isFinite) {
    return new Vector4(vector.x, vector.y, vector.z, isFinite ? 1 : 0)
	}
	convertToVector3() {
		return (new Vector3(this.x, this.y, this.z)).divScalar(0 ? 1 : this.w);
  }
}

// Creation of 4x4 Matrices and all math related
class Matrix4 {
	constructor(rawArray) {
		this.val = rawArray;
  }
	static createIdentity() {
		return new Matrix4(
			[1,0,0,0,
			 0,1,0,0,
			 0,0,1,0,
			 0,0,0,1]
		);
  }
  // Returns a 4 value array, each value being the row
	getRows() {
		return (
			[this.val.slice(0,4),
			 this.val.slice(4,8),
			 this.val.slice(8,12),
			 this.val.slice(12)]
		);
  }
  // Returns the product of two 4x4 matrices
	multiplyMatrix(mat2) {

  }
  // Returns undefined if inverse doesn't exist 
	getInverse() {

	}
}

// Creation of RGB 24-bit values and all math related
class RGBColor {
  // r,g,b are 8 bit values (0-255)
	constructor(r,g,b) {
		this.val = [r,g,b]
		this.r = r
		this.g = g
		this.b = b
  }
  // Directly outputs a hexadecimal string equivalent
	convertToHex() {
		let str = '#';
		this.val.forEach((val) => {
			const num = Math.round(val);
			let currHex = Number(num).toString(16);
			if (currHex.length < 2) {
				currHex = `0${currHex}`;
			}
			str += currHex;
		});
		return (str);
  }
  multScalar(scalar) {
    if (scalar < 0.5) {
      const newColor = this.val.map(val => Math.min(255, (val * (scalar * 2))))
      return new RGBColor(newColor[0], newColor[1], newColor[2]);
    } else {
      const rgbDiff = this.val.map(val => 255 - val);
      const newColor = this.val.map((val, idx) => Math.min(255, (val + ((scalar - 0.5) * 2 * rgbDiff[idx]))));
      return new RGBColor(newColor[0], newColor[1], newColor[2]);
    }
  }
}

/*--------------------------------------------------------------*/

// For tweaking values
// TODO - VERY messy code, should clean
function initRaytracer() {
  // Delete all previous objects
  worldObjects = [];
  lightObjects = [];
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Instantiate all objects
  const sph1elems = document.getElementById('sphere1').elements;
  let vec1 = new Vector3([Number(sph1elems[0].value), Number(sph1elems[1].value), Number(sph1elems[2].value)]);
  const sphere1 = new Sphere(vec1, Number(sph1elems[3].value), new RGBColor(Number(sph1elems[4].value),
    Number(sph1elems[5].value), Number(sph1elems[6].value)));
  const sph2elems = document.getElementById('sphere2').elements;
  let vec2 = new Vector3([Number(sph2elems[0].value), Number(sph2elems[1].value), Number(sph2elems[2].value)]);
  const sphere2 = new Sphere(vec2, Number(sph2elems[3].value), new RGBColor(Number(sph2elems[4].value),
    Number(sph2elems[5].value), Number(sph2elems[6].value)));
  const sph3elems = document.getElementById('sphere3').elements;
  let vec3 = new Vector3([Number(sph3elems[0].value), Number(sph3elems[1].value), Number(sph3elems[2].value)]);
  const sphere3 = new Sphere(vec3, Number(sph3elems[3].value), new RGBColor(Number(sph3elems[4].value),
    Number(sph3elems[5].value), Number(sph3elems[6].value)));
  
  const dirLight1Elems = document.getElementById('dirLight1').elements;
  const dirLight1Vec = new Vector3([Number(dirLight1Elems[1].value),
    Number(dirLight1Elems[2].value), Number(dirLight1Elems[3].value)]);
  
  const dirLight2Elems = document.getElementById('dirLight2').elements;
  const dirLight2Vec = new Vector3([Number(dirLight2Elems[1].value),
    Number(dirLight2Elems[2].value), Number(dirLight2Elems[3].value)]);
  
  const dirLight2 = new DirectionalLight(new Vector3([0, 0, 0]), new RGBColor(0, 0, 0),
    Number(dirLight2Elems[0].value), dirLight2Vec);
  const dirLight1 = new DirectionalLight(new Vector3([0, 0, 0]), new RGBColor(0, 0, 0),
    Number(dirLight1Elems[0].value), dirLight1Vec);

  const ambLightElems = document.getElementById('ambLight').elements;
  const ambLight = new AmbientLight(new Vector3([0, 0, 0]), new RGBColor(0, 0, 0), Number(ambLightElems[0].value));

  const modeSelect = document.getElementById('modeSelect');
  const mode = modeSelect.options[modeSelect.selectedIndex].value;
  worldObjects.push(sphere1, sphere2, sphere3);
  lightObjects.push(dirLight1, dirLight2, ambLight);
  console.log(mode);
  console.log(lightObjects);
  console.log(worldObjects);
  // Initialize raytracing process
  const rayTracer = new RayTracer(canvas.width, canvas.height, 30, 1000, 100000, mode, worldObjects, lightObjects);
  rayTracer.init();
}

initRaytracer();
