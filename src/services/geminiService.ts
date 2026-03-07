import { GoogleGenAI } from "@google/genai";
import { Expense } from "../types";

export const getBudgetInsights = async (expenses: Expense[]) => {
  try {
    // UPDATED: Use import.meta.env and the VITE_ prefix for Vite apps
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("Gemini API Key is missing or invalid. Please check your environment variables.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const expenseSummary = expenses.map(e => ({
      name: e.name,
      category: e.category,
      amount: e.amount,
      quantity: e.quantity,
      timestamp: e.timestamp
    }));

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Note: gemini-1.5-flash is the stable standard
      contents: `Here are my recent expenses: ${JSON.stringify(expenseSummary)}. Can you provide 3 brief, actionable financial tips or insights?`,
      config: {
        systemInstruction: "You are a friendly and professional financial advisor named BudgetBee. Your goal is to help users save money and manage their budgets better. Keep your advice concise, encouraging, and based on the data provided.",
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Error getting budget insights:", error);
    return `I couldn't generate insights right now. Please try again later!`;
  }
};
