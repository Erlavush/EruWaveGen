import React, { useState } from 'react';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';
import { VizType, ColorPalette } from './types';
import { DEFAULT_PALETTES } from './constants';

const App: React.FC = () => {
  const [vizType, setVizType] = useState<VizType>('bars');
  const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTES[0]);
  const [lineCount, setLineCount] = useState<number>(64);
  const [isRecording, setIsRecording] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(true);

  const startRecording = () => {
    setIsRecording(true);
    // Optional: Close controls automatically when recording starts for a better view
    // setIsControlsOpen(false); 
  };

  const onRecordingComplete = () => {
    setIsRecording(false);
    // setIsControlsOpen(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background Layer (updates with palette background for smoothness) */}
      <div 
        className="absolute inset-0 transition-colors duration-700 ease-in-out" 
        style={{ backgroundColor: palette.background }}
      />
      
      {/* Visualization Layer */}
      <Visualizer 
        vizType={vizType} 
        palette={palette}
        lineCount={lineCount}
        isRecording={isRecording}
        onRecordingComplete={onRecordingComplete}
        isPanelOpen={isControlsOpen}
      />

      {/* Header / Brand */}
      <div className={`absolute top-6 left-6 z-20 pointer-events-none select-none transition-opacity duration-300 ${isRecording ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="text-3xl font-bold tracking-tighter text-white/90">SonicWave</h1>
        <p className="text-xs text-white/50 font-mono mt-1">AI-POWERED AUDIO VIZ</p>
      </div>

      {/* Status Indicators */}
      {isRecording && (
        <div className="absolute top-6 right-6 z-20 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]">
          REC
        </div>
      )}

      {/* Controls Layer */}
      <Controls 
        currentViz={vizType}
        setViz={setVizType}
        currentPalette={palette}
        setPalette={setPalette}
        lineCount={lineCount}
        setLineCount={setLineCount}
        isRecording={isRecording}
        startRecording={startRecording}
        isOpen={isControlsOpen}
        onToggle={() => setIsControlsOpen(!isControlsOpen)}
      />
    </div>
  );
};

export default App;