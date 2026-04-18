// categorize-prompts.mjs
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURATION START ---
// The URL is already set for you. 
const supabaseUrl = 'https://hhjwtswrkcprljdvsrjg.supabase.co';

// PASTE YOUR SECRET SERVICE ROLE KEY BETWEEN THE QUOTES BELOW:
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoand0c3dya2NwcmxqZHZzcmpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMDc4NywiZXhwIjoyMDkyMDk2Nzg3fQ.CuYtea3hVOq-Gom3PNkIHNl8UNlvzTp6xHSkXILOBpg'; 
// --- CONFIGURATION END ---

const supabase = createClient(supabaseUrl, supabaseKey)

const rules = [
  { id: 2, keywords: ['code', 'programming', 'developer', 'software', 'debug', 'function', 'python', 'javascript', 'sql', 'linux', 'terminal', 'git', 'api', 'database', 'script'] },
  { id: 3, keywords: ['business', 'startup', 'marketing plan', 'strategy', 'pitch', 'investor', 'revenue', 'sales', 'product', 'entrepreneur', 'company'] },
  { id: 4, keywords: ['design', 'midjourney', 'image', 'logo', 'ui', 'ux', 'visual', 'art', 'draw', 'illustration', 'graphic', 'color', 'dalle'] },
  { id: 5, keywords: ['teach', 'lesson', 'education', 'learn', 'student', 'explain', 'tutor', 'quiz', 'study', 'course', 'school', 'academic'] },
  { id: 6, keywords: ['journal', 'personal', 'self', 'mental', 'mood', 'habit', 'motivation', 'life', 'goal', 'reflect', 'diary', 'anxiety', 'health'] },
  { id: 7, keywords: ['research', 'analyze', 'summary', 'report', 'data', 'study', 'paper', 'academic', 'science', 'fact', 'evidence', 'review'] },
  { id: 8, keywords: ['marketing', 'advertis', 'campaign', 'brand', 'social media', 'seo', 'email', 'content', 'audience', 'instagram', 'twitter', 'linkedin'] },
  { id: 1, keywords: ['write', 'essay', 'blog', 'story', 'poem', 'creative', 'author', 'novel', 'script', 'copywrite', 'article', 'letter'] },
]

function categorize(title, promptText) {
  const text = (title + ' ' + (promptText || '')).toLowerCase()
  for (const rule of rules) {
    if (rule.keywords.some(k => text.includes(k))) {
      return rule.id
    }
  }
  return 1 
}

async function run() {
  console.log('🚀 Starting keyword categorization...')
  
  let from = 0
  const batchSize = 100 
  let totalUpdated = 0

  while (true) {
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, prompt_text')
      .range(from, from + batchSize - 1)

    if (error) { 
      console.error('❌ Error fetching data:', error.message)
      break 
    }
    
    if (!data || data.length === 0) break

    const updates = data.map(async (prompt) => {
      const categoryId = categorize(prompt.title, prompt.prompt_text)
      
      const { error: updateError } = await supabase
        .from('prompts')
        .update({ category_id: categoryId })
        .eq('id', prompt.id)

      if (!updateError) totalUpdated++
    })

    await Promise.all(updates)
    console.log(`✅ Progress: Checked ${from + data.length} prompts...`)
    
    from += batchSize
    if (data.length < batchSize) break
  }

  console.log(`\n🎉 FINISHED! Total prompts updated: ${totalUpdated}`)
}

run()