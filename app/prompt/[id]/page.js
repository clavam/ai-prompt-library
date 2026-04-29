'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const toolColors = {
  claude: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  chatgpt: 'bg-green-500/10 text-green-400 border border-green-500/20',
  gemini: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  midjourney: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
}

const toolLinks = {
  claude: 'https://claude.ai',
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  midjourney: 'https://www.midjourney.com',
}

export default function PromptPage() {
  const { id } = useParams()
  const router = useRouter()
  
  // Existing States
  const [prompt, setPrompt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState(null)
  
  // Upvote States
  const [upvoted, setUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)
  const [isVoting, setIsVoting] = useState(false) // NEW: The spam-click lock

  // Collections States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [collections, setCollections] = useState([])
  const [newCollectionName, setNewCollectionName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    fetchPrompt()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [id])

  // Check if the user already upvoted this prompt
  useEffect(() => {
    if (user && id) checkUserVote()
  }, [user, id])

  async function checkUserVote() {
    const { data } = await supabase
      .from('votes')
      .select('id')
      .eq('prompt_id', id)
      .eq('user_id', user.id)
      .single()

    if (data) setUpvoted(true)
  }

  async function fetchPrompt() {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) router.push('/browse')
    else {
      setPrompt(data)
      setUpvoteCount(data.upvotes || 0)
      await supabase
        .from('prompts')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id)
    }
    setLoading(false)
  }

  // BULLETPROOF UPVOTE LOGIC
  async function handleUpvote() {
    if (!user) { router.push('/login'); return }
    if (isVoting) return // Drops extra clicks if it's already processing
    
    setIsVoting(true) // Lock the button

    // SCENARIO 1: REMOVING AN UPVOTE
    if (upvoted) {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('prompt_id', id)
        .eq('user_id', user.id)

      if (!error) {
        // Safety net: Math.max ensures it NEVER goes below 0
        const safeCount = Math.max(0, upvoteCount - 1) 
        await supabase.from('prompts').update({ upvotes: safeCount }).eq('id', id)
        setUpvoteCount(safeCount)
        setUpvoted(false)
      }
      setIsVoting(false) // Unlock
      return
    }

    // SCENARIO 2: ADDING AN UPVOTE
    const { error } = await supabase
      .from('votes')
      .insert({ user_id: user.id, prompt_id: id })

    if (!error) {
      const newCount = upvoteCount + 1
      await supabase.from('prompts').update({ upvotes: newCount }).eq('id', id)
      setUpvoteCount(newCount)
      setUpvoted(true)
    }
    setIsVoting(false) // Unlock
  }

  function copyPrompt() {
    navigator.clipboard.writeText(prompt.prompt_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // --- COLLECTIONS LOGIC ---
  async function handleOpenSaveModal() {
    if (!user) { 
      router.push('/login')
      return 
    }
    setIsModalOpen(true)
    setSaveMessage('')
    
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      
    if (data) setCollections(data)
  }

  async function saveToCollection(collectionId) {
    setIsSaving(true)
    setSaveMessage('')

    const { error } = await supabase
      .from('collection_items')
      .insert({ collection_id: collectionId, prompt_id: id })

    setIsSaving(false)

    if (error) {
      if (error.code === '23505') {
        setSaveMessage('Already saved in this collection!')
      } else {
        setSaveMessage('Failed to save. Try again.')
      }
    } else {
      setSaveMessage('✅ Saved successfully!')
      setTimeout(() => setIsModalOpen(false), 1500) 
    }
  }

  async function handleCreateCollection(e) {
    e.preventDefault()
    if (!newCollectionName.trim()) return
    
    setIsSaving(true)
    
    const { data: newCol, error: createError } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: newCollectionName.trim() })
      .select()
      .single()

    if (newCol) {
      setCollections([newCol, ...collections])
      setNewCollectionName('')
      await saveToCollection(newCol.id)
    } else {
      setIsSaving(false)
      setSaveMessage('Failed to create collection.')
      console.error("SUPABASE CREATE ERROR:", createError) 
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
      <div className="text-gray-500 animate-pulse">Loading prompt...</div>
    </main>
  )

  if (!prompt) return null

  return (
    <main className="min-h-screen bg-[#050505] text-white relative selection:bg-violet-500/30">
      
      {/* Upgraded Navbar */}
      <nav className="border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">PromptVault</Link>
        <div className="flex gap-4 text-sm text-gray-400 items-center">
          <Link href="/browse" className="hover:text-white transition">Browse</Link>
          <Link href="/submit" className="hover:text-white transition">Submit</Link>
          {user ? (
            <Link href="/profile" className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold ring-2 ring-white/10 text-white hover:scale-105 transition-transform">
              {user.email?.[0].toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className="bg-white text-black px-4 py-1.5 rounded-full hover:bg-gray-200 transition font-semibold">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/browse" className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-2 mb-8 transition group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Browse
        </Link>

        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{prompt.title}</h1>
          <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase tracking-wider shrink-0 ${toolColors[prompt.ai_tool] || 'bg-white/5 text-gray-400 border border-white/10'}`}>
            {prompt.ai_tool}
          </span>
        </div>

        {prompt.description && (
          <p className="text-gray-400 text-lg mb-6 leading-relaxed">{prompt.description}</p>
        )}

        <div className="flex gap-6 text-sm text-gray-500 font-bold mb-8 border-b border-white/5 pb-8">
          <span>👁 {prompt.views || 0} VIEWS</span>
          <span>👍 {upvoteCount} UPVOTES</span>
          {prompt.use_case && <span>🎯 {prompt.use_case.toUpperCase()}</span>}
        </div>

        <div className={`relative group transition-all duration-500 rounded-3xl border ${copied ? 'border-violet-500 shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)]' : 'border-white/10 bg-white/[0.02]'} p-1 mb-8`}>
          <div className="bg-[#0a0a0a] rounded-[22px] p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs text-gray-500 font-black uppercase tracking-widest">Source Text</span>
              <button
                onClick={copyPrompt}
                className={`text-xs px-5 py-2.5 rounded-xl transition-all font-bold active:scale-95 ${copied ? 'bg-green-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
              >
                {copied ? '✅ COPIED!' : '📋 COPY PROMPT'}
              </button>
            </div>
            <pre className="text-gray-200 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {prompt.prompt_text}
            </pre>
          </div>
        </div>

        {prompt.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            {prompt.tags.map(tag => (
              <span key={tag} className="text-xs font-bold bg-white/5 text-gray-400 px-3 py-1.5 rounded-lg border border-white/5">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleUpvote}
            disabled={isVoting}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              upvoted
                ? 'bg-violet-600 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
            }`}
          >
            {isVoting ? '⏳' : '👍'} {upvoted ? 'UPVOTED' : 'UPVOTE'} <span className="opacity-50">|</span> {upvoteCount}
          </button>

          <button
            onClick={handleOpenSaveModal}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
          >
            🔖 SAVE TO VAULT
          </button>
          
          <a href={toolLinks[prompt.ai_tool] || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ml-auto"
          >
            OPEN IN {prompt.ai_tool.toUpperCase()} ↗
          </a>
        </div>
      </div>

      {/* Collections Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#0f0f0f] border border-white/10 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Save to Collection</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-xl transition">
                &times;
              </button>
            </div>

            <div className="p-6">
              {saveMessage && (
                <div className={`text-sm font-bold mb-4 p-3 rounded-xl ${saveMessage.includes('✅') ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {saveMessage}
                </div>
              )}

              <div className="max-h-60 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                {collections.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4 font-medium">You don't have any collections yet.</p>
                ) : (
                  <div className="space-y-2">
                    {collections.map(col => (
                      <button
                        key={col.id}
                        onClick={() => saveToCollection(col.id)}
                        disabled={isSaving}
                        className="w-full group text-left px-4 py-4 bg-white/5 hover:bg-violet-600 rounded-2xl text-sm font-bold transition-all flex justify-between items-center"
                      >
                        {col.name}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">ADD +</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleCreateCollection} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New collection name..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={isSaving || !newCollectionName.trim()}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                >
                  CREATE
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </main>
  )
}