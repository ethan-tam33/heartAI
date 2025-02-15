// app/layout.tsx

import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ECG Analysis System',
  description: 'Medical research platform for ECG classification',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-slate-50">
        <nav className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-2">
                <HeartIcon className="h-8 w-8 text-red-600" />
                <span className="text-xl font-semibold text-slate-900">
                  ECG Research
                </span>
              </Link>
              <div className="flex space-x-4">
                <Link
                  href="/about"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/docs"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
                >
                  Documentation
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  )
}
