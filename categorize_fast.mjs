import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CATEGORY_MAP = { 'writing': 1, 'coding': 2, 'business': 3, 'design': 4, 'education': 5, 'personal': 6, 'research': 7, 'marketing': 8 };

async function runFastCategorizer() {
  const { data: prompts } = await supabase.from('prompts')
  .select('id, title, description')
  .eq('category_id', 1);
  console.log(`🚀 Starting Groq categorization for ${prompts.length} prompts...`);

  // We process 10 at a time to stay under Groq's RPM limit while maximizing speed
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
    const batch = prompts.slice(i, i + BATCH_SIZE);
    
    try {
      const aiInstruction = `Return ONLY a JSON array of objects for these ${batch.length} prompts. 
      Categories: 1:writing, 2:coding, 3:business, 4:design, 5:education, 6:personal, 7:research, 8:marketing.
      Format: [{"id": "...", "catId": 2}]
      Data: ${JSON.stringify(batch.map(p => ({ id: p.id, t: p.title, d: p.description })))}`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: aiInstruction }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: "json_object" } // Ensures clean data
      });

      const results = JSON.parse(chatCompletion.choices[0].message.content).prompts || JSON.parse(chatCompletion.choices[0].message.content);
      const dataArray = Array.isArray(results) ? results : Object.values(results)[0];

      const updates = dataArray.map(item => 
        supabase.from('prompts').update({ category_id: item.catId || item.categoryId }).eq('id', item.id)
      );

      await Promise.all(updates);
      console.log(`✅ Progress: ${i + batch.length}/${prompts.length} prompts finished.`);
      
      // Groq is so fast we only need a tiny pause
      await new Promise(r => setTimeout(r, 1000)); 

    } catch (err) {
      console.error(`⚠️ Batch starting at ${i} failed. Skipping...`, err.message);
    }
  }
  console.log('🏁 All done!');
}

runFastCategorizer();