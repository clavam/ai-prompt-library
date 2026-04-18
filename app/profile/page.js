'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const toolColors = {
  claude: 'bg-orange-500/20 text-orange-300',
  chatgpt: 'bg-green-500/20 text-green-300',
  gemini: 'bg-blue-500/20 text-blue-300',
  midjourney: 'bg-pink-500/20 text-pink-300',
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [myPrompts, setMyPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  async function checkUserAndFetchData() {
    setLoading(true)
    
    // 1. Get the current logged-in user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      // If no one is logged in, redirect to login page immediately
      router.push('/login')
      return
    }

    setUser(session.user)

    // 2. Fetch ONLY the prompts created by this specific user
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', session.user.id) 
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMyPrompts(data)
    } else if (error) {
      console.error("Error fetching user prompts:", error)
    }
    
    setLoading(false)
  }

  function copyPrompt(e, text, id) {
    e.preventDefault()
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Show a blank dark screen while checking auth to prevent layout flashing
  if (loading && !user) {
    return <div className="min-h-screen bg-gray-950"></div>
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-400">PromptVault</Link>
        <div className="flex gap-4 text-sm text-gray-400 items-center">
          <Link href="/browse" className="hover:text-white">Browse</Link>
          <Link href="/submit" className="hover:text-white">Submit</Link>
          <button
            onClick={handleSignOut}
            className="bg-gray-800 text-gray-300 px-4 py-1.5 rounded-full hover:bg-gray-700 transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-gray-400">
              Logged in as: <span className="text-white font-medium">{user?.user_metadata?.username || user?.email}</span>
            </p>
          </div>
          <div className="bg-gray-800 px-6 py-4 rounded-xl text-center min-w-[150px]">
            <div className="text-3xl font-bold text-violet-400">{myPrompts.length}</div>
            <div className="text-sm text-gray-400 mt-1">Submitted Prompts</div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-6">My Prompts</h2>

        {/* User's Prompt Cards */}
        {loading ? (
          <div className="text-gray-500 text-center py-20">Loading your prompts...</div>
        ) : myPrompts.length === 0 ? (
          <div className="text-gray-500 text-center py-20 bg-gray-900 rounded-2xl border border-gray-800 border-dashed">
            <p className="mb-4">You haven't submitted any prompts yet.</p>
            <Link href="/submit" className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-xl transition">
              Submit your first prompt
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {myPrompts.map((prompt) => (
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
                <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 font-mono mb-4 line-clamp-2">
                  {prompt.prompt_text}
                </div>
                <div className="flex items-center justify-between mt-4">
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
