// Track created objects with global variable
let worldObjects = [];
let lightObjects = [];
const canvas = document.getElementById('raytracerCanvas');
const ctx = canvas.getContext('2d');

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
}

// Functions for creating lights
function Light(posVec, color, intensity) {
  WorldObject.call(this, posVec, color);
  this.intensity = intensity;
}

function AmbientLight(posVec, color, intensity) {
  Light.call(this, posVec, color, intensity);
}

function DirectionalLight(posVec, color, intensity, dirVec) {
  Light.call(this, posVec, color, intensity);
  this.dirVec = dirVec;
}

// Basic vector math
function dotProd(vec1, vec2) {
  return vec1.reduce((sum, val, idx) => sum + (val * vec2[idx]), 0);
}

function normalVec(vec) {
  const vecMag = Math.sqrt(vec.reduce((sum, val) => (sum + (val ** 2)), 0));
  return vec.map(val => val / vecMag);
}

// Convert RGB values to hex for HTML usage
function rgb2hex(rgb) {
  let str = '#';
  rgb.forEach((val) => {
    const num = Math.round(val);
    let currHex = Number(num).toString(16);
    if (currHex.length < 2) {
      currHex = `0${currHex}`;
    }
    str += currHex;
  });
  return (str);
}

// Determines light intensity per pixel
function lightPixel(lightDir, intensity, obj, intrsctPos, camRay, mode) {
  // Calculate light intensity
  const objPos = [obj.x, obj.y, obj.z];
  const objNormVec = intrsctPos.map((val, idx) => (val - objPos[idx]) / obj.radius);
  const unitCamRay = normalVec(camRay);
  const lightMag = dotProd(objNormVec, lightDir);
  // Calculate specular intensity
  let specMult = 0;
  if (mode === 'spec') {
    const incidVec = lightDir.map(val => val * -1);
    const incidNormDot = dotProd(incidVec, objNormVec);
    const reflVec = [0, 0, 0];
    incidVec.forEach((val, idx) => {
      reflVec[idx] = val - (2 * objNormVec[idx] * incidNormDot);
    });
    specMult = Math.max(0, dotProd(reflVec, unitCamRay));
  }
  // Return an intensity scalar combining lighting and specular
  if (lightMag < 0) {
    return 0;
  }
  return ((lightMag * intensity) + ((specMult ** 32) * intensity));
}

// Determines how a pixel should be colored based
// on the informations gathered and given
function drawPixel(pos, mode, obj, intrsctPos, camRay) {
  let color;
  if (obj === null || intrsctPos === null) {
    color = '#000000';
  } else if (mode === 'bool') {
    color = '#FFFFFF';
  } else if (mode === 'color') {
    color = rgb2hex(obj.color);
  } else if (mode === 'lighting' || mode === 'spec') {
    let mult = 0;
    lightObjects.forEach((light) => {
      if (light instanceof DirectionalLight) {
        mult += lightPixel(light.dirVec, light.intensity, obj, intrsctPos, camRay, mode);
      } else {
        mult += light.intensity;
      }
    });
    color = rgb2hex(obj.color.map(val => Math.min(255, (val * mult))));
  }
  ctx.fillStyle = color;
  ctx.fillRect(pos[0], pos[1], 1, 1);
}

// Main function, initiates all functions
function rayTracer(width, height, fov, near, far, mode) {
  console.log('start raytracer...');
  // Establish the FOV for horizonal and vertical view
  // TODO - compensate for condensing around FOV border
  const vfov = (height / width) * fov;
  const fovInc = fov / width;
  const vfovInc = vfov / height;
  const xPos = [];
  const yPos = [];
  // Per-pixel pos/vector horizontally
  for (let i = 1; i <= width; i += 1) {
    const currFov = (fovInc * i) - (fov / 2);
    const htan = Math.tan(currFov * (Math.PI / 180));
    xPos.push(htan * near);
    // Per-pixel pos/vector vertically
  } for (let i = 1; i <= height; i += 1) {
    const currVFov = (vfovInc * i) - (vfov / 2);
    const vtan = Math.tan(currVFov * (Math.PI / 180));
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
      const result = rayCheck([x, y, near]);
      drawPixel([incX, incY], mode, result.obj, result.pos, [x, y, near]);
    });
  });
  console.log('finish raytracer!');
}

// Loop through all intersections and return the
// closest to the camera
function closestToOrigin(intersections) {
  let minVal = Infinity;
  let minIntrsct = new Intersection(null, null);
  intersections.forEach((intrsct) => {
    const pointDist = (intrsct.obj.x ** 2) + (intrsct.obj.y ** 2) + (intrsct.obj.z ** 2);
    if (pointDist < minVal) {
      minVal = pointDist;
      minIntrsct = intrsct;
    }
  });
  return minIntrsct;
}

// Used for per-pixel intersection checks
function rayCheck(dirVec) {
  const allIntrscts = [];
  worldObjects.forEach((obj) => {
    // Combine obj axes for easier mapping
    const objPos = [obj.x, obj.y, obj.z];
    // Adjust rayPos to simulate the sphere being placed at [0,0,0]
    const rayPos = dirVec.map((val, idx) => val - objPos[idx]);
    // Collect a, b, and c for quadratic formula
    // a = dirVec • dirVec
    // b = 2 * (dirVec • rayPos)
    // c = rayPos • dirVec - obj.radius(squared)
    const a = dotProd(dirVec, dirVec);
    const b = 2 * dotProd(dirVec, rayPos);
    const c = dotProd(rayPos, rayPos) - (obj.radius ** 2);
    // Collect both possible solutions for sphere intersection
    const quad1 = ((-1 * b) + Math.sqrt((b ** 2) - (4 * a * c))) / (2 * a);
    const quad2 = ((-1 * b) - Math.sqrt((b ** 2) - (4 * a * c))) / (2 * a);
    // Collect resulting intersection positions
    const point1 = rayPos.map((val, idx) => val + (quad1 * dirVec[idx]) + objPos[idx]);
    const point2 = rayPos.map((val, idx) => val + (quad2 * dirVec[idx]) + objPos[idx]);
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
  let vec = [Number(sph1elems[0].value), Number(sph1elems[1].value), Number(sph1elems[2].value)];
  const sphere1 = new Sphere(vec, Number(sph1elems[3].value), [Number(sph1elems[4].value),
    Number(sph1elems[5].value), Number(sph1elems[6].value)]);
  const sph2elems = document.getElementById('sphere2').elements;
  vec = [Number(sph2elems[0].value), Number(sph2elems[1].value), Number(sph2elems[2].value)];
  const sphere2 = new Sphere(vec, Number(sph2elems[3].value), [Number(sph2elems[4].value),
    Number(sph2elems[5].value), Number(sph2elems[6].value)]);
  const sph3elems = document.getElementById('sphere3').elements;
  vec = [Number(sph3elems[0].value), Number(sph3elems[1].value), Number(sph3elems[2].value)];
  const sphere3 = new Sphere(vec, Number(sph3elems[3].value), [Number(sph3elems[4].value),
    Number(sph3elems[5].value), Number(sph3elems[6].value)]);
  const dirLight1Elems = document.getElementById('dirLight1').elements;
  const dirLight1Vec = normalVec([Number(dirLight1Elems[1].value),
    Number(dirLight1Elems[2].value), Number(dirLight1Elems[3].value)]);
  const dirLight1 = new DirectionalLight([0, 0, 0], [0, 0, 0],
    Number(dirLight1Elems[0].value), dirLight1Vec);
  const dirLight2Elems = document.getElementById('dirLight2').elements;
  const dirLight2Vec = normalVec([Number(dirLight2Elems[1].value),
    Number(dirLight2Elems[2].value), Number(dirLight2Elems[3].value)]);
  const dirLight2 = new DirectionalLight([0, 0, 0], [0, 0, 0],
    Number(dirLight2Elems[0].value), dirLight2Vec);
  const ambLightElems = document.getElementById('ambLight').elements;
  const ambLight = new AmbientLight([0, 0, 0], [0, 0, 0], Number(ambLightElems[0].value));
  const modeSelect = document.getElementById('modeSelect');
  const mode = modeSelect.options[modeSelect.selectedIndex].value;
  worldObjects.push(sphere1, sphere2, sphere3);
  lightObjects.push(dirLight1, dirLight2, ambLight);
  console.log(mode);
  // Initialize raytracing process
  rayTracer(canvas.width, canvas.height, 30, 1000, 100000, mode);
}

initRaytracer();
