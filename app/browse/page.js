'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const aiTools = ['All', 'claude', 'chatgpt', 'gemini', 'midjourney']
const toolColors = {
  claude: 'bg-orange-500/20 text-orange-300',
  chatgpt: 'bg-green-500/20 text-green-300',
  gemini: 'bg-blue-500/20 text-blue-300',
  midjourney: 'bg-pink-500/20 text-pink-300',
}

const categories = ['All', 'writing', 'coding', 'business', 'design', 'education', 'personal', 'research', 'marketing']

// 1. ADDED THIS: The translation map for your new database IDs
const categoryMap = {
  'writing': 1,
  'coding': 2,
  'business': 3,
  'design': 4,
  'education': 5,
  'personal': 6,
  'research': 7,
  'marketing': 8
}

function BrowseContent() {
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All')
  const [selectedTool, setSelectedTool] = useState('All')
  
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    fetchPrompts()
  }, [search, selectedTool, selectedCategory])

  async function fetchPrompts() {
    setLoading(true)
    let query = supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('title', `%${search}%`)
    if (selectedTool !== 'All') query = query.eq('ai_tool', selectedTool)
    
    if (selectedCategory !== 'All') {
      const categoryId = categoryMap[selectedCategory.toLowerCase()]
      
      // DETECTIVE LOG 1: What is it searching for?
      console.log(`🔎 User clicked: ${selectedCategory} | Converted to ID: ${categoryId}`)
      
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }
    }

    const { data, error } = await query
    
    // DETECTIVE LOG 2: What did Supabase say back?
    if (error) console.error("🚨 SUPABASE ERROR:", error)
    console.log(`📦 Data found:`, data)

    if (!error && data) {
      setPrompts(data)
    } else {
      setPrompts([])
    }
    setLoading(false)
  }

  function copyPrompt(e, text, id) {
    e.preventDefault() 
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Browse Prompts</h1>

      {/* Search + Filters */}
      <div className="flex flex-col gap-4 mb-8">
        
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500"
        />
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* AI Tool Filter */}
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
                {tool === 'All' ? 'All Tools' : tool.charAt(0).toUpperCase() + tool.slice(1)}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 text-sm outline-none focus:border-violet-500 cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt Cards */}
      {loading ? (
        <div className="text-gray-500 text-center py-20">Loading prompts...</div>
      ) : prompts.length === 0 ? (
        <div className="text-gray-500 text-center py-20">No prompts found matching your criteria.</div>
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
                <span className={`text-xs px-3 py-1 rounded-full shrink-0 ${toolColors[prompt.ai_tool] || 'bg-gray-700 text-gray-300'}`}>
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
  )
}

// Main Page Component
export default function BrowsePage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if the user is logged in when the page loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-400">PromptVault</Link>
        <div className="flex gap-4 text-sm text-gray-400 items-center">
          <Link href="/browse" className="text-white font-medium">Browse</Link>
          <Link href="/submit" className="hover:text-white">Submit</Link>
          
          {/* THE SMART PROFILE LINK */}
          {user ? (
            <Link href="/profile" className="bg-gray-800 text-violet-300 px-4 py-1.5 rounded-full font-medium hover:bg-gray-700 hover:text-white transition">
              {user.user_metadata?.username || user.email.split('@')[0]}
            </Link>
          ) : (
            <Link href="/login" className="bg-violet-600 text-white px-4 py-1.5 rounded-full hover:bg-violet-500">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Next.js requires components using useSearchParams to be wrapped in a Suspense boundary */}
      <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading directory...</div>}>
        <BrowseContent />
      </Suspense>
    </main>
  )
}