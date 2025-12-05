import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTasks = async (tasks: Task[]): Promise<string> => {
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'doing');
  
  if (pendingTasks.length === 0) {
    return "Ottimo lavoro! Non ci sono task in sospeso. Goditi il riposo!";
  }

  const dataSummary = pendingTasks.map(t => 
    `- [${t.status === 'doing' ? 'IN CORSO' : 'DA FARE'}] (Priorità: ${t.priority}): ${t.content}`
  ).join('\n');

  const prompt = `
    Agisci come un Project Manager esperto ed efficiente.
    Analizza la seguente lista di task rimasti da fare.
    
    Fornisci un breve report strategico (max 3-4 frasi) in italiano:
    1. Identifica i colli di bottiglia o le urgenze (Alta priorità).
    2. Suggerisci l'ordine di esecuzione logico.
    3. Mantieni un tono motivante ma professionale.

    Lista Task:
    ${dataSummary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Impossibile analizzare i task al momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Errore durante la connessione all'assistente AI.";
  }
};

export const improveNote = async (text: string): Promise<string> => {
  if (!text) return "";
  
  const prompt = `
    Agisci come un assistente editoriale. Migliora il seguente appunto preso velocemente.
    Correggi la grammatica, rendilo più chiaro e formatta meglio il testo se necessario (puoi usare markdown).
    Mantieni il significato originale. Rispondi SOLO con il testo migliorato.

    Appunto originale:
    ${text}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
};

export const suggestTasks = async (noteContent: string): Promise<string[]> => {
    const prompt = `
      Analizza il seguente testo di un blocco note ed estrai una lista di possibili task (azioni da compiere).
      Restituisci SOLO un array JSON di stringhe, ad esempio: ["Comprare il latte", "Inviare email a Mario"].
      Se non ci sono task evidenti, restituisci un array vuoto [].

      Testo:
      ${noteContent}
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
      });
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return [];
    }
  };