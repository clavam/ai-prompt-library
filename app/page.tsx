'use client'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-violet-400">PromptVault</span>
        <div className="flex gap-4 text-sm text-gray-400 items-center">
          <Link href="/browse" className="hover:text-white">Browse</Link>
          <Link href="/submit" className="hover:text-white">Submit</Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-violet-300 font-medium">
                {user.user_metadata?.username || user.email.split('@')[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-gray-800 text-gray-300 px-4 py-1.5 rounded-full hover:bg-gray-700"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-violet-600 text-white px-4 py-1.5 rounded-full hover:bg-violet-500">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          The Best AI Prompts.<br />All in One Place.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          Search thousands of curated prompts for ChatGPT, Claude, Gemini, and Midjourney — organized by profession and use case.
        </p>
        <div className="max-w-xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Search prompts... e.g. 'write a cold email'"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') router.push(`/browse?q=${e.target.value}`)
            }}
          />
          <button
            onClick={() => router.push('/browse')}
            className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl text-sm font-medium"
          >
            Search
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-xl font-semibold mb-6 text-gray-300">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 text-center transition"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-sm font-medium">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  )
}