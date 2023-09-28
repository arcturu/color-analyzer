void main() {
  gl_Position =
      uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
  vTexCoord = aTexCoord;
}
