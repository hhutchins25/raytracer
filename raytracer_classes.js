// Raytracer_Classes.js
// Contains all classes for Raytracer
// Holden Hutchins 2018

class WorldObject {
  constructor(pos) {
    this.pos = pos;
    this.pos.x = pos[0];
    this.pos.y = pos[1];
    this.pos.z = pos[2];
  }
}

class Shape extends WorldObject {
  constructor(posVec, color) {
    super(posVec);
    this.color = color;
  }
}

class Vector {
  constructor(val) {
    this.val = val;
  }
  mag() {
    return Math.sqrt(this.val.reduce((sum, val) => (sum + (val ** 2)), 0));
  }
  normalize() {
    const vecMag = this.mag()
    this.val = this.val.map(val => val / vecMag);
  }
  sum(val2) {
    return new Vector(this.val.map((val, idx) => val + val2[idx]));
  }
  diff(val2) {
    return new Vector(this.val.map((val, idx) => val - val2[idx]));
  }
  dotProd(val2) {
    return this.val.reduce((sum, val, idx) => sum + (val * val2[idx]), 0);
  }
  multScalar(scalar) {
    return this.val.map(val => val * -1);
  }
}

class Ray extends WorldObject {
  constructor(pos, dir) {
    this.pos = pos;
    this.dir = dir;
  }
}

// Functions for instatiating objects/intersections
class Intersection extends WorldObject {
  constructor(obj, pos) {
    this.obj = obj;
    this.pos = pos;
  }
}

class Sphere extends Shape {
  constructor(posVec, radius, color) {
    super(posVec, color);
    this.radius = radius;
  }

  rayCheck(ray) {
    // Collect a, b, and c for quadratic formula
    const a = ray.dir.dotProd(ray.dir);
    const b = 2 * ray.dir.dotProd(ray.pos);
    const c = ray.pos.dotProd(ray.pos); - (this.radius ** 2);
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
    };
  }
}

// Functions for creating lights
class Light extends WorldObject {
  constructor(pos, color, intensity) {
    super(pos);
    this.color = color;
    this.intensity = intensity;
  }
  lightPixel(objColor, scalar) {

  }
}

class AmbientLight extends Light {
  constructor(pos, color, intensity) {
    super(pos, color, intensity);
  }
  lightPixel(intersect) {
    super.lightPixel(intersect.obj.color, 1);
  }
}

class DirectionalLight extends Light {
  constructor(pos, color, intensity, dirVec) {
    super(pos, color, intensity);
    this.dir = dirVec;
  }
  lightPixel(intersect)
  {
    
  }
}

class RGBColor { 
  constructor(r,g,b) {
    this.val = [r,g,b]
    this.r = r
    this.g = g
    this.b = b
  }
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
}