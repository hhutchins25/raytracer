// Lights.js
// Contains all light classes and functions
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
      specMult =Math.max(0, reflVec.dotProd(unitCamRay));
    }

    // Return an intensity scalar combining lighting and specular
    return super.lightPixel((lightMag * intensity) + ((specMult ** 32) * intensity));
  }

}