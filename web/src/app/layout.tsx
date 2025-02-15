// // app/layout.tsx

// import './globals.css'
// import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
// import Link from 'next/link'

// const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// export const metadata: Metadata = {
//   title: 'ECG Analysis System',
//   description: 'Medical research platform for ECG classification',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en" className={inter.variable}>
//       <body className="bg-slate-50 text-slate-900 antialiased">
//         <header className="fixed w-full backdrop-blur-md bg-white/70 border-b border-slate-200 z-50">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
//             <Link href="/" className="flex items-center space-x-2 hover:opacity-90">
//               <HeartIcon className="h-8 w-8 text-red-500" />
//               <span className="text-2xl font-semibold tracking-tight">
//                 ECG Research
//               </span>
//             </Link>
//             <nav className="flex space-x-6 text-sm font-medium">
//               <Link
//                 href="/"
//                 className="hover:text-blue-600 transition-colors"
//               >
//                 Home
//               </Link>
//               <Link
//                 href="/about"
//                 className="hover:text-blue-600 transition-colors"
//               >
//                 About
//               </Link>
//               <Link
//                 href="/docs"
//                 className="hover:text-blue-600 transition-colors"
//               >
//                 Docs
//               </Link>
//             </nav>
//           </div>
//         </header>

//         <main className="pt-16 min-h-screen">{children}</main>
//       </body>
//     </html>
//   )
// }

// function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
//   return (
//     <svg
//       {...props}
//       fill="none"
//       strokeWidth={1.5}
//       stroke="currentColor"
//       viewBox="0 0 24 24"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M21 8.25c0-2.485-2.1-4.5-4.688-4.5-1.935 0-3.598 1.126-4.313 2.733C11.285 5.126 9.623 4 7.687 4 5.099 4 3 6.015 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
//       />
//     </svg>
//   )
// }

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}