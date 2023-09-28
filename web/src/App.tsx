import { useEffect, useState } from 'react';
import './App.css';
import Image from 'image-js';
import { RGBtoHSV } from './ColorUtilities';
import ColorAnalyzer, { ColorAnalyzerData } from './ColorAnalyzer';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { debugLog } from './Utilities';
import { useTranslation } from 'react-i18next';
import githubMarkUrl from '/image/github-mark-white.png';
import sampleImageUrl from '/image/sample.jpg';

const calcHistogram = (image: Image) => {
  const binCount = 100;
  const step = 10;
  let histogram = new Map<number, [number, number, number][]>();
  for (let y = 0; y < image.height; y += step) {
    for (let x = 0; x < image.width; x += step) {
      const index = x + y * image.width;
      const rgb = image.getPixel(index);
      let [h, s, v] = RGBtoHSV([rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]);
      const hueBin = Math.floor(h * binCount);
      s = Math.floor(s * binCount) / binCount;
      v = Math.floor(v * binCount) / binCount;
      if (histogram.has(hueBin)) {
        let svs = histogram.get(hueBin)!;
        let isFound = false;
        // TODO: optimize
        for (let i = 0; i < svs.length; i++) {
          if (svs[i][0] == s && svs[i][1] == v) {
            svs[i][2] += 1;
            isFound = true;
            break;
          }
        }
        if (!isFound) {
          histogram.get(hueBin)?.push([s, v, 1]);
        }
      } else {
        histogram.set(hueBin, [[s, v, 1]]);
      }
    }
  }

  // sort each histogram entry by count
  for (let [_, value] of histogram) {
    value.sort((a, b) => b[2] - a[2]);
  }

  return histogram;
};

export default function App() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sampleData, setSampleData] = useState<ColorAnalyzerData | null>(null);
  const [dataArray, setDataArray] = useState<ColorAnalyzerData[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  useEffect(() => {
    const loadSampleData = async () => {
      const image = await Image.load(sampleImageUrl);
      const histogram = calcHistogram(image);
      setSampleData(new ColorAnalyzerData(histogram, sampleImageUrl, image));
    };
    loadSampleData();
  }, []);

  const processFile = async (file: Blob) => {
    const buf = await file.arrayBuffer();
    const arr = new Uint8Array(buf);
    let image = await Image.load(arr);
    if (image.width > image.height) {
      image = image.resize({ height: 1000, preserveAspectRatio: true });
    } else {
      image = image.resize({ width: 1000, preserveAspectRatio: true });
    }
    image = image.colorDepth(8);
    const histogram = calcHistogram(image);
    debugLog(file);
    setDataArray([
      ...dataArray,
      {
        histogram: histogram,
        imageUrl: URL.createObjectURL(file),
        image: image,
      },
    ]);
  };

  return (
    <div
      className="App"
      onPaste={async (e) => {
        const content = e.clipboardData.getData('text');
        debugLog(content);
        debugLog(e.clipboardData.types);
        await processFile(e.clipboardData.files[0]);
        debugLog(e);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const content = e.dataTransfer.getData('text');
        debugLog(content);
        debugLog(e.dataTransfer.types);
        await processFile(e.dataTransfer.files[0]);
      }}
    >
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Color Analyzer
          </Typography>
          <a
            href="https://github.com/arcturu/color-analyzer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={githubMarkUrl}
              alt="GitHub"
              width="32"
              height="32"
              style={{ verticalAlign: 'middle' }}
            />
          </a>
        </Toolbar>
      </AppBar>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {dataArray.map((data, index) => (
          <ColorAnalyzer
            key={data.imageUrl}
            maxWidth={windowWidth}
            data={data}
            onClose={() => {
              const newDataArray = [...dataArray];
              newDataArray.splice(index, 1);
              setDataArray(newDataArray);
            }}
          />
        ))}
      </div>
      <div
        style={{
          textAlign: 'center',
          margin: '20px',
          border: '2px dashed #FF8E53',
          borderRadius: '10px',
          padding: '40px',
        }}
        className={isDraggingOver ? 'is-dragging-over' : ''}
      >
        <Typography
          variant="h5"
          style={{
            margin: '0 0 20px 0',
          }}
        >
          {t('DRAG_AND_DROP_HERE')}
        </Typography>
        <input
          type="file"
          accept="image/png, image/jpeg, image/gif"
          onChange={(e) => {
            processFile(e.target.files![0]);
            e.target.value = '';
          }}
        />
        <Typography
          style={{
            margin: '20px 0 0 0',
            fontSize: '0.8em',
            color: '#aaaaaa',
            whiteSpace: 'pre-line',
          }}
        >
          {t('YOUR_IMAGE_WILL_NOT_BE_UPLOADED')}
        </Typography>
      </div>
      {
        // if dataArray is empty, then show sample ColorAnalyzer
        dataArray.length === 0 && !!sampleData && (
          <div>
            <Typography variant="h5">{t('EXAMPLE')}</Typography>
            <ColorAnalyzer
              maxWidth={windowWidth}
              data={sampleData}
              onClose={() => {}} // do nothing
            />
          </div>
        )
      }
    </div>
  );
}
