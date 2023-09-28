import { mat4 } from 'gl-matrix';
import shaderHeaderFrag from './shader/header.fs?raw';
import shaderHeaderVert from './shader/header.vs?raw';
import shaderMainVert from './shader/main.vs?raw';

function glCreateShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function glCreateProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
  const program = gl.createProgram();
  if (!program) {
    return null;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function glBindVertexAttribute(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer | null,
  location: number,
  size: number,
  stride: number,
  offset: number
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
}

export interface IUniformEntry {
  getName(): string;
  pushToContext(gl: WebGLRenderingContext, loc: WebGLUniformLocation): void;
}

export class Vec4UniformEntry implements IUniformEntry {
  private name: string;
  private value: number[];
  public constructor(name: string, value: number[]) {
    this.name = name;
    this.value = value;
  }
  public getName(): string {
    return this.name;
  }
  public pushToContext(gl: WebGLRenderingContext, loc: WebGLUniformLocation) {
    gl.uniform4fv(loc, this.value);
  }
}

export class Vec2ArrayUniformEntry implements IUniformEntry {
  private name: string;
  private value: number[];
  public constructor(name: string, value: number[]) {
    this.name = name;
    this.value = value;
  }
  public getName(): string {
    return this.name;
  }
  public pushToContext(gl: WebGLRenderingContext, loc: WebGLUniformLocation) {
    gl.uniform2fv(loc, this.value);
  }
}

export class Material {
  private program: WebGLProgram | null = null;
  private uniforms: IUniformEntry[] = [];
  public positionAttributeLocation: number = -1;
  public texCoordAttributeLocation: number = -1;

  private fragmentShaderSource = `
    void main() {
      gl_FragColor = vec4(vTexCoord.x, vTexCoord.y, 0.0, 1.0);
    }
    `;

  public initialize(
    gl: WebGLRenderingContext,
    vertShader: string | null = null,
    fragShader: string | null = null
  ) {
    const vertexShader = glCreateShader(
      gl,
      gl.VERTEX_SHADER,
      shaderHeaderVert + (vertShader ?? shaderMainVert)
    );
    const fragmentShader = glCreateShader(
      gl,
      gl.FRAGMENT_SHADER,
      shaderHeaderFrag + (fragShader ?? this.fragmentShaderSource)
    );
    if (!vertexShader || !fragmentShader) {
      console.log('Failed to create shader.');
      return;
    }
    this.program = glCreateProgram(gl, vertexShader, fragmentShader);
    if (!this.program) {
      console.log('Failed to create program.');
      return;
    }
    this.positionAttributeLocation = gl.getAttribLocation(
      this.program,
      'aVertexPosition'
    );
    this.texCoordAttributeLocation = gl.getAttribLocation(
      this.program,
      'aTexCoord'
    );
  }

  public pushToContext(gl: WebGLRenderingContext) {
    gl.useProgram(this.program);
    this.uniforms.forEach((u) => {
      // TODO: cache location
      const loc = this.findUniformLocation(gl, u.getName());
      if (!loc) {
        return;
      }
      u.pushToContext(gl, loc);
    });
  }

  public findUniformLocation(
    gl: WebGLRenderingContext,
    name: string
  ): WebGLUniformLocation | null {
    if (!this.program) {
      console.log('program is null.');
      return null;
    }
    return gl.getUniformLocation(this.program, name);
  }

  public addUniform(uniform: IUniformEntry) {
    this.uniforms.push(uniform);
  }

  public clearUniforms() {
    this.uniforms = [];
  }
}

export class Geometry {
  public positions: number[] = [];
  public texCoords: number[] = [];
  public indices: number[] = [];
}

export class Model {
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private geometry: Geometry;
  private material: Material;
  private modelMatrix: mat4 = mat4.create();
  private modelMatrixLocation: WebGLUniformLocation | null = null;

  constructor(
    gl: WebGLRenderingContext,
    geometry: Geometry,
    material: Material
  ) {
    this.geometry = geometry;
    this.material = material;
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(geometry.positions),
      gl.STATIC_DRAW
    );
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(geometry.texCoords),
      gl.STATIC_DRAW
    );
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(geometry.indices),
      gl.STATIC_DRAW
    );
    this.modelMatrixLocation = material.findUniformLocation(gl, 'uModelMatrix');
  }

  public setModelMatrix(mat: mat4) {
    this.modelMatrix = mat;
  }

  public getModelMatrix(): mat4 {
    return this.modelMatrix;
  }

  public render(gl: WebGLRenderingContext, camera: Camera) {
    // material must be pushed to the context before camera
    this.material.pushToContext(gl);
    camera.pushToContext(gl, this.material);
    const pl = this.material.positionAttributeLocation;
    glBindVertexAttribute(gl, this.positionBuffer, pl, 3, 0, 0);
    const tl = this.material.texCoordAttributeLocation;
    glBindVertexAttribute(gl, this.texCoordBuffer, tl, 2, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.uniformMatrix4fv(this.modelMatrixLocation, false, this.modelMatrix);
    gl.drawElements(
      gl.TRIANGLES,
      this.geometry.indices.length,
      gl.UNSIGNED_SHORT,
      0
    );
  }
}

export class ModelHandle {
  private value: number;
  constructor(value: number) {
    this.value = value;
  }
  public getValue(): number {
    return this.value;
  }
}

export class Camera {
  public projectionMatrix: mat4 = mat4.create();
  public viewMatrix: mat4 = mat4.create();
  private viewMatrixLocation: WebGLUniformLocation | null = null;
  private projectionMatrixLocation: WebGLUniformLocation | null = null;

  public pushToContext(gl: WebGLRenderingContext, material: Material) {
    // TODO: cache location
    this.viewMatrixLocation = material.findUniformLocation(gl, 'uViewMatrix');
    this.projectionMatrixLocation = material.findUniformLocation(
      gl,
      'uProjectionMatrix'
    );

    gl.uniformMatrix4fv(this.viewMatrixLocation, false, this.viewMatrix);
    gl.uniformMatrix4fv(
      this.projectionMatrixLocation,
      false,
      this.projectionMatrix
    );
  }
}

export class Scene {
  private gl: WebGLRenderingContext;
  private camera: Camera | null = null;
  private models: Model[] = [];

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  public setCamera(camera: Camera) {
    this.camera = camera;
  }

  public addModel(model: Model): ModelHandle {
    this.models.push(model);
    return new ModelHandle(this.models.length - 1);
  }

  public removeModel(handle: ModelHandle): boolean {
    return !!this.models.splice(handle.getValue());
  }

  public render() {
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < this.models.length; i++) {
      if (!this.camera) {
        console.log('Camera has not been set to the scene.');
        continue;
      }
      this.models[i].render(this.gl, this.camera);
    }
  }
}
