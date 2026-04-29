'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

const aiTools = ['All', 'claude', 'chatgpt', 'gemini', 'midjourney']
const toolColors = {
  claude: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  chatgpt: 'bg-green-500/20 text-green-300 border border-green-500/30',
  gemini: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  midjourney: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
}

// THE MASTER DIRECTORY: All 50 Categories with IDs
const ALL_CATEGORIES = [
  { id: 1, name: 'Copywriting', icon: '✍️' }, { id: 2, name: 'Blog & Articles', icon: '📝' }, { id: 3, name: 'Creative Writing', icon: '📖' }, { id: 4, name: 'Email Drafting', icon: '📧' }, { id: 5, name: 'Social Media', icon: '📱' },
  { id: 6, name: 'Editing & Proofing', icon: '🔍' }, { id: 7, name: 'SEO & Keywords', icon: '🎯' }, { id: 8, name: 'Summarization', icon: '✂️' }, { id: 9, name: 'Translation', icon: '🌍' }, { id: 10, name: 'Scriptwriting', icon: '🎬' },
  { id: 11, name: 'Web Dev', icon: '🌐' }, { id: 12, name: 'Backend & APIs', icon: '⚙️' }, { id: 13, name: 'Python Scripts', icon: '🐍' }, { id: 14, name: 'SQL & DBs', icon: '🗄️' }, { id: 15, name: 'Debugging', icon: '🐛' },
  { id: 16, name: 'Data Analysis', icon: '📊' }, { id: 17, name: 'Spreadsheets', icon: '📈' }, { id: 18, name: 'DevOps & Cloud', icon: '☁️' }, { id: 19, name: 'Cybersecurity', icon: '🔒' }, { id: 20, name: 'Game Dev', icon: '🎮' },
  { id: 21, name: 'Marketing', icon: '📣' }, { id: 22, name: 'Sales', icon: '🤝' }, { id: 23, name: 'Product Mgmt', icon: '📦' }, { id: 24, name: 'HR & Recruiting', icon: '👥' }, { id: 25, name: 'Customer Support', icon: '🎧' },
  { id: 26, name: 'Project Mgmt', icon: '📋' }, { id: 27, name: 'Finance', icon: '💰' }, { id: 28, name: 'Legal & Contracts', icon: '⚖️' }, { id: 29, name: 'Meetings', icon: '📅' }, { id: 30, name: 'Presentations', icon: '🖥️' },
  { id: 31, name: 'Lesson Planning', icon: '🍎' }, { id: 32, name: 'Language Learning', icon: '🗣️' }, { id: 33, name: 'Academic Research', icon: '🔬' }, { id: 34, name: 'Quizzes & Tests', icon: '✅' }, { id: 35, name: 'Study Guides', icon: '📚' },
  { id: 36, name: 'STEM Tutoring', icon: '🧮' }, { id: 37, name: 'Career Advice', icon: '💼' }, { id: 38, name: 'Fitness Planning', icon: '💪' }, { id: 39, name: 'Diet & Meals', icon: '🥗' }, { id: 40, name: 'Travel', icon: '✈️' },
  { id: 41, name: 'Mental Health', icon: '🧠' }, { id: 42, name: 'Personal Finance', icon: '🏦' }, { id: 43, name: 'Cooking', icon: '🍳' }, { id: 44, name: 'UI/UX Design', icon: '✨' }, { id: 45, name: 'Logo & Branding', icon: '🎨' },
  { id: 46, name: 'Photorealism', icon: '📸' }, { id: 47, name: 'Illustration', icon: '🖌️' }, { id: 48, name: '3D Rendering', icon: '🧊' }, { id: 49, name: 'Typography', icon: '🔤' }, { id: 50, name: 'Character Design', icon: '👽' }
]

function BrowseContent() {
  const searchParams = useSearchParams()
  
  // States
  const [viewMode, setViewMode] = useState('prompts') // 'prompts' or 'directory'
  const [search, setSearch] = useState(searchParams.get('q') || '') 
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '')
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedTool, setSelectedTool] = useState('All')
  
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

  // Pagination States
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const ITEMS_PER_PAGE = 20

  // Initial load check for URL parameters
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(decodeURIComponent(q))

    const catSlug = searchParams.get('category')
    if (catSlug) {
      const found = ALL_CATEGORIES.find(c => 
        c.name.toLowerCase().includes(catSlug.toLowerCase().split(' ')[0])
      )
      if (found) setSelectedCategoryId(found.id)
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedTool, selectedCategoryId])

  // Refetch when page or filters change
  useEffect(() => {
    if (viewMode === 'prompts') fetchPrompts()
  }, [debouncedSearch, selectedTool, selectedCategoryId, viewMode, page])

  async function fetchPrompts() {
    setLoading(true)
    
    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1
    
    let query = supabase
      .from('prompts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (debouncedSearch) query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`)
    if (selectedTool !== 'All') query = query.eq('ai_tool', selectedTool)
    if (selectedCategoryId) query = query.eq('category_id', selectedCategoryId)
    
    const { data, error, count } = await query
    
    if (!error && data) {
      setPrompts(data)
      setTotalCount(count || 0)
    } else {
      setPrompts([])
    }
    setLoading(false)
  }

  function copyPrompt(e, text, id) {
    e.preventDefault() 
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function selectCategory(id) {
    setSelectedCategoryId(id)
    setViewMode('prompts') // Switch back to prompt view to show results
  }

  const activeCategoryName = ALL_CATEGORIES.find(c => c.id === selectedCategoryId)?.name

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      
      {/* Top Controls: The Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Browse Vault</h1>
        
        <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setViewMode('prompts')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'prompts' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            All Prompts
          </button>
          <button
            onClick={() => setViewMode('directory')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'directory' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Categories (50)
          </button>
        </div>
      </div>

      {/* VIEW: CATEGORY DIRECTORY */}
      {viewMode === 'directory' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className="bg-gray-900 border border-gray-800 hover:border-violet-600 hover:bg-gray-800 rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 aspect-square"
            >
              <div className="text-3xl">{cat.icon}</div>
              <div className="text-sm font-medium text-gray-300">{cat.name}</div>
            </button>
          ))}
        </div>
      )}

      {/* VIEW: ALL PROMPTS */}
      {viewMode === 'prompts' && (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col gap-4 mb-8">
            <input
              type="text"
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 text-white"
            />
            
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {aiTools.map(tool => (
                  <button
                    key={tool}
                    onClick={() => setSelectedTool(tool)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                      selectedTool === tool ? 'bg-violet-600 border-violet-600 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tool === 'All' ? 'All Tools' : tool.charAt(0).toUpperCase() + tool.slice(1)}
                  </button>
                ))}
              </div>

              {/* Active Category Badge */}
              {selectedCategoryId && (
                <div className="flex items-center gap-2 bg-violet-900/30 border border-violet-700 text-violet-300 px-4 py-2 rounded-xl text-sm">
                  <span>Filtered by: <strong>{activeCategoryName}</strong></span>
                  <button onClick={() => setSelectedCategoryId(null)} className="hover:text-white ml-2 font-bold">&times;</button>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Cards */}
          {loading ? (
            <div className="text-gray-500 text-center py-20">Loading prompts...</div>
          ) : prompts.length === 0 ? (
            <div className="text-gray-500 text-center py-20 bg-gray-900 border border-gray-800 rounded-2xl border-dashed">
              No prompts found matching your criteria.
            </div>
          ) : (
            <div className="grid gap-4">
              {prompts.map((prompt) => (
                <Link key={prompt.id} href={`/prompt/${prompt.id}`} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-violet-700 transition block group relative">
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
                        <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full z-10 relative">#{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={(e) => copyPrompt(e, prompt.prompt_text, prompt.id)}
                      className="text-sm bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl transition shrink-0 z-10 relative text-white"
                    >
                      {copied === prompt.id ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination UI */}
          {!loading && totalCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white disabled:opacity-40 hover:border-violet-600 transition"
              >
                ← Previous
              </button>
              
              <span className="text-sm text-gray-400">
                Page {page} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
              </span>
              
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))}
                disabled={page === Math.ceil(totalCount / ITEMS_PER_PAGE)}
                className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white disabled:opacity-40 hover:border-violet-600 transition"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function BrowsePage() {
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/user/${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      
      {/* Navbar - Upgraded with User Search */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-6">
        
        {/* Logo */}
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent hidden sm:block shrink-0">
          PromptVault
        </Link>

        {/* The Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-auto">
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users (e.g. Rasesh)..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-gray-500 shadow-inner"
            />
            <button type="submit" className="hidden">Search</button>
          </div>
        </form>

        {/* Navigation Links */}
        <div className="flex gap-4 md:gap-6 text-sm items-center shrink-0">
          <Link href="/browse" className="text-white font-medium hidden md:block">Browse</Link>
          <Link href="/submit" className="text-gray-400 hover:text-white transition hidden md:block">Submit</Link>
          
          {user ? (
            <Link href="/profile" className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold ring-2 ring-white/10 cursor-pointer text-white">
              {user.email?.[0].toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className="bg-white text-black px-4 py-1.5 rounded-full font-semibold text-xs hover:bg-gray-200 transition">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading directory...</div>}>
        <BrowseContent />
      </Suspense>
    </main>
  )
}