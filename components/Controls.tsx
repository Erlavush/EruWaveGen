import React, { useState } from 'react';
import { VizType, ColorPalette, AIThemeResponse } from '../types';
import { DEFAULT_PALETTES, VIZ_TYPES } from '../constants';
import { generateTheme } from '../services/gemini';
import { Wand2, Download, Loader2, Sliders, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';

interface ControlsProps {
  currentViz: VizType;
  setViz: (v: VizType) => void;
  currentPalette: ColorPalette;
  setPalette: (p: ColorPalette) => void;
  lineCount: number;
  setLineCount: (n: number) => void;
  isRecording: boolean;
  startRecording: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  currentViz,
  setViz,
  currentPalette,
  setPalette,
  lineCount,
  setLineCount,
  isRecording,
  startRecording,
  isOpen,
  onToggle
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const theme: AIThemeResponse = await generateTheme(aiPrompt);
      setPalette(theme.palette);
      setViz(theme.recommendedVizType);
      setAiPrompt('');
    } catch (e) {
      alert("Failed to generate theme. Ensure API Key is valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Toggle Button (Always Visible) */}
      <button 
        onClick={onToggle}
        className={`fixed z-40 p-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-lg hover:bg-white/10 transition-all duration-300 ${isOpen ? 'bottom-[280px] left-1/2 -translate-x-1/2 rotate-0' : 'bottom-6 left-6 rotate-0'}`}
        title={isOpen ? "Minimize Controls" : "Open Controls"}
      >
        {isOpen ? <ChevronDown className="w-5 h-5" /> : <Settings2 className="w-6 h-6" />}
      </button>

      {/* Main Panel */}
      <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-black/80 backdrop-blur-xl border-t border-x border-white/10 rounded-t-3xl p-6 text-white transition-all duration-500 shadow-2xl z-30 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[100%] opacity-0 pointer-events-none'}`}>
        
        <div className="flex flex-col gap-6">
          
          {/* Top Row: AI & Recording */}
          <div className="flex items-center gap-4">
             <div className="flex-1 relative">
               <input 
                 type="text" 
                 value={aiPrompt}
                 onChange={(e) => setAiPrompt(e.target.value)}
                 placeholder="Describe a mood (e.g. 'Cosmic Explosion')..."
                 className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 pl-12 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                 onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
               />
               <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
               <button 
                 onClick={handleAiGenerate}
                 disabled={isGenerating || !aiPrompt}
                 className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full disabled:opacity-50"
               >
                 {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-xs font-bold text-purple-400">GENERATE</span>}
               </button>
             </div>
             
             <button 
               onClick={startRecording}
               disabled={isRecording}
               className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap ${isRecording ? 'bg-red-500/20 text-red-400 cursor-not-allowed animate-pulse' : 'bg-white text-black hover:bg-gray-200'}`}
             >
               {isRecording ? (
                 <>Recording...</>
               ) : (
                 <><Download className="w-4 h-4" /> GIF</>
               )}
             </button>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Bottom Row: Manual Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Viz Type Selection */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Style</label>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {VIZ_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isActive = currentViz === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setViz(t.id as VizType)}
                      className={`flex-shrink-0 snap-start flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-all ${isActive ? 'bg-white text-black border-white scale-105 shadow-lg shadow-white/20' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    >
                      <Icon className="w-6 h-6 mb-1" />
                      <span className="text-[9px] font-semibold">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Color & Density Selection */}
            <div className="space-y-4">
               {/* Palette */}
               <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Colors</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {DEFAULT_PALETTES.map((p) => {
                      const isActive = currentPalette.name === p.name;
                      return (
                        <button
                          key={p.name}
                          onClick={() => setPalette(p)}
                          className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center relative transition-transform ${isActive ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }}
                          title={p.name}
                        />
                      )
                    })}
                  </div>
               </div>

               {/* Density Slider */}
               <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400 uppercase font-medium">
                      <span className="flex items-center gap-1"><Sliders className="w-3 h-3"/> Density</span>
                      <span>{lineCount} Lines</span>
                  </div>
                  <input 
                    type="range" 
                    min="32" 
                    max="200" 
                    step="8" 
                    value={lineCount} 
                    onChange={(e) => setLineCount(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-200"
                  />
               </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Controls;