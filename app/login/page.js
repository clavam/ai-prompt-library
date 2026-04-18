'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      })
      if (error) setError(error.message)
      else {
        // Create profile row
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            username: username,
          })
        }
        setMessage('Account created! Check your email to confirm, then sign in.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/browse')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-400">PromptVault</Link>
      </nav>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">

          {/* Toggle */}
          <div className="flex bg-gray-800 rounded-xl p-1 mb-8">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${!isSignUp ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${isSignUp ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            >
              Sign Up
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-6">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>

          <div className="flex flex-col gap-4">
            {isSignUp && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. promptmaster"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-xl">
                {message}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-3 rounded-xl font-medium transition mt-2"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}