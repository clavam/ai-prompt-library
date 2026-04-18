import { NextResponse } from 'next/server'

export async function POST(request) {
  const { promptText, title, category } = await request.json()

  const geminiPrompt = `You are an expert at writing AI prompts. Analyze this prompt and respond ONLY with a valid JSON object. No markdown, no backticks, no explanation, just raw JSON.

Title: ${title}
Category: ${category}
Prompt: ${promptText}

Respond with exactly this structure:
{
  "quality_score": 7,
  "quality_feedback": "One sentence about the prompt quality",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "improved_prompt": "An improved version of the prompt"
}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_GEMINI_KEY_HERE`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      }
    )

    const data = await response.json()
    console.log('Gemini raw response:', JSON.stringify(data))

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    console.log('Gemini text:', text)

    if (!text) throw new Error('No text in response')

    // Strip any markdown code blocks if present
    const clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const result = JSON.parse(clean)
    return NextResponse.json(result)

  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}