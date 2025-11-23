
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, QuizMode, QuizSettings } from "../types";

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

export const generateQuizFromContent = async (
  textNotes: string,
  files: File[],
  mode: QuizMode = 'MIXED',
  count: number = 5,
  settings?: QuizSettings
): Promise<QuizQuestion[]> => {
  const model = "gemini-2.5-flash"; // Efficient for this task

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
  else if (mode === 'MIXED' && settings?.allowedTypes) {
    // Custom mix based on settings
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

  // System prompt to guide the generation
  const prompt = `
    Create a study quiz based on the provided content.
    The content may include text notes and attached files (images or PDFs).
    Analyze all attached documents thoroughly.
    
    Generate exactly ${count} questions.
    ${typeInstruction}
    ${difficultyInstruction}
    
    IMPORTANT RULES:
    1. Questions must be educational and test understanding of the specific provided content.
    2. Provide clear, concise explanations for answers.
    3. For Multiple Choice, provide 4 options.
       CRITICAL: The 'correctAnswer' field MUST be the exact text of the correct option string, NOT the letter (e.g., if option A is "Paris", correctAnswer must be "Paris", NOT "A").
    4. For Short Answer, options array must be empty.
    5. 'hint' should be a subtle clue that nudges the user without giving the answer.
    6. 'simpleExplanation' should explain the concept like I'm 5 years old (ELI5), using a fun analogy.
    7. 'searchQuery' should be a specific string optimized for YouTube/Google Search to find a video lesson on this specific topic (e.g., "How photosynthesis works animation").
    
    FOR "ORDERING" TYPE:
    - Provide a list of 3-5 items in 'orderingItems' that represent a sequence, hierarchy, or process step-by-step.
    - The 'question' should ask to arrange them (e.g., "Arrange the phases of Mitosis").
    
    FOR "MATCHING" TYPE:
    - Provide exactly 4 pairs in 'matchingPairs'. 
    - The 'question' should ask to match concepts (e.g., "Match the programming language to its primary use").

    FOR "FLASHCARD" TYPE:
    - 'question' is the Front of the card (Concept/Term/Question).
    - 'correctAnswer' is the Back of the card (Definition/Fact/Answer). Keep it concise (under 20 words).
    - 'explanation' can provide more context.

    FOR "FILL_IN_THE_BLANK" TYPE:
    - 'question' must be a sentence with a missing part represented by exactly 6 underscores: "______".
    - 'correctAnswer' is the missing word or short phrase.
    
    Output valid JSON only, no markdown.
    Keep the response compact to ensure it fits within token limits for ${count} questions.
  `;
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: parts },
    config: {
      systemInstruction: "You are an expert tutor. Output strictly valid JSON arrays of quiz objects.",
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
              items: { type: Type.STRING },
              description: "Options for MC (4) or T/F (2). Empty for others." 
            },
            correctAnswer: { 
              type: Type.STRING,
              description: "The EXACT text of the correct option from the options array. For Flashcard, this is the Back content."
            },
            orderingItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The correct ordered list for ORDERING questions."
            },
            matchingPairs: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        left: { type: Type.STRING },
                        right: { type: Type.STRING }
                    }
                },
                description: "The key-value pairs for MATCHING questions."
            },
            explanation: { type: Type.STRING, description: "Technical/Academic explanation." },
            hint: { type: Type.STRING, description: "A subtle clue." },
            simpleExplanation: { type: Type.STRING, description: "A very simple analogy explanation (ELI5)." },
            searchQuery: { type: Type.STRING, description: "Search term for finding educational videos." }
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
