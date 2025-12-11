import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from '../types';

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY as string;

  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_API_KEY");
  }

  return new GoogleGenAI({ apiKey });
};

export const parseFileWithGemini = async (
  file: File, 
  fileContentBase64: string,
  existingProductNames: string[]
): Promise<Transaction[]> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash"; // Excellent for document understanding

  // We provide the list of products to help Gemini map fuzzy names to IDs if possible,
  // though in a real app ID matching is safer.
  const contextPrompt = `
    You are a data entry assistant for a pharmacy inventory system.
    Analyze the attached file content. It contains either daily sales records or purchase history (restock).
    
    Extract the data into a structured JSON format.
    Current Product List (use these names for context): ${existingProductNames.slice(0, 50).join(', ')}...
    
    Rules:
    1. Identify if the file represents SALES (consumption) or RESTOCK (orders arriving).
    2. Extract Date, Product Name (or SKU), and Quantity.
    3. If the date is not explicit in the rows, look for a file header date. If none, use today's date: ${new Date().toISOString().split('T')[0]}.
    4. Ignore irrelevant text.
    5. Return ONLY the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [
            { text: contextPrompt },
            {
              inlineData: {
                mimeType: file.type || 'text/plain',
                data: fileContentBase64
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING, description: "The product name or SKU found" },
              date: { type: Type.STRING, description: "YYYY-MM-DD format" },
              type: { type: Type.STRING, enum: ["SALE", "RESTOCK"] },
              quantity: { type: Type.NUMBER }
            },
            required: ["productId", "quantity", "type"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text) as any[];
    
    // Map to Transaction interface with generated IDs
    return data.map((item, index) => ({
      id: `trans-${Date.now()}-${index}`,
      productId: item.productId, // The calling component will need to reconcile this name to an ID
      date: item.date || new Date().toISOString().split('T')[0],
      type: item.type as 'SALE' | 'RESTOCK',
      quantity: item.quantity
    }));

  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to process file with AI.");
  }
};