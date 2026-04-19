'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const toolColors = {
  claude: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  chatgpt: 'bg-green-500/20 text-green-300 border-green-500/30',
  gemini: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  midjourney: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
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
  const [upvoted, setUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)

  // NEW: Collections States
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

  async function handleUpvote() {
    if (!user) { router.push('/login'); return }
    if (upvoted) return

    const { error } = await supabase
      .from('votes')
      .insert({ user_id: user.id, prompt_id: id })

    if (!error) {
      await supabase
        .from('prompts')
        .update({ upvotes: upvoteCount + 1 })
        .eq('id', id)
      setUpvoteCount(prev => prev + 1)
      setUpvoted(true)
    }
  }

  function copyPrompt() {
    navigator.clipboard.writeText(prompt.prompt_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // --- NEW: COLLECTIONS LOGIC ---

  // 1. Open Modal & Fetch User's Folders
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

  // 2. Save prompt to an existing folder
  async function saveToCollection(collectionId) {
    setIsSaving(true)
    setSaveMessage('')

    const { error } = await supabase
      .from('collection_items')
      .insert({ collection_id: collectionId, prompt_id: id })

    setIsSaving(false)

    if (error) {
      // 23505 is the standard SQL error code for "Unique constraint violation" (already saved)
      if (error.code === '23505') {
        setSaveMessage('Already saved in this collection!')
      } else {
        setSaveMessage('Failed to save. Try again.')
      }
    } else {
      setSaveMessage('✅ Saved successfully!')
      setTimeout(() => setIsModalOpen(false), 1500) // Close modal after success
    }
  }

  // 3. Create a new folder and immediately save the prompt to it
  async function handleCreateCollection(e) {
    e.preventDefault()
    if (!newCollectionName.trim()) return
    
    setIsSaving(true)
    
    // Create the collection
    const { data: newCol, error: createError } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: newCollectionName.trim() })
      .select()
      .single()

    if (newCol) {
      // Add it to the UI list immediately
      setCollections([newCol, ...collections])
      setNewCollectionName('')
      // Automatically save the prompt to this new folder
      await saveToCollection(newCol.id)
    } else {
      setIsSaving(false)
      setSaveMessage('Failed to create collection.')
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-gray-500">Loading prompt...</div>
    </main>
  )

  if (!prompt) return null

  return (
    <main className="min-h-screen bg-gray-950 text-white relative">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-400">PromptVault</Link>
        <div className="flex gap-4 text-sm text-gray-400 items-center">
          <Link href="/browse" className="hover:text-white">Browse</Link>
          <Link href="/submit" className="hover:text-white">Submit</Link>
          {user ? (
            <span className="text-violet-300 font-medium">
              {user.user_metadata?.username || user.email.split('@')[0]}
            </span>
          ) : (
            <Link href="/login" className="bg-violet-600 text-white px-4 py-1.5 rounded-full hover:bg-violet-500">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back */}
        <Link href="/browse" className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-8">
          ← Back to Browse
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold">{prompt.title}</h1>
          <span className={`text-sm px-3 py-1 rounded-full border shrink-0 ${toolColors[prompt.ai_tool] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
            {prompt.ai_tool}
          </span>
        </div>

        {prompt.description && (
          <p className="text-gray-400 mb-6">{prompt.description}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 text-sm text-gray-500 mb-8">
          <span>👁 {prompt.views || 0} views</span>
          <span>👍 {upvoteCount} upvotes</span>
          {prompt.use_case && <span>🎯 {prompt.use_case}</span>}
        </div>

        {/* Prompt Box */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400 font-medium">Prompt</span>
            <button
              onClick={copyPrompt}
              className="text-sm bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl transition"
            >
              {copied ? '✅ Copied!' : '📋 Copy Prompt'}
            </button>
          </div>
          <p className="text-gray-200 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {prompt.prompt_text}
          </p>
        </div>

        {/* Tags */}
        {prompt.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            {prompt.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-gray-800">
          <button
            onClick={handleUpvote}
            disabled={upvoted}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition text-sm ${
              upvoted
                ? 'bg-violet-900/40 text-violet-300 border border-violet-700 cursor-default'
                : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
            }`}
          >
            👍 {upvoted ? 'Upvoted!' : 'Upvote'} · {upvoteCount}
          </button>

          {/* NEW: Save Button */}
          <button
            onClick={handleOpenSaveModal}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 px-6 py-3 rounded-xl font-medium text-sm transition"
          >
            🔖 Save
          </button>
          
          <a href={toolLinks[prompt.ai_tool] || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-medium text-sm transition ml-auto"
          >
            Try in {prompt.ai_tool.charAt(0).toUpperCase() + prompt.ai_tool.slice(1)} &rarr;
          </a>
        </div>
      </div>

      {/* NEW: Collections Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">Save to Collection</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-xl">
                &times;
              </button>
            </div>

            <div className="p-6">
              {saveMessage && (
                <div className={`text-sm mb-4 p-3 rounded-lg ${saveMessage.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'}`}>
                  {saveMessage}
                </div>
              )}

              {/* List of existing collections */}
              <div className="max-h-60 overflow-y-auto mb-6 pr-2">
                {collections.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">You don't have any collections yet.</p>
                ) : (
                  <div className="space-y-2">
                    {collections.map(col => (
                      <button
                        key={col.id}
                        onClick={() => saveToCollection(col.id)}
                        disabled={isSaving}
                        className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition flex justify-between items-center"
                      >
                        {col.name}
                        <span className="text-gray-500 hover:text-violet-400">+ Add</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Create new collection form */}
              <form onSubmit={handleCreateCollection} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New collection name..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-violet-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isSaving || !newCollectionName.trim()}
                  className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shrink-0"
                >
                  Create & Save
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </main>
  )
}