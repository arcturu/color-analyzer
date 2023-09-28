precision mediump float;
varying vec2 vTexCoord;

vec3 HSVtoRGB(vec3 hsv) {
  vec3 rgb = vec3(hsv.z);

  if (hsv.y > 0.0) {
    float h = hsv.x * 6.0;
    int i = int(h);
    float f = h - float(i);
    float p = hsv.z * (1.0 - hsv.y);
    float q = hsv.z * (1.0 - (hsv.y * f));
    float t = hsv.z * (1.0 - (hsv.y * (1.0 - f)));

    if (i == 0) {
      rgb = vec3(hsv.z, t, p);
    } else if (i == 1) {
      rgb = vec3(q, hsv.z, p);
    } else if (i == 2) {
      rgb = vec3(p, hsv.z, t);
    } else if (i == 3) {
      rgb = vec3(p, q, hsv.z);
    } else if (i == 4) {
      rgb = vec3(t, p, hsv.z);
    } else {
      rgb = vec3(hsv.z, p, q);
    }
  }

  return rgb;
}

float CalcHueDegreeFromProcreateBarPosition(float deg) {
  if (0.0 <= deg && deg < 120.0) {
    return mix(0.0, 60.0, deg / 120.0);
  } else if (120.0 <= deg && deg < 210.0) {
    return mix(60.0, 180.0, (deg - 120.0) / 90.0);
  } else if (210.0 <= deg && deg < 330.0) {
    return mix(180.0, 300.0, (deg - 210.0) / 120.0);
  } else {
    return mix(300.0, 360.0, (deg - 330.0) / 30.0);
  }
}

// maps procreate bar position [0, 1] to hue [0, 1]
float CalcHueFromProcreateBarPosition(float hue) {
  return CalcHueDegreeFromProcreateBarPosition(hue * 360.0) / 360.0;
}

float CalcProcreateBarPositionFromHueDegree(float pdeg) {
  if (0.0 <= pdeg && pdeg < 60.0) {
    return mix(0.0, 120.0, pdeg / 60.0);
  } else if (60.0 <= pdeg && pdeg < 180.0) {
    return mix(120.0, 210.0, (pdeg - 60.0) / 120.0);
  } else if (180.0 < pdeg && pdeg < 300.0) {
    return mix(210.0, 330.0, (pdeg - 180.0) / 120.0);
  } else {
    return mix(330.0, 360.0, (pdeg - 330.0) / 60.0);
  }
}

// maps hue [0, 1] to procreate bar position [0, 1]
float CalcProcreateBarPositionFromHue(float hue) {
  return CalcProcreateBarPositionFromHueDegree(hue * 360.0) / 360.0;
}

vec2 GetProcreateHueBarSV(float hue) {
  const vec2 sv0 = vec2(1.0, 1.0);
  const vec2 sv50 = vec2(1.0, 1.0);
  const vec2 sv60 = vec2(1.0, 0.87);
  const vec2 sv100 = vec2(1.0, 1.0);
  const vec2 sv120 = vec2(0.8, 1.0);
  const vec2 sv175 = vec2(1.0, 1.0);
  const vec2 sv180 = vec2(1.0, 0.93);
  const vec2 sv230 = vec2(1.0, 1.0);
  const vec2 sv240 = vec2(0.9, 1.0);
  const vec2 sv280 = vec2(1.0, 1.0);
  const vec2 sv300 = vec2(1.0, 0.75);
  const vec2 sv360 = vec2(1.0, 1.0);
  float deg = hue * 360.0;
  if (0.0 <= deg && deg < 50.0) {
    return sv50;
  } else if (50.0 <= deg && deg < 60.0) {
    return mix(sv50, sv60, (deg - 50.0) / 10.0);
  } else if (60.0 <= deg && deg < 100.0) {
    return mix(sv60, sv100, (deg - 60.0) / 40.0);
  } else if (100.0 <= deg && deg < 120.0) {
    return mix(sv100, sv120, (deg - 100.0) / 20.0);
  } else if (120.0 <= deg && deg < 175.0) {
    return mix(sv120, sv175, (deg - 120.0) / 55.0);
  } else if (175.0 <= deg && deg < 180.0) {
    return mix(sv175, sv180, (deg - 175.0) / 5.0);
  } else if (180.0 <= deg && deg < 230.0) {
    return mix(sv180, sv230, (deg - 180.0) / 50.0);
  } else if (230.0 <= deg && deg < 240.0) {
    return mix(sv230, sv240, (deg - 230.0) / 10.0);
  } else if (240.0 <= deg && deg < 280.0) {
    return mix(sv240, sv280, (deg - 240.0) / 40.0);
  } else if (280.0 <= deg && deg < 300.0) {
    return mix(sv280, sv300, (deg - 280.0) / 20.0);
  } else if (300.0 <= deg && deg < 360.0) {
    return mix(sv300, sv360, (deg - 300.0) / 60.0);
  }
  return sv0;
}