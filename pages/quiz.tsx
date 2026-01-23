import dynamic from 'next/dynamic'
import Head from 'next/head'

// Dynamically import QuizContent with SSR disabled to prevent hydration errors
// This ensures randomization only happens on the client side
const QuizContent = dynamic(() => import('./QuizContent'), {
  ssr: false,
  loading: () => (
    <>
      <Head>
        <title>Design Gym - Training</title>
      </Head>
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading questions...</p>
        </div>
      </main>
    </>
  ),
})

export default function Quiz() {
  return <QuizContent />
}


