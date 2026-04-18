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
  const [prompt, setPrompt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState(null)
  const [upvoted, setUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)

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
      // Increment view count
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

  if (loading) return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-gray-500">Loading prompt...</div>
    </main>
  )

  if (!prompt) return null

  return (
    <main className="min-h-screen bg-gray-950 text-white">

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
        <div className="flex gap-4">
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

          
            <a href={toolLinks[prompt.ai_tool] || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-medium text-sm transition"
          >
            Try in {prompt.ai_tool.charAt(0).toUpperCase() + prompt.ai_tool.slice(1)} &rarr;
          </a>
        </div>

      </div>
    </main>
  )
}