// Wrapper to handle gif.js interaction
// Assuming GIF is available on window from CDN

export class GifRecorder {
  private gif: any;
  private isRecording: boolean = false;
  private width: number;
  private height: number;

  constructor(width: number, height: number, workerScriptUrl: string) {
    this.width = width;
    this.height = height;
    
    // @ts-ignore
    if (typeof GIF === 'undefined') {
      console.error("GIF.js library not loaded");
      return;
    }

    // @ts-ignore
    this.gif = new GIF({
      workers: 2,
      quality: 10,
      width: this.width,
      height: this.height,
      workerScript: workerScriptUrl, // Important for CORS/CDN usage
      background: '#000000'
    });

    this.gif.on('finished', (blob: Blob) => {
      this.isRecording = false;
      window.open(URL.createObjectURL(blob));
    });
  }

  addFrame(canvas: HTMLCanvasElement) {
    if (this.isRecording && this.gif) {
      this.gif.addFrame(canvas, { copy: true, delay: 40 }); // ~25fps
    }
  }

  start() {
    this.isRecording = true;
    this.gif.frames = []; // reset
  }

  stop() {
    this.isRecording = false;
    this.gif.render();
  }

  get recording() {
    return this.isRecording;
  }
}

// Helper to get worker script from CDN to avoid cross-origin worker restrictions
export const getWorkerBlobUrl = async (): Promise<string> => {
  try {
    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    const text = await response.text();
    const blob = new Blob([text], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Failed to load GIF worker", e);
    return ''; // Fallback might fail if workerScript is mandatory
  }
};
