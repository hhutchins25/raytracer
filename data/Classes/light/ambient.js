// ambient.js
// Contains ambient light class/functions/math
// Holden Hutchins 2018

class AmbientLight extends Light {

  constructor(posVec, color, intensity) {
    super(posVec, color, intensity);
  }

  lightPixel(intersect) {
    return super.lightPixel(intensity);
  }

}