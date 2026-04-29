'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const aiTools = ['claude', 'chatgpt', 'gemini', 'midjourney']

export default function SubmitPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [promptText, setPromptText] = useState('')
  const [aiTool, setAiTool] = useState('claude')
  const [useCase, setUseCase] = useState('')
  const [tags, setTags] = useState('')
  
  // Navbar Search State
  const [userSearchQuery, setUserSearchQuery] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setUser(session.user)
    })
  }, [router])

  async function handleSubmit() {
    if (!title || !promptText || !aiTool) {
      setError('Please fill in Title, Prompt, and AI Tool.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // 1. Ask the backend to categorize it AND generate the 3072-dimension Vector!
      const aiResponse = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, promptText })
      })
      
      const { categoryId, embedding } = await aiResponse.json()

      if (!embedding || embedding.length === 0) {
        console.warn("Warning: AI failed to generate vector embedding.")
      }

      // 2. Save everything to Supabase (including the AI brain mapping)
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)
      const { error: dbError } = await supabase.from('prompts').insert({
        title, 
        description, 
        prompt_text: promptText,
        ai_tool: aiTool, 
        category_id: categoryId, 
        use_case: useCase, 
        tags: tagsArray,
        user_id: user?.id || null,
        embedding: embedding // 🧠 Saved straight to the AI search index!
      })

      if (dbError) throw new Error(dbError.message)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSearch = (e) => {
    e.preventDefault()
    if (userSearchQuery.trim()) {
      router.push(`/user/${encodeURIComponent(userSearchQuery.trim())}`)
    }
  }

  if (success) return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-6 selection:bg-violet-500/30">
      <div className="w-24 h-24 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-4xl shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] animate-in zoom-in duration-500">
        🎉
      </div>
      <h1 className="text-4xl font-black tracking-tight mt-4">Prompt Secured!</h1>
      <p className="text-gray-400 text-lg">Your prompt has been analyzed, vectorized, and added to the vault.</p>
      <div className="flex gap-4 mt-4">
        <Link href="/browse" className="bg-white text-black hover:bg-gray-200 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95">
          Browse Prompts
        </Link>
        <button onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setPromptText(''); setTags(''); setUseCase('') }}
          className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 text-white">
          Submit Another
        </button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-violet-500/30">
      
      {/* Upgraded Premium Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent hidden sm:block shrink-0">
          PromptVault
        </Link>

        {/* Global Search */}
        <form onSubmit={handleUserSearch} className="flex-1 max-w-lg mx-auto">
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-gray-500 shadow-inner"
            />
            <button type="submit" className="hidden">Search</button>
          </div>
        </form>

        <div className="flex gap-4 md:gap-6 text-sm items-center shrink-0">
          <Link href="/browse" className="text-gray-400 hover:text-white transition hidden md:block">Browse</Link>
          <Link href="/submit" className="text-white font-medium hidden md:block">Submit</Link>
          {user ? (
            <Link href="/profile" className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold ring-2 ring-white/10 text-white hover:scale-105 transition-transform" title="View Profile">
              {user.email?.[0].toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className="bg-white text-black px-4 py-1.5 rounded-full font-semibold text-xs hover:bg-gray-200 transition">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-3 tracking-tight">Submit a Prompt</h1>
          <p className="text-gray-400 text-lg">Share a prompt that's worked well for you. Our AI will automatically categorize and index it.</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col gap-6">
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Title <span className="text-violet-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write a Cold Email That Gets Replies"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-violet-500 transition-all text-white placeholder-gray-600" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Short Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly explain what this prompt does..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-violet-500 transition-all text-white placeholder-gray-600" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Prompt <span className="text-violet-500">*</span></label>
            <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste your full prompt here. Use [brackets] for variables you want others to fill in."
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-violet-500 transition-all text-white placeholder-gray-600 resize-none font-mono leading-relaxed custom-scrollbar" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">AI Tool <span className="text-violet-500">*</span></label>
              <select value={aiTool} onChange={(e) => setAiTool(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-violet-500 transition-all text-white appearance-none cursor-pointer">
                {aiTools.map(tool => (
                  <option key={tool} value={tool} className="bg-gray-900">{tool.charAt(0).toUpperCase() + tool.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Use Case</label>
              <input type="text" value={useCase} onChange={(e) => setUseCase(e.target.value)}
                placeholder="e.g. Sales, Marketing"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-violet-500 transition-all text-white placeholder-gray-600" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Tags <span className="text-gray-600 normal-case font-medium tracking-normal">(comma separated)</span></label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. email, b2b, outreach"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-violet-500 transition-all text-white placeholder-gray-600" />
          </div>

          {error && (
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold px-5 py-4 rounded-2xl">
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-4 mt-2 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all active:scale-95 text-white shadow-[0_0_30px_-10px_rgba(139,92,246,0.4)]">
            {loading ? 'Analyzing & Indexing...' : 'Submit to Vault'}
          </button>
        </div>
      </div>
    </main>
  )
}