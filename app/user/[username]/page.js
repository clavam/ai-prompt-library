'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase' // Adjust the dots based on your folder depth!
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UserProfilePage() {
  const { username } = useParams()
  const router = useRouter()
  
  const [profile, setProfile] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Decode the username in case it has spaces or special characters in the URL
    if (username) fetchUserAndPrompts(decodeURIComponent(username))
  }, [username])

  async function fetchUserAndPrompts(targetUsername) {
    // 1. Fetch the profile matching the URL
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', targetUsername) // ilike makes it case-insensitive!
      .single()

    if (profileError || !userProfile) {
      setLoading(false)
      return // Will show the "User not found" UI
    }
    
    setProfile(userProfile)

    // 2. Fetch all prompts created by this user ID
    const { data: userPrompts } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })

    if (userPrompts) setPrompts(userPrompts)
    
    setLoading(false)
  }

  if (loading) return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-500 font-medium">Loading profile...</div>
    </main>
  )

  if (!profile) return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-4">
      <div className="text-6xl">👻</div>
      <h1 className="text-2xl font-bold">User Not Found</h1>
      <p className="text-gray-500">This user doesn't exist or hasn't set up a profile.</p>
      <Link href="/browse" className="mt-4 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl transition">Go back home</Link>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-violet-500/30 pb-20">
      {/* Simple Nav */}
      <nav className="border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">PromptVault</Link>
        <Link href="/browse" className="text-sm font-semibold bg-white text-black px-4 py-1.5 rounded-full hover:bg-gray-200 transition">Browse Prompts</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 mt-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 pb-12 border-b border-white/5">
          {/* Avatar (Fallback to first letter if no image) */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-5xl font-black shadow-[0_0_40px_-10px_rgba(139,92,246,0.4)] shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black mb-2">{profile.username}</h1>
            
            {/* Show bio if they have one! */}
            {profile.bio ? (
              <p className="text-gray-400 text-lg mb-4 max-w-2xl">{profile.bio}</p>
            ) : (
              <p className="text-gray-600 text-sm mb-4 italic">This user hasn't written a bio yet.</p>
            )}

            <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-bold text-gray-500">
              <div className="bg-white/5 px-4 py-2 rounded-xl">
                <span className="text-white">{prompts.length}</span> Prompts
              </div>
              <div className="bg-white/5 px-4 py-2 rounded-xl">
                <span className="text-white">{profile.reputation || 0}</span> Reputation
              </div>
            </div>
          </div>
        </div>

        {/* User's Prompts Grid */}
        <h2 className="text-2xl font-bold mb-6">Prompts by {profile.username}</h2>
        
        {prompts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
            <p className="text-gray-500">No prompts submitted yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map(prompt => (
              <Link href={`/prompt/${prompt.id}`} key={prompt.id} className="group bg-[#0a0a0a] border border-white/5 hover:border-violet-500/50 rounded-2xl p-6 transition-all hover:shadow-[0_0_30px_-15px_rgba(139,92,246,0.3)] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">{prompt.ai_tool}</span>
                  <span className="text-xs text-gray-600">👍 {prompt.upvotes || 0}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">{prompt.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">{prompt.description || prompt.prompt_text}</p>
                <div className="text-xs font-bold text-violet-500 group-hover:translate-x-1 transition-transform">
                  View Prompt →
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}