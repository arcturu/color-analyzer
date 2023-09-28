void main() {
  float hue = vTexCoord.x;
  gl_FragColor = vec4(HSVtoRGB(vec3(hue, 1.0, 1.0)), 1.0);
}
