import { useState, useRef, useEffect, PointerEvent } from 'react';
import {
  Camera,
  Scene,
  Geometry,
  Material,
  Model,
  Vec4UniformEntry,
} from '../Scene';
import shaderPickerHsvSvMainFrag from '../shader/picker-hsv-sv-main.fs?raw';
import shaderPickerPhsvHueMainFrag from '../shader/picker-phsv-hue-main.fs?raw';
import {
  HSVtoRGB256,
  CalcProcreateBarPositionFromHue,
  CalcHueFromProcreateBarPosition,
  RGBtoHSV,
} from '../ColorUtilities';

const squareGeometry = new Geometry();
squareGeometry.positions = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
squareGeometry.texCoords = [0, 0, 1, 0, 1, 1, 0, 1];
squareGeometry.indices = [0, 1, 2, 0, 2, 3];

interface HsvRect2Props {
  histogram: Map<number, [number, number, number][]>;
  currentRgb: number[] | null;
}

export default function HsvRect2({ histogram, currentRgb }: HsvRect2Props) {
  const svCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [svScene, setSvScene] = useState<Scene | null>(null);
  const [hueScene, setHueScene] = useState<Scene | null>(null);
  const [svMaterial, setSvMaterial] = useState<Material | null>(null);
  const [hueMaterial, setHueMaterial] = useState<Material | null>(null);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [currentHsv, setCurrentHsv] = useState<number[]>([0, 1, 1]);

  const [currentHue, currentSaturation, currentValue] = currentHsv;

  const width = 200;
  const hueHeight = 10;

  const parentHsv = !!currentRgb ? RGBtoHSV(currentRgb) : null;
  useEffect(() => {
    if (!!currentRgb) {
      setCurrentHsv(RGBtoHSV(currentRgb));
    }
  }, [currentRgb]);

  useEffect(() => {
    const gl = svCanvasRef.current?.getContext('webgl', { alpha: true });
    if (!gl) {
      console.log('WebGL not supported.');
      return;
    }
    gl.enable(gl.BLEND); // for transparent background
    gl.enable(gl.DEPTH_TEST);
    const scene = new Scene(gl);
    const camera = new Camera();
    scene.setCamera(camera);

    const svMaterial = new Material();
    svMaterial.initialize(gl, null, shaderPickerHsvSvMainFrag);
    setSvMaterial(svMaterial);
    const svRect = new Model(gl, squareGeometry, svMaterial);
    scene.addModel(svRect);

    scene.render();
    setSvScene(scene);
    console.log('svCanvas initialized.');
  }, [svCanvasRef]);

  useEffect(() => {
    const gl = hueCanvasRef.current?.getContext('webgl', { alpha: true });
    if (!gl) {
      console.log('WebGL not supported.');
      return;
    }
    gl.enable(gl.BLEND); // for transparent background
    gl.enable(gl.DEPTH_TEST);
    const scene = new Scene(gl);
    const camera = new Camera();
    scene.setCamera(camera);

    const hueMaterial = new Material();
    hueMaterial.initialize(gl, null, shaderPickerPhsvHueMainFrag);
    setHueMaterial(hueMaterial);
    const hueRect = new Model(gl, squareGeometry, hueMaterial);
    scene.addModel(hueRect);

    scene.render();
    setHueScene(scene);
    console.log('hueCanvas initialized.');
  }, [hueCanvasRef]);

  if (!!svMaterial && !!hueMaterial && !!svScene && !!hueScene) {
    // initialized
    let totalCount = 0;
    for (let i = 0; i < 100; i++) {
      const svs = histogram.get(i) ?? [];
      totalCount += svs.reduce((acc, sv) => acc + sv[2], 0);
    }

    let svCenters = [];
    const hueIndex = Math.floor(currentHue * 100);
    let svs = histogram.get(hueIndex) ?? [];
    for (let i = 0; i < 512; i++) {
      if (i < svs.length) {
        svCenters.push(svs[i][0]);
        svCenters.push(svs[i][1]);
        svCenters.push((svs[i][2] / totalCount) * 10000);
        svCenters.push(0);
      } else {
        svCenters.push(-1);
        svCenters.push(-1);
        svCenters.push(0);
        svCenters.push(0);
      }
    }

    // TODO: Clearing the uniforms every time may lead to poor performance.
    svMaterial.clearUniforms();
    svMaterial.addUniform(
      new Vec4UniformEntry('uParams', [currentHue, 0, 0, 0])
    );
    svMaterial.addUniform(new Vec4UniformEntry('uCenters', svCenters));
    svScene?.render();

    let hueCenters = [];
    for (let i = 0; i < 100; i++) {
      let svs = histogram.get(i) ?? [];
      hueCenters.push(i / 100.0);
      hueCenters.push(
        (svs.map((sv) => sv[2]).reduce((acc, x) => acc + x, 0) / totalCount) *
          100
      );
      hueCenters.push(0);
      hueCenters.push(0);
    }

    // TODO: Clearing the uniforms every time may lead to poor performance.
    hueMaterial.clearUniforms();
    hueMaterial.addUniform(new Vec4UniformEntry('uCenters', hueCenters));
    hueScene?.render();
  }

  const clamp = (min: number, max: number, value: number) => {
    return Math.min(Math.max(min, value), max);
  };

  const handleHuePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!e.buttons || !isDraggingHue) {
      return;
    }
    const x = e.nativeEvent.offsetX;
    let hue = CalcHueFromProcreateBarPosition(clamp(0, 1, x / width));

    // snap to parent hue
    if (!!parentHsv && Math.abs(parentHsv[0] - hue) < 0.01) {
      hue = parentHsv[0];
    }

    setCurrentHsv([hue, currentSaturation, currentValue]);
  };
  const handleHuePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    hueCanvasRef?.current?.setPointerCapture(e.pointerId);
    setIsDraggingHue(true);
  };
  const handleHuePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    hueCanvasRef?.current?.releasePointerCapture(e.pointerId);
    setIsDraggingHue(false);
  };
  const handleHueThumbPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    hueCanvasRef?.current?.setPointerCapture(e.pointerId);
    setIsDraggingHue(true);
  };
  const handleHueThumbPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    hueCanvasRef?.current?.releasePointerCapture(e.pointerId);
    setIsDraggingHue(false);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={svCanvasRef}
          width={width}
          height={width}
          style={{ margin: '10px', userSelect: 'none' }}
          onTouchStart={(e) => e.preventDefault()}
        />
        {!!parentHsv && parentHsv[0] == currentHsv[0] && (
          <div
            style={{
              position: 'absolute',
              top: 10 + Math.floor((1 - currentValue) * width),
              left: 10,
              width: width,
              height: '1px',
              backgroundColor: '#a0a0a0',
            }}
          />
        )}
        {!!parentHsv && parentHsv[0] == currentHsv[0] && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10 + Math.floor(currentSaturation * width),
              width: '1px',
              height: width,
              backgroundColor: '#a0a0a0',
            }}
          />
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={hueCanvasRef}
          width={width}
          height={hueHeight}
          style={{
            margin: '0px 10px 10px 10px',
            position: 'absolute',
            top: 0,
            left: 0,
            touchAction: 'none',
            userSelect: 'none',
          }}
          onTouchStart={(e) => e.preventDefault()}
          onPointerMove={handleHuePointerMove}
          onPointerDown={handleHuePointerDown}
          onPointerUp={handleHuePointerUp}
        />
        <div
          onTouchStart={(e) => e.preventDefault()}
          onPointerDown={handleHueThumbPointerDown}
          onPointerUp={handleHueThumbPointerUp}
          style={{
            top: -5,
            left: width * CalcProcreateBarPositionFromHue(currentHue),
            width: 16,
            height: 16,
            border: '2px solid #ffffff',
            borderRadius: '50%',
            background:
              'rgb(' + HSVtoRGB256([currentHue, 1, 1]).join(',') + ')',
            position: 'absolute',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.5)',
            touchAction: 'none',
          }}
        />
      </div>
    </div>
  );
}
