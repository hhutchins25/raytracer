// Raytracer_Classes.js
// Contains all classes for Raytracer
// Holden Hutchins 2018

class WorldObject {
  constructor(pos) {
    this.pos = pos;
  }
}

class Shape extends WorldObject {
  constructor(pos, color) {
    super(pos);
    this.color = color;
  }
}

class Vector {
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
    const vecMag = this.mag()
    this.val = this.val.map(val => val / vecMag);
  }
  sum(val2) {
    return new Vector(this.val.map((val, idx) => val + val2.val[idx]));
  }
  diff(val2) {
    return new Vector(this.val.map((val, idx) => val - val2.val[idx]));
  }
  dotProd(val2) {
    return this.val.reduce((sum, val, idx) => sum + (val * val2.val[idx]), 0);
  }
  multScalar(scalar) {
    return new Vector(this.val.map(val => val * scalar));
  }
}

class Ray extends WorldObject {
  constructor(pos, dir) {
    super(pos);
    this.dir = dir;
  }
}

// Functions for instatiating objects/intersections
class Intersection extends WorldObject {
  constructor(obj, pos) {
    super(pos);
    this.obj = obj;
  }
}

class Sphere extends Shape {
  constructor(pos, radius, color) {
    super(pos, color);
    this.radius = radius;
  }

  rayCheck(ray) {
    // Collect a, b, and c for quadratic formula
    const a = ray.dir.dotProd(ray.dir);
    const b = 2 * ray.dir.dotProd(ray.pos);
    const c = ray.pos.dotProd(ray.pos) - (this.radius ** 2);
    // Collect both possible solutions for sphere intersection
    const quad1 = ((-1 * b) + Math.sqrt((b ** 2) - (4 * a * c))) / (2 * a);
    const quad2 = ((-1 * b) - Math.sqrt((b ** 2) - (4 * a * c))) / (2 * a);
    console.log(quad1);
    console.log(quad2);
    // Collect resulting intersection positions
    const point1 = this.pos.sum(ray.pos.sum(ray.dir.multScalar(quad1)))
    const point2 = this.pos.sum(ray.pos.sum(ray.dir.multScalar(quad2)))
    console.log(point1);
    console.log(point2);
    if (quad1 > quad2) {
      if (quad1 > 0) return (new Intersection(this, point1));
    } else if (quad2 > quad1) {
      if (quad2 > 0) return (new Intersection(this, point2));
    }
  }
}

// Functions for creating lights
class Light extends WorldObject {
  constructor(posVec, color, intensity) {
    super(posVec);
    this.color = color;
    this.intensity = intensity;
  }
  lightPixel(scalar) {
    return { scalar };
  }
}

class AmbientLight extends Light {
  constructor(posVec, color, intensity) {
    super(posVec, color, intensity);
  }
  lightPixel(intersect) {
    return super.lightPixel(intensity);
  }
}

class DirectionalLight extends Light {
  constructor(posVec, color, intensity, dirVec) {
    super(posVec, color, intensity);
    this.dir = dirVec;
  }
  lightPixel(intersect, camRay)
  {
    let { obj, hitPos } = intersect;
    // Calculate light intensity
    const objNormVec = hitPos.diff(obj.pos).normalize();
    const unitCamRay = camRay.normalize();
    const lightMag = objNormVec.dotProd(this.dir);
    if (lightMag < 0) {
      return 0;
    }
    // Calculate specular intensity
    let specMult = 0;
    if (mode === 'spec') {
      const incidVec = this.dir.multScalar(-1);
      const incidNormDot = incidVec.dotProd(objNormVec);
      reflVec = incidVec.diff(objNormVec.mulScalar(2 * incidNormDot))
      specMult = Math.max(0, reflVec.dotProd(unitCamRay));
    }
    // Return an intensity scalar combining lighting and specular
    return super.lightPixel((lightMag * intensity) + ((specMult ** 32) * intensity));
  }
}