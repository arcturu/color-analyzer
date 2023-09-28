import { IconButton, Paper, TextField } from '@mui/material';
import HsvRect2 from './picker/HsvRect2';
import Image from 'image-js';
import { useRef, useState } from 'react';
import { RGBtoHSV } from './ColorUtilities';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

export class ColorAnalyzerData {
  public histogram: Map<number, [number, number, number][]>;
  public imageUrl: string;
  public image: Image;
  constructor(
    histogram: Map<number, [number, number, number][]>,
    imageUrl: string,
    image: Image
  ) {
    this.histogram = histogram;
    this.imageUrl = imageUrl;
    this.image = image;
  }
}

export interface ColorAnalyzerProps {
  maxWidth?: number;
  data: ColorAnalyzerData;
  onClose: () => void;
}

export default function ColorAnalyzer(props: ColorAnalyzerProps) {
  const [hoveringRgb, setHoveringRgb] = useState<number[] | null>(null);
  const [pinnedRgb, setPinnedRgb] = useState<number[] | null>(null);
  const [pinnedPosition, setPinnedPosition] = useState<[number, number] | null>(
    null
  );
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { t } = useTranslation();

  const width = 300;

  const handleImagePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    if (
      x < 0 ||
      e.currentTarget.clientWidth < x ||
      y < 0 ||
      e.currentTarget.clientHeight < y
    ) {
      return;
    }

    // get color at (x, y)
    // get actual size of image presented
    const displayWidth = e.currentTarget.clientWidth;
    const displayHeight = e.currentTarget.clientHeight;
    const index =
      Math.floor((x / displayWidth) * props.data.image.width) +
      Math.floor((y / displayHeight) * props.data.image.height) *
        props.data.image.width;
    const rgb = props.data.image.getPixel(index);
    if (rgb.some((v) => isNaN(v))) {
      return;
    }

    // normalize rgb
    const normalizedRgb = rgb.map((v) => v / 255);
    setHoveringRgb(normalizedRgb);
    if (e.buttons == 1) {
      setPinnedRgb(normalizedRgb);
      setPinnedPosition([x, y]);
    }
  };

  const currentRgb = hoveringRgb ?? pinnedRgb;
  const [currentHue, currentSaturation, currentValue] = RGBtoHSV(
    currentRgb ?? [0, 0, 0]
  );
  return (
    <Paper
      style={{
        display: 'inline-block',
        margin: '20px 10px 0px 10px',
        padding: '30px 20px 20px 10px',
        position: 'relative',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          position: 'relative',
          maxWidth: props.maxWidth ?? '800px',
        }}
      >
        <div
          style={{
            display: 'block',
            margin: '10px 5px 10px 10px',
            width: width,
            height: width,
          }}
        >
          <img
            ref={imgRef}
            className="App-logo"
            src={props.data.imageUrl}
            style={
              props.data.image.width > props.data.image.height
                ? {
                    width: width,
                    height: 'auto',
                    position: 'relative',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    touchAction: 'none',
                    userSelect: 'none',
                  }
                : {
                    width: 'auto',
                    height: width,
                    touchAction: 'none',
                    userSelect: 'none',
                  }
            }
            onDragStart={(e) => e.preventDefault()}
            onPointerMove={handleImagePointerMove}
            onPointerDown={handleImagePointerMove}
            onPointerLeave={() => setHoveringRgb(null)}
          />
          {!!pinnedPosition && (
            <div
              style={{
                position: 'absolute',
                // +20: div.margin * 2
                top:
                  pinnedPosition[1] +
                  (width - (imgRef?.current?.height ?? 0) + 20) / 2,
                left: 10,
                width: width,
                height: '1px',
                backgroundColor: '#a0a0a0',
                pointerEvents: 'none',
              }}
            />
          )}
          {!!pinnedPosition && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: pinnedPosition[0] + (imgRef?.current?.offsetLeft ?? 0),
                width: '1px',
                height: width,
                backgroundColor: '#a0a0a0',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        {/* <button
          onClick={(e) => {
            navigator.clipboard.read!().then(async (items) => {
              debugLog(items);
              const blob = await items[0].getType!('image/png');
              debugLog(blob);
              await processFile(blob);
            });
          }}
        >
          ペースト
        </button> */}
        <div style={{ display: 'flex' }}>
          <div style={{ position: 'relative' }}>
            <HsvRect2
              histogram={props.data.histogram}
              currentRgb={currentRgb}
            />
            <TextField
              fullWidth
              label={t('COLOR_CODE')}
              value={
                '#' +
                (currentRgb
                  ?.slice(0, 3)
                  .map((v) =>
                    Math.floor(v * 255)
                      .toString(16)
                      .padStart(2, '0')
                      .toUpperCase()
                  )
                  ?.join('') ?? '000000')
              }
              size="small"
              margin="dense"
              style={{
                position: 'absolute',
                bottom: 8,
                left: 10,
                width: 200,
              }}
            />
          </div>
          <div style={{ width: 84 }}>
            <TextField
              fullWidth
              label={t('HSV_HUE')}
              InputProps={{ endAdornment: <span>&deg;</span> }}
              value={currentHue ? Math.floor(currentHue * 360) : 0}
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label={t('HSV_SATURATION')}
              InputProps={{ endAdornment: '%' }}
              value={
                currentSaturation ? Math.floor(currentSaturation * 100) : 0
              }
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label={t('HSV_VALUE')}
              InputProps={{ endAdornment: '%' }}
              value={currentValue ? Math.floor(currentValue * 100) : 0}
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="R"
              value={currentRgb ? Math.floor(currentRgb[0] * 255) : 0}
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="G"
              value={currentRgb ? Math.floor(currentRgb[1] * 255) : 0}
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="B"
              value={currentRgb ? Math.floor(currentRgb[2] * 255) : 0}
              size="small"
              margin="dense"
            />
          </div>
        </div>
      </div>
      <IconButton
        style={{ position: 'absolute', top: 0, right: 0 }}
        onClick={() => {
          props.onClose();
        }}
      >
        <CloseIcon />
      </IconButton>
    </Paper>
  );
}
