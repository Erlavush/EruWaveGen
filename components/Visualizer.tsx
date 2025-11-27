import React, { useEffect, useRef, useState } from 'react';
import { VizType, ColorPalette } from '../types';
import { useAudio } from '../hooks/useAudio';
import { GifRecorder, getWorkerBlobUrl } from '../services/gifService';

interface VisualizerProps {
  vizType: VizType;
  palette: ColorPalette;
  lineCount: number;
  isRecording: boolean;
  onRecordingComplete: () => void;
  isPanelOpen: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  vizType, 
  palette, 
  lineCount,
  isRecording, 
  onRecordingComplete,
  isPanelOpen
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const { getAudioData } = useAudio(Math.max(512, lineCount * 2)); 
  const recorderRef = useRef<GifRecorder | null>(null);

  // Handle Resize
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Recorder Worker
  useEffect(() => {
    const initRecorder = async () => {
      const workerUrl = await getWorkerBlobUrl();
      if (canvasRef.current && workerUrl) {
        recorderRef.current = new GifRecorder(
          canvasRef.current.width, 
          canvasRef.current.height, 
          workerUrl
        );
      }
    };
    initRecorder();
  }, [dimensions]);

  // Recording Logic
  useEffect(() => {
    if (isRecording && recorderRef.current && !recorderRef.current.recording) {
      recorderRef.current.start();
      setTimeout(() => {
        if (recorderRef.current?.recording) {
          recorderRef.current.stop();
          onRecordingComplete();
        }
      }, 5000);
    }
  }, [isRecording, onRecordingComplete]);

  // Drawing Loop
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const { timeData, freqData } = getAudioData();

    // Determine safe drawing area (shift up if panel is open and not recording)
    // If recording, use full screen always for better output
    const panelHeight = 280; // Approximate height of the control panel
    const bottomOffset = (isPanelOpen && !isRecording) ? panelHeight : 0;
    
    // Clear
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, width, height);

    // Common Styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Reset Glow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    switch (vizType) {
      case 'wave':
        drawWave(ctx, width, height, timeData, palette, bottomOffset);
        break;
      case 'circle':
        drawCircleWave(ctx, width, height, timeData, freqData, palette, bottomOffset);
        break;
      case 'bars':
        drawCavaBars(ctx, width, height, freqData, palette, bottomOffset);
        break;
      case 'sunburst':
        drawRadialBars(ctx, width, height, freqData, palette, bottomOffset);
        break;
      case 'stardust':
        drawStardust(ctx, width, height, freqData, palette, bottomOffset);
        break;
    }

    if (isRecording && recorderRef.current) {
      recorderRef.current.addFrame(canvas);
    }

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  });

  // --- Visualization Renderers ---

  const drawWave = (
    ctx: CanvasRenderingContext2D, 
    w: number, 
    h: number, 
    data: Uint8Array, 
    colors: ColorPalette,
    bottomOffset: number
  ) => {
    // Adjust vertical center based on offset
    const availableHeight = h - bottomOffset;
    const cy = availableHeight / 2;

    ctx.lineWidth = 3;
    ctx.strokeStyle = colors.primary;
    ctx.shadowBlur = 10;
    ctx.shadowColor = colors.primary;
    ctx.beginPath();

    const sliceWidth = w / (data.length - 1);
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * availableHeight) / 2; // Scale amplitude to available height

      // Shift y to the new center
      // Original y calculation was centered around h/2 implicitly by scaling? 
      // Actually v goes from 0 to 2 approx. 128 is 1.0.
      // (v * h) / 2 is large.
      // Let's re-center properly:
      const yOffset = (v - 1) * (availableHeight * 0.4); 
      const finalY = cy + yOffset;

      if (i === 0) ctx.moveTo(x, finalY);
      else {
        // Smooth curve
        const prevX = x - sliceWidth;
        const prevDataV = (data[i-1] / 128.0) - 1;
        const prevYOffset = prevDataV * (availableHeight * 0.4);
        const prevY = cy + prevYOffset;
        
        const cpX = (prevX + x) / 2;
        const cpY = (prevY + finalY) / 2;
        
        ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
      }

      x += sliceWidth;
    }
    ctx.lineTo(w, cy);
    ctx.stroke();
  };

  const drawCircleWave = (
    ctx: CanvasRenderingContext2D, 
    w: number, 
    h: number, 
    timeData: Uint8Array,
    freqData: Uint8Array,
    colors: ColorPalette,
    bottomOffset: number
  ) => {
    // Center point shifts up
    const cx = w / 2;
    const cy = (h - bottomOffset) / 2;
    const radius = Math.min(w, h - bottomOffset) / 4;

    let bassTotal = 0;
    for(let i = 0; i < 10; i++) bassTotal += freqData[i];
    const avgBass = bassTotal / 10;
    const scale = 1 + (avgBass / 255) * 0.1;

    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = colors.primary;
    
    ctx.beginPath();

    const points = Math.max(32, lineCount); 
    const step = Math.floor(timeData.length / points);
    
    for (let i = 0; i <= points; i++) {
      const dataIndex = (i % points) * step;
      const v = (timeData[dataIndex] / 128.0) - 1; 
      const amp = v * (radius * 0.5); 
      
      const angle = (i / points) * 2 * Math.PI - (Math.PI / 2);
      const r = (radius * scale) + amp;

      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner glow
    ctx.strokeStyle = colors.secondary;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.9, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const drawCavaBars = (
    ctx: CanvasRenderingContext2D, 
    w: number, 
    h: number, 
    freqData: Uint8Array, 
    colors: ColorPalette,
    bottomOffset: number
  ) => {
    // CLASSIC CAVA
    const bars = lineCount;
    const paddingX = w * 0.05;
    const availableWidth = w - (paddingX * 2);
    
    const gap = availableWidth * 0.01; 
    const barW = (availableWidth / bars) - gap;
    
    if (barW < 0.5) return; 

    const startX = paddingX;
    // Base line moves up if panel is open
    const bottomY = h - bottomOffset - (h * 0.05); // 5% padding from panel/bottom

    const dataStep = Math.floor(freqData.length / bars);

    for (let i = 0; i < bars; i++) {
        let maxVal = 0;
        for(let j=0; j<dataStep; j++) {
            const val = freqData[(i * dataStep) + j] || 0;
            if (val > maxVal) maxVal = val;
        }

        const percent = maxVal / 255;
        const heightMult = Math.pow(percent, 0.8); 
        // Allow bars to go higher if we have space, but cap them reasonable
        const maxBarH = (h - bottomOffset) * 0.6;
        const barH = Math.max(4, heightMult * maxBarH); 

        const x = startX + i * (barW + gap);
        const y = bottomY - barH;

        const gradient = ctx.createLinearGradient(x, bottomY, x, y);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.secondary);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barW, barH);
    }
  };

  const drawRadialBars = (
    ctx: CanvasRenderingContext2D, 
    w: number, 
    h: number, 
    freqData: Uint8Array, 
    colors: ColorPalette,
    bottomOffset: number
  ) => {
    const cx = w / 2;
    const cy = (h - bottomOffset) / 2;
    const minRadius = Math.min(w, h - bottomOffset) / 6;
    const maxBarLength = Math.min(w, h - bottomOffset) / 3;

    const bars = lineCount;
    const step = Math.floor(freqData.length / bars);

    for (let i = 0; i < bars; i++) {
        let maxVal = 0;
        for(let j=0; j<step; j++) {
             const val = freqData[(i * step) + j] || 0;
             if (val > maxVal) maxVal = val;
        }

        const percent = maxVal / 255;
        const barLen = Math.max(2, percent * maxBarLength);
        
        const angle = (i / bars) * 2 * Math.PI - (Math.PI / 2);
        
        const x1 = cx + minRadius * Math.cos(angle);
        const y1 = cy + minRadius * Math.sin(angle);
        
        const x2 = cx + (minRadius + barLen) * Math.cos(angle);
        const y2 = cy + (minRadius + barLen) * Math.sin(angle);

        ctx.lineWidth = (2 * Math.PI * minRadius) / bars * 0.8; 
        ctx.strokeStyle = i % 2 === 0 ? colors.primary : colors.secondary;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
  };

  const drawStardust = (
    ctx: CanvasRenderingContext2D, 
    w: number, 
    h: number, 
    freqData: Uint8Array, 
    colors: ColorPalette,
    bottomOffset: number
  ) => {
    const cx = w / 2;
    const cy = (h - bottomOffset) / 2;
    const minR = Math.min(w, h - bottomOffset) / 5;

    const dots = lineCount;
    const step = Math.floor(freqData.length / dots);

    for (let i = 0; i < dots; i++) {
      const val = freqData[i * step];
      const percent = val / 255;
      const angle = (i / dots) * 2 * Math.PI;

      const r = minR + (percent * 150) + (Math.sin(Date.now() / 1000 + i) * 10);
      
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      const size = 1 + (percent * 4);

      ctx.fillStyle = colors.accent;
      ctx.globalAlpha = 0.6 + (percent * 0.4);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  };

  return (
    <div ref={containerRef} className="w-full h-full relative group">
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="w-full h-full block"
      />
    </div>
  );
};

export default Visualizer;