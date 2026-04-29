import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(req) {
  try {
    const { title, description, promptText } = await req.json();

    const systemPrompt = `
    You are an expert categorization system for an AI Prompt Library.
    I will give you a prompt title, description, and the text itself.
    Reply ONLY with the exact ID number of the category that best fits. 
    Do not include any words, punctuation, or explanations. Just the number.

    Available Categories:
    1 = Copywriting
    2 = Blog & Articles
    3 = Creative Writing
    4 = Email Drafting
    5 = Social Media
    6 = Editing & Proofing
    7 = SEO & Keywords
    8 = Summarization
    9 = Translation
    10 = Scriptwriting
    11 = Web Dev
    12 = Backend & APIs
    13 = Python Scripts
    14 = SQL & DBs
    15 = Debugging
    16 = Data Analysis
    17 = Spreadsheets
    18 = DevOps & Cloud
    19 = Cybersecurity
    20 = Game Dev
    21 = Marketing
    22 = Sales
    23 = Product Mgmt
    24 = HR & Recruiting
    25 = Customer Support
    26 = Project Mgmt
    27 = Finance
    28 = Legal & Contracts
    29 = Meetings
    30 = Presentations
    31 = Lesson Planning
    32 = Language Learning
    33 = Academic Research
    34 = Quizzes & Tests
    35 = Study Guides
    36 = STEM Tutoring
    37 = Career Advice
    38 = Fitness Planning
    39 = Diet & Meals
    40 = Travel
    41 = Mental Health
    42 = Personal Finance
    43 = Cooking
    44 = UI/UX Design
    45 = Logo & Branding
    46 = Photorealism
    47 = Illustration
    48 = 3D Rendering
    49 = Typography
    50 = Character Design
    99 = Miscellaneous

    Prompt Title: ${title}
    Prompt Description: ${description}
    Prompt Text: ${promptText}
    `;

    let finalCategoryId = null;

    // ==========================================
    // ATTEMPT 1: GOOGLE GEMINI (Primary)
    // ==========================================
    try {
      console.log("Attempting Google Gemini...");
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ]
        })
      });

      const data = await geminiRes.json();
      
      if (geminiRes.ok && data.candidates && data.candidates.length > 0) {
        const aiText = data.candidates[0].content.parts[0].text.trim();
        const match = aiText.match(/\d+/); 
        if (match) finalCategoryId = parseInt(match[0]);
        console.log("=== SUCCESS: Categorized by Gemini ===");
      } else {
        console.log("Gemini failed or was busy. Error:", data.error?.message || "Unknown error");
      }
    } catch (e) {
      console.log("Gemini fetch crashed:", e.message);
    }

    // ==========================================
    // ATTEMPT 2: GROQ FALLBACK (Meta Llama 3 - Free)
    // ==========================================
    if (!finalCategoryId) {
      console.log("Falling back to Groq (Llama 3)...");
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant", // Meta's fast, free open-source model
            messages: [{ role: "system", content: systemPrompt }],
            temperature: 0.0
          })
        });

        const groqData = await groqRes.json();

        if (groqRes.ok && groqData.choices && groqData.choices.length > 0) {
          const aiText = groqData.choices[0].message.content.trim();
          const match = aiText.match(/\d+/);
          if (match) finalCategoryId = parseInt(match[0]);
          console.log("=== SUCCESS: Categorized by Groq ===");
        } else {
          console.log("Groq failed. Error:", groqData.error?.message || "Unknown error");
        }
      } catch (e) {
        console.log("Groq fetch crashed:", e.message);
      }
    }

    // ==========================================
    // ATTEMPT 3: THE CATEGORY 99 SAFETY NET
    // ==========================================
    if (!finalCategoryId) {
      console.log("Both AIs failed. Using Category 99 fallback.");
      finalCategoryId = 99;
    }

    // ==========================================
    // NEW: GENERATE AI VECTOR (3072 Dimensions)
    // ==========================================
    let embedding = null;
    try {
      console.log("Generating Semantic Vector...");
      const textToEmbed = `${title} ${description} ${promptText}`;
      const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
      const embedResult = await embedModel.embedContent(textToEmbed);
      embedding = embedResult.embedding.values;
      console.log("=== SUCCESS: Vector Generated ===");
    } catch (embedError) {
      console.error("Failed to generate embedding:", embedError.message);
      // We don't throw here so the user can still save their prompt even if the embedding fails
    }

    // Return BOTH the category ID and the new AI brain mapping back to the frontend
    return NextResponse.json({ 
      categoryId: finalCategoryId,
      embedding: embedding 
    });

  } catch (error) {
    console.error('Fatal API Error:', error);
    return NextResponse.json({ categoryId: 99, embedding: null }); 
  }
}