import { GoogleGenerativeAI } from "@google/generative-ai";
import { Expense } from "../types";

export const getBudgetInsights = async (expenses: Expense[]) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key Missing");

    const genAI = new GoogleGenerativeAI(apiKey);

    // (Optional) Debug: List available models via REST API
    
    const listModels = async () => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();
        console.log('Available models:', data.models?.map((m: any) => m.name));
      } catch (e) {
        console.error('Failed to list models', e);
      }
    };
    await listModels();
    

    // Use the default API version (v1beta) – no apiVersion override
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const expenseSummary = expenses.map(e => ({
      name: e.name,
      category: e.category,
      amount: e.amount
    }));

    const prompt = `Based on these expenses: ${JSON.stringify(expenseSummary)}, give me 3 brief financial insights.`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error: any) {
    console.error("Error getting budget insights:", error);
    return `I couldn't generate insights right now. Please try again later!`;
  }
};