// app/page.tsx

export default function LandingPage() {
  return (
    <div className="relative w-full h-screen">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/videos/background-new.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark overlay + content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full bg-black/40 px-4">
        <section className="max-w-3xl text-center text-white">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-md">
  He<span className="italic">a</span>rt<span className="italic">i ❤️</span>
</h1>


          <p className="text-lg md:text-xl mb-8 drop-shadow-sm">
            Upload your Cardiovascular Magnetic Resonance scans and get instant analysis with AI-powered insights on a sleek, user-friendly interface.
          </p>
          <a
            href="/upload"
            className="inline-block px-8 py-3 text-lg font-medium bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
          >
            Get Started
          </a>
        </section>
      </div>
    </div>
  )
}
