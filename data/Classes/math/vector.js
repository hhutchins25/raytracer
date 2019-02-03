// vector.js
// Contains the class/functions/math for vector values
// Holden Hutchins 2019

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