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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setUser(session.user)
    })
  }, [])

  async function handleSubmit() {
    if (!title || !promptText || !aiTool) {
      setError('Please fill in Title, Prompt, and AI Tool.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // 1. Ask the backend AI to categorize it invisibly
      const aiResponse = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, promptText })
      })
      const { categoryId } = await aiResponse.json()

      // 2. Save everything to Supabase (using the AI's category ID)
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)
      const { error: dbError } = await supabase.from('prompts').insert({
        title, 
        description, 
        prompt_text: promptText,
        ai_tool: aiTool, 
        category_id: categoryId, // <--- Added invisibly here!
        use_case: useCase, 
        tags: tagsArray,
        user_id: user?.id || null,
      })

      if (dbError) throw new Error(dbError.message)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
      <div className="text-6xl">🎉</div>
      <h1 className="text-3xl font-bold">Prompt Submitted!</h1>
      <p className="text-gray-400">Your prompt has been added to the library.</p>
      <div className="flex gap-4">
        <Link href="/browse" className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm font-medium">Browse Prompts</Link>
        <button onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setPromptText(''); setTags(''); setUseCase('') }}
          className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl text-sm font-medium">Submit Another</button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-400">PromptVault</Link>
        <div className="flex gap-4 text-sm text-gray-400 items-center">
          <Link href="/browse" className="hover:text-white">Browse</Link>
          <Link href="/submit" className="text-white font-medium">Submit</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Submit a Prompt</h1>
        <p className="text-gray-400 mb-8">Share a prompt that's worked well for you.</p>

        <div className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Title <span className="text-red-400">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write a Cold Email That Gets Replies"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500" />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Short Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this prompt do?"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500" />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Prompt <span className="text-red-400">*</span></label>
            <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste your full prompt here. Use [brackets] for variables."
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 resize-none" />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">AI Tool <span className="text-red-400">*</span></label>
            <select value={aiTool} onChange={(e) => setAiTool(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500">
              {aiTools.map(tool => (
                <option key={tool} value={tool}>{tool.charAt(0).toUpperCase() + tool.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Use Case</label>
            <input type="text" value={useCase} onChange={(e) => setUseCase(e.target.value)}
              placeholder="e.g. Sales outreach, Content creation"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500" />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Tags <span className="text-gray-600">(comma separated)</span></label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. email, sales, outreach"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl font-medium transition">
            {loading ? 'Analyzing & Submitting...' : 'Submit Prompt'}
          </button>
        </div>
      </div>
    </main>
  )
}