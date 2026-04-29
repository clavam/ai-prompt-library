'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase' // Adjust dots if your lib is somewhere else!

export default function SetupPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        fetchCurrentProfile(session.user.id)
      }
    })
  }, [])

  async function fetchCurrentProfile(userId) {
    const { data } = await supabase.from('profiles').select('username').eq('id', userId).single()
    if (data?.username) {
      // Pre-fill and clean up Google's "First Last" format into a solid username
      setUsername(data.username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())
    }
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!username.trim()) return

    setSaving(true)
    setError('')

    const cleanUsername = username.trim().toLowerCase()

    // 1. Save to the public profiles table
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ username: cleanUsername })
      .eq('id', user.id)

    if (dbError) {
      setSaving(false)
      // 23505 is the SQL error for "Unique constraint violation"
      if (dbError.code === '23505') {
        setError('That username is already taken! Try another one.')
      } else {
        setError('Failed to save. Try again.')
      }
      return
    }

    // 2. Mark onboarding as complete inside their encrypted Auth Token
    await supabase.auth.updateUser({
      data: { setup_complete: true, username: cleanUsername }
    })

    // 3. Send them to the homepage!
    router.push('/')
  }

  if (loading) return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
      <div className="animate-pulse">Loading setup...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 selection:bg-violet-500/30">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-[0_0_30px_-10px_rgba(139,92,246,0.5)]">
            👋
          </div>
          <h1 className="text-2xl font-black mb-2">Claim your handle</h1>
          <p className="text-gray-400 text-sm">Pick a unique username so others can find your prompts.</p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                placeholder="johndoe"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-violet-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !username}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {saving ? 'Saving...' : 'Complete Setup →'}
          </button>
        </form>
      </div>
    </main>
  )
}