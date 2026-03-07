import { GoogleGenerativeAI } from "@google/generative-ai";
import { Expense } from "../types";

export const getBudgetInsights = async (expenses: Expense[]) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Check your GitHub Secrets.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // PERMANENT FIX: Use gemini-2.0-flash (Stable)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash" 
    });

    const expenseSummary = expenses.map(e => ({
      name: e.name,
      category: e.category,
      amount: e.amount,
      quantity: e.quantity
    }));

    const prompt = `Here are my recent expenses: ${JSON.stringify(expenseSummary)}. Can you provide 3 brief, actionable financial tips?`;

    // Correct method for the current SDK
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error: any) {
    console.error("Error getting budget insights:", error);
    return `I couldn't generate insights right now. Please try again later!`;
  }
};