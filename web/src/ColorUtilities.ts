export const RGBtoHSV = (rgb: number[]): number[] => {
  const [r, g, b] = rgb;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  let v = max;

  const d = max - min;

  if (max !== 0) {
    s = d / max;

    if (max === min) {
      h = 0; // achromatic (gray)
    } else {
      if (max === r) {
        h = (g - b) / d + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else if (max === b) {
        h = (r - g) / d + 4;
      }

      h /= 6;
    }
  }

  return [h, s, v];
};

export const HSVtoRGB = (hsv: number[]): number[] => {
  const [h, s, v] = hsv;
  let rgb = [v, v, v];

  if (s > 0.0) {
    const h2 = h * 6.0;
    const i = Math.floor(h2);
    const f = h2 - i;
    const p = v * (1.0 - s);
    const q = v * (1.0 - s * f);
    const t = v * (1.0 - s * (1.0 - f));

    if (i == 0) {
      rgb = [v, t, p];
    } else if (i == 1) {
      rgb = [q, v, p];
    } else if (i == 2) {
      rgb = [p, v, t];
    } else if (i == 3) {
      rgb = [p, q, v];
    } else if (i == 4) {
      rgb = [t, p, v];
    } else {
      rgb = [v, p, q];
    }
  }

  return rgb;
};

export const HSVtoRGB256 = (hsv: number[]): number[] => {
  const rgb = HSVtoRGB(hsv);
  return [rgb[0] * 255, rgb[1] * 255, rgb[2] * 255];
};

export const mix = (x: number, y: number, r: number) => {
  return (1 - r) * x + r * y;
};

const CalcHueDegreeFromProcreateBarPosition = (deg: number) => {
  if (0.0 <= deg && deg < 120.0) {
    return mix(0.0, 60.0, deg / 120.0);
  } else if (120.0 <= deg && deg < 210.0) {
    return mix(60.0, 180.0, (deg - 120.0) / 90.0);
  } else if (210.0 <= deg && deg < 330.0) {
    return mix(180.0, 300.0, (deg - 210.0) / 120.0);
  } else {
    return mix(300.0, 360.0, (deg - 330.0) / 30.0);
  }
};

// maps procreate bar position [0, 1] to hue [0, 1]
export const CalcHueFromProcreateBarPosition = (barpos: number) => {
  return CalcHueDegreeFromProcreateBarPosition(barpos * 360.0) / 360.0;
};

const CalcProcreateBarPositionFromHueDegree = (pdeg: number) => {
  if (0.0 <= pdeg && pdeg < 60.0) {
    return mix(0.0, 120.0, pdeg / 60.0);
  } else if (60.0 <= pdeg && pdeg < 180.0) {
    return mix(120.0, 210.0, (pdeg - 60.0) / 120.0);
  } else if (180.0 <= pdeg && pdeg < 300.0) {
    return mix(210.0, 330.0, (pdeg - 180.0) / 120.0);
  } else {
    return mix(330.0, 360.0, (pdeg - 300.0) / 60.0);
  }
};

// maps hue [0, 1] to procreate bar position [0, 1]
export const CalcProcreateBarPositionFromHue = (hue: number) => {
  return CalcProcreateBarPositionFromHueDegree(hue * 360.0) / 360.0;
};
