import { GoogleGenerativeAI } from "@google/generative-ai"; // Corrected Package & Class
import { Expense } from "../types";

export const getBudgetInsights = async (expenses: Expense[]) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Check GitHub Secrets.");
    }
    
    // 1. Correct class name: GoogleGenerativeAI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 2. Use 'gemini-1.5-flash' as the stable model ID
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const expenseSummary = expenses.map(e => ({
      name: e.name,
      category: e.category,
      amount: e.amount,
      quantity: e.quantity,
      timestamp: e.timestamp
    }));

    const prompt = `Here are my recent expenses: ${JSON.stringify(expenseSummary)}. Can you provide 3 brief, actionable financial tips?`;

    // 3. Updated syntax for the stable SDK
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error: any) {
    console.error("Error getting budget insights:", error);
    return `I couldn't generate insights right now. Please try again later!`;
  }
};