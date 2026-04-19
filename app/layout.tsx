import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PromptVault — The Best AI Prompts. All in One Place.',
  description: 'Search thousands of curated prompts for ChatGPT, Claude, Gemini, and Midjourney. Organized by profession and use case. Free to use.',
  keywords: 'AI prompts, ChatGPT prompts, Claude prompts, Gemini prompts, Midjourney prompts, prompt library, prompt engineering',
  authors: [{ name: 'PromptVault' }],
  creator: 'PromptVault',
  openGraph: {
    title: 'PromptVault — The Best AI Prompts. All in One Place.',
    description: 'Search thousands of curated prompts for ChatGPT, Claude, Gemini, and Midjourney.',
    url: 'https://ai-prompt-library-blue-seven.vercel.app',
    siteName: 'PromptVault',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptVault — The Best AI Prompts. All in One Place.',
    description: 'Search thousands of curated prompts for ChatGPT, Claude, Gemini, and Midjourney.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}