
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuizMode, QuizSettings, AIPersonality } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to determine mime type if missing
const getMimeType = (file: File) => {
    if (file.type) return file.type;
    if (file.name.endsWith('.pdf')) return 'application/pdf';
    if (file.name.match(/\.(jpg|jpeg)$/i)) return 'image/jpeg';
    if (file.name.match(/\.png$/i)) return 'image/png';
    if (file.name.match(/\.webp$/i)) return 'image/webp';
    return file.type; 
};

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (!base64String) {
        reject(new Error("Failed to read file"));
        return;
      }
      // Remove data url prefix (e.g. "data:image/jpeg;base64," or "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: getMimeType(file),
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateSummary = async (
  textNotes: string,
  files: File[]
): Promise<string> => {
  const model = "gemini-2.5-flash";
  const parts: any[] = [];

  if (textNotes.trim()) {
    parts.push({ text: `Here are my study notes/topic: \n\n${textNotes}` });
  }

  for (const file of files) {
    const filePart = await fileToGenerativePart(file);
    parts.push(filePart);
  }

  const prompt = `
    Analyze the provided content (text and files) and create a comprehensive study summary.
    
    Structure the summary as follows:
    1. A brief 1-sentence overview of the main topic.
    2. Key Concepts & Definitions (bullet points).
    3. Important Details (bullet points, grouped by sub-topic if necessary).
    4. Key Takeaways.

    Use clear, concise language. 
    Format using standard text. 
    Use "•" for bullet points.
    Use CAPS for section headers (e.g., "KEY CONCEPTS").
    Do not use markdown symbols like ** or ##.
    Ensure the output is clean and easy to read.
  `;
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: parts },
    config: {
      systemInstruction: "You are an expert tutor. Create clear, structured study summaries.",
    }
  });

  return response.text || "Could not generate summary.";
};

// Validate Explain-It-Back
export const validateExplanation = async (
    conceptQuestion: string,
    correctConcept: string,
    userExplanation: string
): Promise<{ isCorrect: boolean; feedback: string }> => {
    const model = "gemini-2.5-flash";
    const prompt = `
      I asked a student: "${conceptQuestion}".
      The correct key concept/answer is: "${correctConcept}".
      The student explained: "${userExplanation}".

      Evaluate if the student understands the concept.
      1. isCorrect: true if they grasped the core meaning, even if wording is different. false if they are wrong or missed the point completely.
      2. feedback: A short, 1-sentence supportive feedback. If wrong, gently correct them.
    `;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isCorrect: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING }
                },
                required: ["isCorrect", "feedback"]
            }
        }
    });

    if (!response.text) return { isCorrect: false, feedback: "Could not validate." };
    try {
        return JSON.parse(response.text);
    } catch {
        return { isCorrect: false, feedback: "Error parsing validation." };
    }
};

export const generateQuizFromContent = async (
  textNotes: string,
  files: File[],
  mode: QuizMode = 'MIXED',
  count: number = 5,
  settings?: QuizSettings
): Promise<QuizQuestion[]> => {
  const model = "gemini-2.5-flash"; 

  const parts: any[] = [];

  if (textNotes.trim()) {
    parts.push({ text: `Here are my study notes/topic: \n\n${textNotes}` });
  }

  for (const file of files) {
    const filePart = await fileToGenerativePart(file);
    parts.push(filePart);
  }

  let typeInstruction = "Mix multiple choice, true/false, and short answer questions.";
  if (mode === 'MULTIPLE_CHOICE') typeInstruction = "Generate only Multiple Choice questions.";
  else if (mode === 'TRUE_FALSE') typeInstruction = "Generate only True/False questions.";
  else if (mode === 'SHORT_ANSWER') typeInstruction = "Generate only Short Answer questions.";
  else if (mode === 'FLASHCARD') typeInstruction = "Generate only FLASHCARD items. Question is the Front, CorrectAnswer is the Back.";
  else if (mode === 'FILL_IN_THE_BLANK') typeInstruction = "Generate only FILL_IN_THE_BLANK questions.";
  else if (mode === 'CONCEPTUAL') typeInstruction = "Generate only ORDERING (Ranking/Sequence) and MATCHING (Concept Mapping) questions to test deep understanding.";
  else if (mode === 'BOSS_BATTLE') typeInstruction = "Generate HIGH STAKES questions. Mostly Multiple Choice and Short Answer, but make them challenging scenarios.";
  else if (mode === 'MIXED' && settings?.allowedTypes) {
    const types = settings.allowedTypes.map(t => t.replace('_', ' ')).join(', ');
    typeInstruction = `Generate a mix of only these question types: ${types}.`;
  }

  let difficultyInstruction = "";
  if (settings?.difficulty) {
    const diff = settings.difficulty;
    if (diff === 'EASY') difficultyInstruction = "Make the questions EASY and straightforward, testing basic recall.";
    if (diff === 'MEDIUM') difficultyInstruction = "Make the questions of MEDIUM difficulty, requiring understanding of concepts.";
    if (diff === 'HARD') difficultyInstruction = "Make the questions HARD and complex, requiring analysis and critical thinking. Use scenarios where possible.";
  }

  // Persona Logic
  let personaInstruction = "You are an expert tutor.";
  let toneInstruction = "Provide clear, concise explanations.";
  
  if (settings?.personality === AIPersonality.COACH) {
      personaInstruction = "You are a high-energy, tough-love sports coach for the brain. 'DROP AND GIVE ME 20 FACTS!' style.";
      toneInstruction = "Use uppercase for emphasis. Be motivational but intense. Call the user 'Cadet' or 'Rookie'.";
  } else if (settings?.personality === AIPersonality.BUDDY) {
      personaInstruction = "You are a chill, supportive study buddy who uses slang (like 'no cap', 'bet', 'lit').";
      toneInstruction = "Keep it casual. Use emojis. Act like a peer.";
  } else if (settings?.personality === AIPersonality.SOCRATIC) {
      personaInstruction = "You are a Socratic professor. You rarely give direct answers, preferring to ask guiding questions.";
      toneInstruction = "In the 'explanation' field, do NOT just give the answer. Instead, explain the logic path so the user discovers it.";
  }

  // System prompt
  const prompt = `
    Create a study quiz based on the provided content.
    The content may include text notes and attached files (images or PDFs).
    Analyze all attached documents thoroughly.
    
    Generate exactly ${count} questions.
    ${typeInstruction}
    ${difficultyInstruction}
    ${toneInstruction}
    
    IMPORTANT RULES:
    1. Questions must be educational and test understanding of the specific provided content.
    2. For Multiple Choice, provide 4 options.
       CRITICAL: The 'correctAnswer' field MUST be the exact text of the correct option string.
    3. For Short Answer, options array must be empty.
    4. 'hint' should be a progressive clue.
    5. 'simpleExplanation' should explain the concept like I'm 5 years old (ELI5), using a fun analogy.
    6. 'searchQuery' should be a specific string optimized for YouTube/Google Search.
    
    FOR "ORDERING" TYPE:
    - Provide a list of 3-5 items in 'orderingItems' that represent a sequence, hierarchy, or process step-by-step.
    
    FOR "MATCHING" TYPE:
    - Provide exactly 4 pairs in 'matchingPairs'. 

    FOR "FLASHCARD" TYPE:
    - 'question' is the Front of the card.
    - 'correctAnswer' is the Back of the card.

    FOR "FILL_IN_THE_BLANK" TYPE:
    - 'question' must be a sentence with a missing part represented by exactly 6 underscores: "______".
    - 'correctAnswer' is the missing word or short phrase.
    
    Output valid JSON only, no markdown.
  `;
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: parts },
    config: {
      systemInstruction: personaInstruction + " Output strictly valid JSON arrays of quiz objects.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            type: { 
              type: Type.STRING, 
              enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ORDERING', 'MATCHING', 'FLASHCARD', 'FILL_IN_THE_BLANK'] 
            },
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.STRING },
            orderingItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            matchingPairs: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        left: { type: Type.STRING },
                        right: { type: Type.STRING }
                    }
                }
            },
            explanation: { type: Type.STRING },
            hint: { type: Type.STRING },
            simpleExplanation: { type: Type.STRING },
            searchQuery: { type: Type.STRING }
          },
          required: ["id", "type", "question", "options", "explanation", "hint", "simpleExplanation", "searchQuery"],
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini.");
  }

  try {
    let jsonString = response.text.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
    }
    const data = JSON.parse(jsonString);
    return data as QuizQuestion[];
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to generate quiz. Please try again.");
  }
};
