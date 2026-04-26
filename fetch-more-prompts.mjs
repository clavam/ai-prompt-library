import { createClient } from '@supabase/supabase-js'
import https from 'https'

const supabase = createClient(
  'https://hhjwtswrkcprljdvsrjg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoand0c3dya2NwcmxqZHZzcmpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMDc4NywiZXhwIjoyMDkyMDk2Nzg3fQ.CuYtea3hVOq-Gom3PNkIHNl8UNlvzTp6xHSkXILOBpg'
)

const CATEGORY_RULES = [
  { id: 11, keywords: ['web dev', 'html', 'css', 'javascript', 'react', 'frontend'] },
  { id: 12, keywords: ['backend', 'api', 'server', 'node', 'rest', 'graphql'] },
  { id: 13, keywords: ['python', 'django', 'flask', 'pandas', 'numpy'] },
  { id: 14, keywords: ['sql', 'database', 'query', 'mysql', 'postgres'] },
  { id: 15, keywords: ['debug', 'error', 'fix', 'bug', 'crash'] },
  { id: 16, keywords: ['data analysis', 'analytics', 'dataset', 'visualization'] },
  { id: 18, keywords: ['devops', 'docker', 'kubernetes', 'cloud', 'aws'] },
  { id: 19, keywords: ['security', 'cyber', 'hack', 'vulnerability'] },
  { id: 1,  keywords: ['copy', 'copywriting', 'headline', 'slogan'] },
  { id: 2,  keywords: ['blog', 'article', 'newsletter'] },
  { id: 3,  keywords: ['story', 'fiction', 'creative', 'novel', 'poem'] },
  { id: 4,  keywords: ['email', 'cold email', 'outreach'] },
  { id: 5,  keywords: ['social media', 'instagram', 'twitter', 'linkedin'] },
  { id: 7,  keywords: ['seo', 'keyword', 'search engine'] },
  { id: 8,  keywords: ['summarize', 'summary', 'tldr'] },
  { id: 9,  keywords: ['translate', 'translation', 'language'] },
  { id: 10, keywords: ['script', 'youtube', 'video', 'podcast'] },
  { id: 21, keywords: ['marketing', 'campaign', 'brand'] },
  { id: 22, keywords: ['sales', 'sell', 'pitch', 'prospect'] },
  { id: 24, keywords: ['hr', 'recruit', 'hire', 'job description'] },
  { id: 25, keywords: ['customer', 'support', 'ticket', 'complaint'] },
  { id: 27, keywords: ['finance', 'budget', 'invest', 'money'] },
  { id: 28, keywords: ['legal', 'contract', 'law', 'agreement'] },
  { id: 30, keywords: ['presentation', 'slide', 'deck', 'powerpoint'] },
  { id: 31, keywords: ['lesson', 'teach', 'classroom', 'curriculum'] },
  { id: 33, keywords: ['research', 'academic', 'paper', 'study'] },
  { id: 37, keywords: ['career', 'resume', 'cv', 'cover letter'] },
  { id: 38, keywords: ['fitness', 'workout', 'exercise', 'gym'] },
  { id: 39, keywords: ['diet', 'meal', 'nutrition', 'calories'] },
  { id: 40, keywords: ['travel', 'trip', 'itinerary', 'vacation'] },
  { id: 41, keywords: ['mental health', 'anxiety', 'stress', 'mindfulness'] },
  { id: 43, keywords: ['cook', 'recipe', 'ingredient', 'bake'] },
  { id: 44, keywords: ['ui', 'ux', 'design', 'wireframe', 'figma'] },
  { id: 50, keywords: ['character', 'persona', 'roleplay'] },
]

function categorize(title, promptText) {
  const text = (title + ' ' + promptText).toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => text.includes(k))) return rule.id
  }
  return 3
}

function cleanTitle(raw) {
  return (raw || '')
    .replace(/^["']+|["']+$/g, '')
    .replace(/i want you to act as (an? )?/i, '')
    .replace(/act as (an? )?/i, '')
    .replace(/you are (an? )?/i, '')
    .replace(/["]/g, '')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .slice(0, 100)
    .trim()
}

function guessAiTool(text) {
  const t = (text || '').toLowerCase()
  if (t.includes('midjourney') || t.includes('dalle')) return 'midjourney'
  if (t.includes('claude')) return 'claude'
  if (t.includes('gemini') || t.includes('bard')) return 'gemini'
  return 'chatgpt'
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject)
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function getExistingTitles() {
  const { data } = await supabase.from('prompts').select('title')
  return new Set((data || []).map(p => p.title.toLowerCase()))
}

async function run() {
  console.log('📚 Fetching existing titles...')
  const existingTitles = await getExistingTitles()
  console.log(`Found ${existingTitles.size} existing prompts`)

  let allRows = []

  // Source 1: abilzerian LLM Prompt Library (JSON)
  console.log('\n⬇️ Fetching abilzerian/LLM-Prompt-Library...')
  try {
    const data = await fetchUrl('https://raw.githubusercontent.com/abilzerian/LLM-Prompt-Library/main/prompts/prompt_list.json')
    const json = JSON.parse(data)
    const rows = json
      .filter(p => p.prompt && p.prompt.length > 50)
      .map(p => ({ act: p.name || p.title || 'Prompt', prompt: p.prompt }))
    console.log(`✅ Got ${rows.length} rows`)
    allRows = [...allRows, ...rows]
  } catch (err) {
    console.error('❌ Failed:', err.message)
  }

  // Source 2: kushalanand prompts (JSON)
  console.log('\n⬇️ Fetching kushalanand/prompts...')
  try {
    const data = await fetchUrl('https://raw.githubusercontent.com/kushalanand/prompts/main/prompts.json')
    const json = JSON.parse(data)
    const rows = Array.isArray(json)
      ? json.filter(p => p.prompt && p.prompt.length > 50).map(p => ({ act: p.title || p.name || 'Prompt', prompt: p.prompt }))
      : []
    console.log(`✅ Got ${rows.length} rows`)
    allRows = [...allRows, ...rows]
  } catch (err) {
    console.error('❌ Failed:', err.message)
  }

  // Source 3: linexjlin GPTs system prompts (JSON)
  console.log('\n⬇️ Fetching linexjlin/GPTs...')
  try {
    const data = await fetchUrl('https://raw.githubusercontent.com/linexjlin/GPTs/main/README.md')
    const matches = data.match(/###\s+(.+?)\n[\s\S]*?```\n([\s\S]+?)```/g) || []
    const rows = matches
      .map(block => {
        const titleMatch = block.match(/###\s+(.+?)\n/)
        const promptMatch = block.match(/```\n([\s\S]+?)```/)
        return {
          act: titleMatch?.[1]?.trim() || 'GPT Prompt',
          prompt: promptMatch?.[1]?.trim() || ''
        }
      })
      .filter(r => r.prompt.length > 50)
    console.log(`✅ Got ${rows.length} rows`)
    allRows = [...allRows, ...rows]
  } catch (err) {
    console.error('❌ Failed:', err.message)
  }

  console.log(`\n🧹 Processing ${allRows.length} total rows...`)

  const prompts = allRows
    .filter(r => {
      if (!r.prompt || r.prompt.length < 50) return false
      if (r.prompt.split(' ').length < 10) return false
      const title = cleanTitle(r.act)
      return !existingTitles.has(title.toLowerCase())
    })
    .map(r => {
      const title = cleanTitle(r.act)
      const promptText = r.prompt.slice(0, 3000)
      return {
        title,
        description: `A prompt to help you ${title.toLowerCase()}.`,
        prompt_text: promptText,
        ai_tool: guessAiTool(promptText),
        category_id: categorize(title, promptText),
        tags: [],
        use_case: 'General use',
      }
    })

  console.log(`🆕 ${prompts.length} new unique prompts to insert`)

  const BATCH = 100
  let total = 0

  for (let i = 0; i < prompts.length; i += BATCH) {
    const chunk = prompts.slice(i, i + BATCH)
    const { error } = await supabase.from('prompts').insert(chunk)
    if (error) console.error(`❌ Batch ${Math.floor(i/BATCH) + 1} failed:`, error.message)
    else {
      total += chunk.length
      console.log(`✅ Inserted ${total}/${prompts.length}`)
    }
  }

  console.log(`\n🎉 Done! Added ${total} new prompts!`)
}

run()