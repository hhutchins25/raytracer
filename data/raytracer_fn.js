

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
      let intersections = 
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
  rayTracer(canvas.width, canvas.height, 30, 1000, 100000, mode, worldObject, lightObjects);
}

initRaytracer();
