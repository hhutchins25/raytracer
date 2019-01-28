// ray.js
// Contains class/functions/math for 3D rays
// Holden Hutchins 2018

class Ray extends WorldObject {

  constructor(pos, dir) {
    super(pos);
    this.dir = dir;
  }

}