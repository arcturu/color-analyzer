uniform vec4 uParams;
uniform vec4 uCenters[512];

void main() {
  float s = vTexCoord.x;
  float v = vTexCoord.y;
  float hue = uParams.x;
  float alpha = 0.0;
  for (int i = 0; i < 512; i++) {
    vec2 d = uCenters[i].xy - vec2(s, v);
    alpha += exp(-(d.x * d.x + d.y * d.y) * 3000.0) * 0.1 * uCenters[i].z;
  }
  alpha = clamp(0.0, 1.0, alpha + 0.1);

  // WebGL expects premultiplied alpha by default.
  gl_FragColor = vec4(HSVtoRGB(vec3(hue, s, v)), 1.0) * alpha;
}
