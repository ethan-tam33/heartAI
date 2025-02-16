// app/page.tsx (Next.js 13+)
import Script from 'next/script';
import ElevenLabsConvai from '../components/ElevenLabsConvai';

export default function Home() {
  return (
    <main>
      <h1>My Page</h1>
      <ElevenLabsConvai agentId="qvrdSMDiMkSTgn2twg5v" />
      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
        async
        type="text/javascript"
      />
    </main>
  );
}
