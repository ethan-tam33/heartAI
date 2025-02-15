// app/about/page.tsx

export default function AboutPage() {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6">
        <h1 className="text-3xl font-bold">About Our ECG Analysis Platform</h1>
        <p className="text-lg text-slate-700 leading-relaxed">
          Our platform leverages cutting-edge machine learning techniques to
          analyze ECG scans, offer possible diagnoses, and compare them to
          similar historical cases. We aim to simplify the process for both
          healthcare professionals and researchers.
        </p>
        <p className="text-lg text-slate-700 leading-relaxed">
          We believe in the power of AI to assist in making quick, accurate, and
          data-driven decisions in a clinical setting.
        </p>
      </div>
    )
  }
  