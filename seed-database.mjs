import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import csv from 'csv-parser'

const supabase = createClient(
  'https://hhjwtswrkcprljdvsrjg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoand0c3dya2NwcmxqZHZzcmpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMDc4NywiZXhwIjoyMDkyMDk2Nzg3fQ.CuYtea3hVOq-Gom3PNkIHNl8UNlvzTp6xHSkXILOBpg'
)

const CATEGORY_RULES = [
  { id: 11, keywords: ['web dev', 'html', 'css', 'javascript', 'react', 'frontend'] },
  { id: 12, keywords: ['backend', 'api', 'server', 'node', 'rest', 'graphql'] },
  { id: 13, keywords: ['python', 'django', 'flask', 'pandas', 'numpy'] },
  { id: 14, keywords: ['sql', 'database', 'query', 'mysql', 'postgres'] },
  { id: 15, keywords: ['debug', 'error', 'fix', 'bug', 'crash', 'issue'] },
  { id: 16, keywords: ['data analysis', 'analytics', 'dataset', 'visualization', 'chart'] },
  { id: 17, keywords: ['spreadsheet', 'excel', 'google sheets', 'formula'] },
  { id: 18, keywords: ['devops', 'docker', 'kubernetes', 'cloud', 'aws', 'deploy'] },
  { id: 19, keywords: ['security', 'cyber', 'hack', 'vulnerability', 'encryption'] },
  { id: 20, keywords: ['game', 'unity', 'unreal', 'gaming', 'player'] },
  { id: 1,  keywords: ['copy', 'copywriting', 'ad copy', 'headline', 'slogan'] },
  { id: 2,  keywords: ['blog', 'article', 'post', 'newsletter', 'publish'] },
  { id: 3,  keywords: ['story', 'fiction', 'creative', 'novel', 'poem', 'character'] },
  { id: 4,  keywords: ['email', 'inbox', 'reply', 'cold email', 'outreach'] },
  { id: 5,  keywords: ['social media', 'instagram', 'twitter', 'tiktok', 'linkedin', 'thread'] },
  { id: 6,  keywords: ['edit', 'proofread', 'grammar', 'improve', 'rewrite'] },
  { id: 7,  keywords: ['seo', 'keyword', 'search engine', 'ranking', 'traffic'] },
  { id: 8,  keywords: ['summarize', 'summary', 'tldr', 'brief', 'condense'] },
  { id: 9,  keywords: ['translate', 'translation', 'language', 'french', 'spanish', 'german'] },
  { id: 10, keywords: ['script', 'youtube', 'video', 'podcast', 'screenplay'] },
  { id: 21, keywords: ['marketing', 'campaign', 'brand', 'audience', 'promotion'] },
  { id: 22, keywords: ['sales', 'sell', 'pitch', 'prospect', 'deal', 'revenue'] },
  { id: 23, keywords: ['product', 'roadmap', 'feature', 'sprint', 'agile'] },
  { id: 24, keywords: ['hr', 'recruit', 'hire', 'job description', 'interview', 'candidate'] },
  { id: 25, keywords: ['customer', 'support', 'ticket', 'complaint', 'service'] },
  { id: 26, keywords: ['project', 'manage', 'timeline', 'milestone', 'deadline'] },
  { id: 27, keywords: ['finance', 'budget', 'invest', 'money', 'financial', 'accounting'] },
  { id: 28, keywords: ['legal', 'contract', 'law', 'agreement', 'clause', 'terms'] },
  { id: 29, keywords: ['meeting', 'agenda', 'minutes', 'standup', 'sync'] },
  { id: 30, keywords: ['presentation', 'slide', 'deck', 'powerpoint', 'pitch deck'] },
  { id: 31, keywords: ['lesson', 'teach', 'classroom', 'curriculum', 'educator'] },
  { id: 32, keywords: ['language learning', 'vocabulary', 'grammar', 'fluent', 'speak'] },
  { id: 33, keywords: ['research', 'academic', 'paper', 'study', 'literature review'] },
  { id: 34, keywords: ['quiz', 'test', 'exam', 'question', 'assessment'] },
  { id: 35, keywords: ['study guide', 'notes', 'revision', 'flashcard', 'memorize'] },
  { id: 36, keywords: ['math', 'science', 'stem', 'physics', 'chemistry', 'biology'] },
  { id: 37, keywords: ['career', 'resume', 'cv', 'cover letter', 'job search', 'interview'] },
  { id: 38, keywords: ['fitness', 'workout', 'exercise', 'gym', 'training', 'muscle'] },
  { id: 39, keywords: ['diet', 'meal', 'nutrition', 'calories', 'food plan', 'weight'] },
  { id: 40, keywords: ['travel', 'trip', 'itinerary', 'vacation', 'hotel', 'destination'] },
  { id: 41, keywords: ['mental health', 'anxiety', 'stress', 'therapy', 'mindfulness', 'wellbeing'] },
  { id: 42, keywords: ['personal finance', 'saving', 'debt', 'retirement', 'expense'] },
  { id: 43, keywords: ['cook', 'recipe', 'ingredient', 'kitchen', 'bake', 'dish'] },
  { id: 44, keywords: ['ui', 'ux', 'design', 'wireframe', 'prototype', 'figma', 'interface'] },
  { id: 45, keywords: ['logo', 'brand', 'identity', 'visual', 'color palette'] },
  { id: 46, keywords: ['photo', 'realistic', 'photorealism', 'photograph', 'camera'] },
  { id: 47, keywords: ['illustrat', 'draw', 'sketch', 'comic', 'cartoon', 'artwork'] },
  { id: 48, keywords: ['3d', 'render', 'blender', 'model', 'cgi'] },
  { id: 49, keywords: ['typography', 'font', 'typeface', 'lettering'] },
  { id: 50, keywords: ['character', 'persona', 'avatar', 'npc', 'roleplay'] },
]

function categorize(title, promptText) {
  const text = (title + ' ' + promptText).toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => text.includes(k))) return rule.id
  }
  return 3 // default: Creative Writing
}

function cleanTitle(raw) {
  return raw
    .replace(/^["']+|["']+$/g, '') // remove surrounding quotes
    .replace(/i want you to act as (an? )?/i, '')
    .replace(/act as (an? )?/i, '')
    .replace(/you are (an? )?/i, '')
    .replace(/["]/g, '') // remove all remaining quotes
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .slice(0, 100)
    .trim()
}

function guessAiTool(text) {
  const t = text.toLowerCase()
  if (t.includes('midjourney') || t.includes('dalle') || t.includes('stable diffusion')) return 'midjourney'
  if (t.includes('claude')) return 'claude'
  if (t.includes('gemini') || t.includes('bard')) return 'gemini'
  return 'chatgpt'
}

async function run() {
  const rows = []

  console.log('📖 Reading prompts.csv...')
  await new Promise((resolve, reject) => {
    fs.createReadStream('prompts.csv')
      .pipe(csv())
      .on('data', d => rows.push(d))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`✅ Loaded ${rows.length} rows. Processing...`)

  const prompts = rows
    .filter(r => {
  if (!r.prompt) return false
  if (r.prompt.length < 50) return false
  if (r.prompt.split(' ').length < 10) return false
  if ((r.prompt.match(/"/g) || []).length > 10) return false
  if (!r.act || r.act.length < 3) return false
  return true
})
    .map(r => {
      const title = cleanTitle(r.act || r.title || 'Untitled Prompt')
      const promptText = r.prompt.slice(0, 3000)
      const categoryId = categorize(title, promptText)
      const aiTool = guessAiTool(promptText)

      return {
        title,
        description: `A prompt to help you ${title.toLowerCase()}.`,
        prompt_text: promptText,
        ai_tool: aiTool,
        category_id: categoryId,
        tags: [],
        use_case: 'General use',
      }
    })

  console.log(`🧹 Cleaned ${prompts.length} prompts. Inserting into Supabase...`)

  const BATCH = 100
  let total = 0

  for (let i = 0; i < prompts.length; i += BATCH) {
    const chunk = prompts.slice(i, i + BATCH)
    const { error } = await supabase.from('prompts').insert(chunk)
    if (error) console.error(`❌ Batch ${i/BATCH + 1} failed:`, error.message)
    else {
      total += chunk.length
      console.log(`✅ Inserted ${total}/${prompts.length}`)
    }
  }

  console.log(`\n🎉 Done! Seeded ${total} prompts with proper categories.`)
}

run()