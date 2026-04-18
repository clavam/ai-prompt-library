import https from 'https'
import fs from 'fs'

const url = 'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv'

https.get(url, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    const lines = data.split('\n').slice(1) // skip header
    const values = []

    lines.forEach(line => {
      if (!line.trim()) return

      // Find first comma to split act and prompt
      const firstComma = line.indexOf(',')
      if (firstComma === -1) return

      let title = line.slice(0, firstComma).replace(/^"|"$/g, '').trim()
      let rest = line.slice(firstComma + 1)

      // Get prompt text (second field)
      const secondComma = rest.indexOf(',')
      let promptText = secondComma > -1 ? rest.slice(0, secondComma) : rest
      promptText = promptText.replace(/^"|"$/g, '').trim()

      if (!title || !promptText || promptText.length < 20) return

      title = title.replace(/'/g, "''").slice(0, 150)
      promptText = promptText.replace(/'/g, "''").slice(0, 3000)

      values.push(`('${title}', 'From awesome-chatgpt-prompts community collection', '${promptText}', 'chatgpt', 1, ARRAY['community', 'chatgpt', 'prompts'], 'General use')`)
    })

    const sql = `insert into prompts (title, description, prompt_text, ai_tool, category_id, tags, use_case) values\n` + values.join(',\n') + ';'
    fs.writeFileSync('prompts.sql', sql)
    console.log(`✅ Done! Generated ${values.length} prompts in prompts.sql`)
  })
}).on('error', (e) => console.error('Error:', e))