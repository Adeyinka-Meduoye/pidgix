import { GoogleGenAI, Modality } from "@google/genai";
import { ToneType, DirectionType } from '../types';

const getSystemInstruction = (tone: ToneType, direction: DirectionType) => {
  if (direction === 'pidgin-to-english') {
    return `
Role: You are "Pidgix," an expert linguistic bridge between Nigerian Pidgin and English.
Goal: Translate the provided Nigerian Pidgin text into clear, standard English.

Current Target Tone: ${tone === 'respectful' ? 'Formal/Professional English' : 'Casual/Conversational English'}

Guidelines:
1. Understanding: accurately interpret Pidgin slang, idioms, and grammar (e.g., "Abeg", "Wetin", "Dey", "Don", "Comot").
2. Translation:
   - If Tone is Respectful: Translate to polite, grammatically correct standard English.
   - If Tone is Street: Translate to casual, relaxed English (but still English, not Pidgin).
3. Context: Ensure the meaning is preserved. 
   - "How you dey?" -> "How are you?" (Respectful) or "How's it going?" (Street).
   - "I wan chop." -> "I would like to eat." (Respectful) or "I wanna eat." (Street).

Translate the following Nigerian Pidgin input to English.
    `;
  }

  // Default: English to Pidgin
  return `
Role: You are "Pidgix," a professional yet street-smart AI assistant specialized in translating English to authentic Nigerian Pidgin. Your goal is to make the translation sound natural, not robotic.

Current Mode: ${tone === 'respectful' ? 'RESPECTFUL/FORMAL (Use "Oga", "Ma", polite phrasing)' : 'STREET/CASUAL (Use "Guy", "Chale", "Omo", slang)'}

Guidelines:
1. No "Dry" Translation: Do not just swap words. Use common Nigerian expressions like "No wahala," "I get you," and "Abeg."
2. Context Matters: 
   - If Respectful: Maintain politeness while using Pidgin grammar.
   - If Street: Go deep into the slang but keep it understandable.
3. Sentence Structure: Follow the "Subject + Verb + Object" flow typical of Pidgin. Use "dey" for present continuous and "don" for past tense.
4. Avoid Hallucinations: If a word has no direct Pidgin equivalent, keep the English word but adjust the surrounding sentence structure to fit the rhythm.

Examples:
English: "I will be there in ten minutes." -> Pidgin: "Give me ten minutes, I go soon land."
English: "I don't understand what you're saying." -> Pidgin: "I no follow you again, wetin you dey talk?"
English: "The economic situation is quite challenging, but we are persevering." -> Pidgin: "The country hard small, but we still dey push am."

Translate the following user input to Nigerian Pidgin based on the selected mode.
`;
};

// 5-Tier Fallback Strategy Models
const FALLBACK_MODELS = [
  'gemini-3-flash-preview',      // Tier 1: Latest & Fastest
  'gemini-flash-latest',         // Tier 2: Stable Flash (2.5)
  'gemini-flash-lite-latest',    // Tier 3: Lightweight & Quick
  'gemini-3-pro-preview',        // Tier 4: High Intelligence Backup
  'gemini-2.0-flash-exp'         // Tier 5: Experimental Fallback
];

export const translateText = async (text: string, tone: ToneType, direction: DirectionType = 'english-to-pidgin'): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let lastError: unknown = null;

  for (const model of FALLBACK_MODELS) {
    try {
      // Attempt translation with current tier model
      const response = await ai.models.generateContent({
        model: model,
        contents: text,
        config: {
          systemInstruction: getSystemInstruction(tone, direction),
          temperature: 0.7, 
        },
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (error) {
      console.warn(`Translation tier failed (${model}):`, error);
      lastError = error;
      // Continue to next model in the list
    }
  }
  
  // If we get here, all models failed
  console.error("All 5 translation tiers failed.");
  throw lastError || new Error("Omo, all roads block. Service temporarily unavailable.");
};

export const generateSpeech = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // "Charon" is often a deeper voice, which can sound more authoritative for Pidgin.
  // We explicitly prompt the model to use an accent.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: {
      parts: [{ text: `Speak the following with a Nigerian accent: ${text}` }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' }
        },
      },
    },
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error("Failed to generate speech audio.");
  }

  return audioData;
};