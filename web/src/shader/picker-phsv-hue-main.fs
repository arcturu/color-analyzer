uniform vec4 uCenters[100];

void main() {
  float hue = vTexCoord.x;
  float phue = CalcHueFromProcreateBarPosition(hue);
  float alpha = 0.0;
  for (int i = 0; i < 100; i++) {
    float d = uCenters[i].x - phue;
    alpha += exp(-d * d * 3000.0) * 0.1 * uCenters[i].y;
  }
  alpha = clamp(0.0, 1.0, alpha + 0.1);

  // WebGL expects premultiplied alpha by default.
  gl_FragColor =
      vec4(HSVtoRGB(vec3(phue, GetProcreateHueBarSV(phue))), 1.0) * alpha;
}
