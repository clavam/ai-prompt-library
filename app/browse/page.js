'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const aiTools = ['All', 'claude', 'chatgpt', 'gemini', 'midjourney']
const toolColors = {
  claude: 'bg-orange-500/20 text-orange-300',
  chatgpt: 'bg-green-500/20 text-green-300',
  gemini: 'bg-blue-500/20 text-blue-300',
  midjourney: 'bg-pink-500/20 text-pink-300',
}

export default function BrowsePage() {
  const [prompts, setPrompts] = useState([])
  const [search, setSearch] = useState('')
  const [selectedTool, setSelectedTool] = useState('All')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    fetchPrompts()
  }, [search, selectedTool])

  async function fetchPrompts() {
    setLoading(true)
    let query = supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('title', `%${search}%`)
    if (selectedTool !== 'All') query = query.eq('ai_tool', selectedTool)

    const { data, error } = await query
    if (!error) setPrompts(data)
    setLoading(false)
  }

  function copyPrompt(e, text, id) {
    e.preventDefault() // stop link navigation
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-400">PromptVault</Link>
        <div className="flex gap-4 text-sm text-gray-400 items-center">
          <Link href="/browse" className="text-white font-medium">Browse</Link>
          <Link href="/submit" className="hover:text-white">Submit</Link>
          <Link href="/login" className="bg-violet-600 text-white px-4 py-1.5 rounded-full hover:bg-violet-500">Sign in</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Browse Prompts</h1>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500"
          />
          <div className="flex gap-2 flex-wrap">
            {aiTools.map(tool => (
              <button
                key={tool}
                onClick={() => setSelectedTool(tool)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                  selectedTool === tool
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {tool === 'All' ? 'All' : tool.charAt(0).toUpperCase() + tool.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Cards */}
        {loading ? (
          <div className="text-gray-500 text-center py-20">Loading prompts...</div>
        ) : prompts.length === 0 ? (
          <div className="text-gray-500 text-center py-20">No prompts found.</div>
        ) : (
          <div className="grid gap-4">
            {prompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompt/${prompt.id}`}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-violet-700 transition block"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-lg font-semibold">{prompt.title}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${toolColors[prompt.ai_tool] || 'bg-gray-700 text-gray-300'}`}>
                    {prompt.ai_tool}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">{prompt.description}</p>
                <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 font-mono mb-4 line-clamp-3">
                  {prompt.prompt_text}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {prompt.tags?.map(tag => (
                      <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">#{tag}</span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => copyPrompt(e, prompt.prompt_text, prompt.id)}
                    className="text-sm bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl transition shrink-0"
                  >
                    {copied === prompt.id ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}