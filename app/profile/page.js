'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const toolColors = {
  claude: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  chatgpt: 'bg-green-500/20 text-green-300 border border-green-500/30',
  gemini: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  midjourney: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  
  // Data States
  const [myPrompts, setMyPrompts] = useState([])
  const [collections, setCollections] = useState([])
  
  // UI States
  const [activeTab, setActiveTab] = useState('vault') // 'vault' or 'submissions'
  const [activeCollectionId, setActiveCollectionId] = useState(null)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  async function checkUserAndFetchData() {
    setLoading(true)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      router.push('/login')
      return
    }

    setUser(session.user)

    // Run BOTH database queries at the same time for maximum speed
    const fetchSubmissions = supabase
      .from('prompts')
      .select('*')
      .eq('user_id', session.user.id) 
      .order('created_at', { ascending: false })

    const fetchVault = supabase
      .from('collections')
      .select(`
        id, name, created_at,
        collection_items ( prompts ( id, title, description, prompt_text, ai_tool, tags ) )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    const [submissionsRes, vaultRes] = await Promise.all([fetchSubmissions, fetchVault])

    // Set Submissions
    if (submissionsRes.data) setMyPrompts(submissionsRes.data)
    
    // Set Vault Folders
    if (vaultRes.data) {
      setCollections(vaultRes.data)
      if (vaultRes.data.length > 0) {
        setActiveCollectionId(vaultRes.data[0].id)
      }
    }
    
    setLoading(false)
  }

  function copyPrompt(e, text, id) {
    e.preventDefault()
    e.stopPropagation() // <-- ADD THIS LINE
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading && !user) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading profile...</div>
  }

  // Helper to extract prompts for the currently selected folder
  const activeCollection = collections.find(c => c.id === activeCollectionId)
  const activeVaultPrompts = activeCollection?.collection_items
    ?.map(item => item.prompts)
    ?.filter(Boolean) || []

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

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-gray-400">
              Logged in as: <span className="text-white font-medium">{user?.user_metadata?.username || user?.email}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-gray-800 px-6 py-4 rounded-xl text-center min-w-[120px]">
              <div className="text-3xl font-bold text-violet-400">{collections.length}</div>
              <div className="text-sm text-gray-400 mt-1">Folders</div>
            </div>
            <div className="bg-gray-800 px-6 py-4 rounded-xl text-center min-w-[120px]">
              <div className="text-3xl font-bold text-violet-400">{myPrompts.length}</div>
              <div className="text-sm text-gray-400 mt-1">Submitted</div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-8 border-b border-gray-800 mb-8">
          <button
            onClick={() => setActiveTab('vault')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'vault' ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            My Vault (Saved)
            {activeTab === 'vault' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'submissions' ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            My Submissions
            {activeTab === 'submissions' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 rounded-t-full" />}
          </button>
        </div>

        {/* TAB CONTENT: MY VAULT */}
        {activeTab === 'vault' && (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar: Folders */}
            <aside className="w-full md:w-64 shrink-0">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Collections</h2>
              {collections.length === 0 ? (
                <p className="text-sm text-gray-600 bg-gray-900 p-4 rounded-xl border border-gray-800 border-dashed">No folders created yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {collections.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => setActiveCollectionId(folder.id)}
                      className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center justify-between ${
                        activeCollectionId === folder.id 
                          ? 'bg-violet-600 text-white' 
                          : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent hover:border-gray-700'
                      }`}
                    >
                      <span className="truncate pr-2">{folder.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${activeCollectionId === folder.id ? 'bg-violet-500' : 'bg-gray-800'}`}>
                        {folder.collection_items?.length || 0}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            {/* Main Area: Saved Prompts Grid */}
            <div className="flex-1">
              {activeCollection ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">{activeCollection.name}</h2>
                  </div>
                  {activeVaultPrompts.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800 border-dashed">
                      <p className="text-gray-500">This folder is empty.</p>
                      <Link href="/browse" className="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block">
                        Go save some prompts &rarr;
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {/* Mapping Vault Prompts */}
                      {activeVaultPrompts.map((prompt) => (
                        <Link 
                          key={prompt.id} 
                          href={`/prompt/${prompt.id}`} 
                          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-violet-700 transition flex flex-col group"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-lg font-semibold line-clamp-1">{prompt.title}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full shrink-0 ${toolColors[prompt.ai_tool] || 'bg-gray-700 text-gray-300'}`}>
                              {prompt.ai_tool}
                            </span>
                          </div>
                          
                          <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 font-mono mb-4 line-clamp-2">
                            {prompt.prompt_text}
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs text-gray-500 group-hover:text-violet-400 transition">
                              View details &rarr;
                            </span>
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
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB CONTENT: MY SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div>
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
              <div className="grid gap-4 md:grid-cols-2">
                {myPrompts.map((prompt) => (
                  <Link key={prompt.id} href={`/prompt/${prompt.id}`} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-violet-700 transition flex flex-col h-full">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-lg font-semibold line-clamp-1">{prompt.title}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full shrink-0 ${toolColors[prompt.ai_tool] || 'bg-gray-700 text-gray-300'}`}>
                        {prompt.ai_tool}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{prompt.description}</p>
                    <div className="flex items-center justify-between mt-4 border-t border-gray-800 pt-4">
                      <div className="flex gap-2 flex-wrap">
                        {prompt.tags?.slice(0, 2).map(tag => (
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
        )}

      </div>
    </main>
  )
}