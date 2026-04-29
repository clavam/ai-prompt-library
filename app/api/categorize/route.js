import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Receive the data from the frontend
    const { title, description, promptText } = await req.json();

    // 2. The strict instructions for Gemini with your exhaustive category list
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

    // 3. Make the secure request to Google Gemini (with Safety Filters disabled)
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
    
    // 4. Safe Extraction (Prevents the 'undefined' crash)
    console.log("=== FULL GEMINI RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));

    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini blocked the prompt or failed. Sending to 99.");
      return NextResponse.json({ categoryId: 99 });
    }

    const aiText = data.candidates[0].content.parts[0].text.trim();
    
    // Use regex to pull only the number, ignoring any extra words
    const match = aiText.match(/\d+/); 
    const categoryId = match ? parseInt(match[0]) : 99;

    console.log("=== CATEGORIZED AS:", categoryId, "===");

    // 5. Send the ID back to the frontend
    return NextResponse.json({ categoryId });

  } catch (error) {
    console.error('AI Categorization Error:', error);
    // If the API fails completely, still allow the prompt to submit as Miscellaneous
    return NextResponse.json({ categoryId: 99 }); 
  }
}