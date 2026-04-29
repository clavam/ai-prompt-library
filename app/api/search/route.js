import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// Initialize Google Gemini and Supabase
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Note: We create a fresh Supabase client here for the server
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const { searchQuery } = await req.json()

    if (!searchQuery) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // 1. Ask Gemini to turn the user's text into an AI Vector (768 numbers)
    // We use text-embedding-004, which is Google's latest embedding model
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent(searchQuery)
    const embedding = result.embedding.values

    // 2. Take those numbers and ask Supabase to find prompts with similar meaning
    const { data: prompts, error } = await supabase.rpc('match_prompts', {
      query_embedding: embedding,
      match_threshold: 0.3, // 0.3 means "somewhat related". Higher = stricter matching
      match_count: 12       // Return top 12 results
    })

    if (error) throw error

    return NextResponse.json({ prompts })
    
  } catch (error) {
    console.error('AI Search Error:', error)
    return NextResponse.json({ error: 'Failed to search prompts' }, { status: 500 })
  }
}