import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Design Gym</title>
        <meta name="description" content="Practice platform where designers train their visual judgment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-8 py-24 md:px-12 md:py-32">
          {/* Hero Section */}
          <div className="mb-20 md:mb-32 text-center">
            <h1 className="text-5xl md:text-7xl font-normal text-black mb-8 tracking-tight">
              Design Gym
            </h1>
          </div>

          {/* Value Statement */}
          <div className="mb-20 md:mb-32 text-center">
            <p className="text-2xl md:text-3xl text-gray-900 leading-relaxed font-normal">
              A practice platform where designers train their visual judgment.
            </p>
          </div>

          {/* Supporting Points */}
          <div className="mb-20 md:mb-32 text-center">
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              Compare interfaces, typography, and visual decisions to improve your design instincts.
            </p>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-4">
            <Link
              href="/quiz"
              className="inline-block px-8 py-4 bg-black text-white text-lg font-normal hover:bg-gray-800 transition-colors cursor-pointer rounded-[8px]"
            >
              Start your Training
            </Link>
            <div>
              <Link
                href="/leaderboard"
                className="inline-block px-8 py-4 bg-gray-100 text-gray-900 text-lg font-normal hover:bg-gray-200 transition-colors cursor-pointer rounded-[8px]"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
