// light.js
// Contains base light class, parent of all light classes
// All light functions extend from here
// Holden Hutchins 2018

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