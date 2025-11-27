import { GoogleGenAI, Type } from "@google/genai";
import { AIThemeResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTheme = async (prompt: string): Promise<AIThemeResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a visualizer theme based on this mood/description: "${prompt}". 
      Return a color palette (hex codes) and a recommended visualization type.
      
      Available types:
      - 'wave': classic horizontal line
      - 'bars': horizontal frequency bars
      - 'circle': continuous connected circular loop
      - 'sunburst': radial lines radiating from center
      - 'stardust': radial dots/particles radiating from center

      The background should generally be dark for better contrast.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            palette: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                background: { type: Type.STRING },
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING },
              },
              required: ['name', 'background', 'primary', 'secondary', 'accent']
            },
            recommendedVizType: { 
              type: Type.STRING, 
              enum: ['wave', 'bars', 'circle', 'sunburst', 'stardust'] 
            },
            description: { type: Type.STRING }
          },
          required: ['palette', 'recommendedVizType', 'description']
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return json as AIThemeResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate theme. Please try again.");
  }
};