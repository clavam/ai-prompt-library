'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const categories = [
  { name: 'Writing', slug: 'writing', icon: '✍️' },
  { name: 'Coding', slug: 'coding', icon: '💻' },
  { name: 'Business', slug: 'business', icon: '📊' },
  { name: 'Design', slug: 'design', icon: '🎨' },
  { name: 'Education', slug: 'education', icon: '📚' },
  { name: 'Personal', slug: 'personal', icon: '🧠' },
  { name: 'Research', slug: 'research', icon: '🔬' },
  { name: 'Marketing', slug: 'marketing', icon: '📣' },
]

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  
  // States
  const [promptSearchQuery, setPromptSearchQuery] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  
  // NEW: Live Search States
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  // NEW: Click Outside Listener (Closes the dropdown if you click somewhere else)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // NEW: The "Debounced" Live Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (userSearchQuery.trim().length > 0) {
        setIsSearching(true)
        setShowDropdown(true)
        
        // Fetch users whose username contains the search query
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, reputation')
          .ilike('username', `%${userSearchQuery.trim()}%`)
          .limit(5)

        if (data) setSearchResults(data)
        setIsSearching(false)
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300) // Waits 300ms after you stop typing

    return () => clearTimeout(delayDebounceFn)
  }, [userSearchQuery])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handlePromptSearch = (e: React.FormEvent) => {
    e.preventDefault() 
    if (promptSearchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(promptSearchQuery.trim())}`)
    } else {
      router.push('/browse')
    }
  }

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // If they hit enter, take them to the first result or the exact match
    if (userSearchQuery.trim()) {
      setShowDropdown(false)
      router.push(`/user/${encodeURIComponent(userSearchQuery.trim())}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-violet-500/30">

      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-6">
        
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent hidden sm:block shrink-0">
          PromptVault
        </Link>

        {/* UPGRADED: User Search Bar with Dropdown Container */}
        <div ref={searchRef} className="flex-1 max-w-lg mx-auto relative">
          <form onSubmit={handleUserSearch} className="w-full">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onFocus={() => userSearchQuery.trim() && setShowDropdown(true)}
                placeholder="Search users..."
                className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-gray-500 shadow-inner"
              />
              <button type="submit" className="hidden">Search</button>
            </div>
          </form>

          {/* THE DROPDOWN MENU */}
          {showDropdown && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-gray-500 animate-pulse">Searching Vault...</div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col">
                  {searchResults.map((result) => (
                    <Link
                      key={result.id}
                      href={`/user/${result.username}`}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {result.avatar_url ? (
                          <img src={result.avatar_url} alt={result.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          result.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-200">{result.username}</span>
                        <span className="text-[10px] text-gray-500 font-medium">Reputation: {result.reputation || 0}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No users found matching "{userSearchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 md:gap-6 text-sm items-center shrink-0">
          <Link href="/browse" className="text-gray-400 hover:text-white transition hidden md:block">Browse</Link>
          <Link href="/submit" className="text-gray-400 hover:text-white transition hidden md:block">Submit</Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold ring-2 ring-white/10 cursor-pointer text-white hover:scale-105 transition-transform" title="View Profile">
                {user.email?.[0].toUpperCase()}
              </Link>
              <button onClick={handleSignOut} className="text-xs font-semibold text-gray-400 hover:text-white transition">
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-white text-black px-4 py-1.5 rounded-full font-semibold text-xs hover:bg-gray-200 transition">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <section className="text-center py-24 px-6">
        <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          The Best AI Prompts.<br />All in One Place.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Search thousands of curated prompts for ChatGPT, Claude, Gemini, and Midjourney — organized by profession and use case.
        </p>
        
        <form onSubmit={handlePromptSearch} className="max-w-xl mx-auto flex gap-3">
          <input
            type="text"
            value={promptSearchQuery}
            onChange={(e) => setPromptSearchQuery(e.target.value)}
            placeholder="Search prompts... e.g. 'write a cold email'"
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-violet-500 transition-all text-white placeholder-gray-500"
          />
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-500 px-8 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 text-white"
          >
            Search
          </button>
        </form>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-xl font-bold mb-6 text-white">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="bg-[#0a0a0a] hover:bg-white/5 border border-white/5 hover:border-violet-500/50 rounded-2xl p-6 text-center transition-all hover:shadow-[0_0_30px_-15px_rgba(139,92,246,0.3)] group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
              <div className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  )
}