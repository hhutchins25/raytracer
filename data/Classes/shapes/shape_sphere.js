// sphere.js
// Contains sphere class/functions/math
// Holden Hutchins 2019

class Sphere extends Shape {

  constructor(pos, radius) {
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

    if (quad1 > quad2) {
      if (quad1 > 0) return (new Intersection(this, point1));
    } else if (quad2 > quad1) {
      if (quad2 > 0) return (new Intersection(this, point2));
    }
  }

}