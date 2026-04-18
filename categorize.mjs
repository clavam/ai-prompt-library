import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// We tell the model to strictly return JSON data so our code can read it perfectly
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: "application/json" }
});

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function runBulkCategorizer() {
  console.log('Fetching prompts from Supabase...');
  
  // Fetching all prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, title, description, category_id'); 

  if (error) {
    console.error('Failed to fetch prompts:', error);
    return;
  }

  console.log(`Found ${prompts.length} total prompts.`);

  // 1. SET THE BATCH SIZE (20 is the sweet spot for speed and accuracy)
  const BATCH_SIZE = 20;
  
  for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
    const batch = prompts.slice(i, i + BATCH_SIZE);
    let success = false;

    while (!success) {
      try {
        console.log(`\n⏳ Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(prompts.length / BATCH_SIZE)}...`);

        // 2. Prepare the data for the AI
        const batchData = batch.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description
        }));

        // 3. Write the Bulk AI Instruction
        const aiInstruction = `
          You are a data categorization assistant. I am giving you an array of ${batch.length} AI prompts.
          
          Map EVERY prompt to exactly one of these category IDs:
          1 = writing
          2 = coding
          3 = business
          4 = design
          5 = education
          6 = personal
          7 = research
          8 = marketing

          Return ONLY a valid JSON array of objects. Each object must have the 'id' of the prompt and the assigned 'categoryId' (as a number).
          Example format: [{"id": "uuid-here", "categoryId": 2}, {"id": "uuid-here", "categoryId": 8}]
          
          Data to categorize:
          ${JSON.stringify(batchData)}
        `;

        // 4. Send the batch to Gemini
        const result = await model.generateContent(aiInstruction);
        const jsonResponse = JSON.parse(result.response.text());

        // 5. Bulk Update Supabase (runs all 20 updates simultaneously)
        const updatePromises = jsonResponse.map(item => 
          supabase
            .from('prompts')
            .update({ category_id: item.categoryId })
            .eq('id', item.id)
        );

        await Promise.all(updatePromises);
        
        console.log(`✅ Successfully categorized and saved ${jsonResponse.length} prompts!`);

        success = true; 
        
        // Wait 4 seconds between batches to respect API limits
        await delay(4000); 

      } catch (err) {
        if (err.message.includes('429') || err.message.includes('Quota')) {
          console.log(`🚦 Rate limit hit! Taking a 15-second breather...`);
          await delay(15000); 
        } else {
          console.error(`❌ Error parsing JSON or updating DB for this batch:`, err.message);
          success = true; // Skip this batch if it's a hard crash so the whole script doesn't die
        }
      }
    }
  }
  
  console.log('\n🎉 ALL DONE! Your entire database is now fully categorized.');
}

runBulkCategorizer();