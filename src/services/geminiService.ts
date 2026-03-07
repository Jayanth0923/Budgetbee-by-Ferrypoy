import { GoogleGenerativeAI } from "@google/generative-ai";
import { Expense } from "../types";

export const getBudgetInsights = async (expenses: Expense[]) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    if (!apiKey) throw new Error("API Key Missing");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // THE FIX: Use "gemini-pro" as it is universally supported
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

    const expenseSummary = expenses.map(e => ({
      name: e.name, category: e.category, amount: e.amount
    }));

    const prompt = `Based on these expenses: ${JSON.stringify(expenseSummary)}, give me 3 brief financial insights.`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error: any) {
    console.error("Error getting budget insights:", error);
    return `I couldn't generate insights right now. Please try again later!`;
  }
};

// Forcing a fresh update to wake up GitHub Actions