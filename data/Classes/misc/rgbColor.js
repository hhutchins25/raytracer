// rgb_color.js
// Contains class and functions for color, 
// including conversion and add/sub math
// Holden Hutchins 2018

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