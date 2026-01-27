import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Landing page images only
const COLLAGE_IMAGES = [
  '/Landing Page Images/Landing Image 1.png',
  '/Landing Page Images/Landing Image 2.png',
  '/Landing Page Images/Landing Image 3.png',
  '/Landing Page Images/Landing Image 4.png',
  '/Landing Page Images/Landing Image 5.png',
]

// Placeholder partner logos
const PARTNER_LOGOS = [
  { name: 'Partner 1', url: 'https://via.placeholder.com/100x40?text=Logo1' },
  { name: 'Partner 2', url: 'https://via.placeholder.com/100x40?text=Logo2' },
  { name: 'Partner 3', url: 'https://via.placeholder.com/100x40?text=Logo3' },
  { name: 'Partner 4', url: 'https://via.placeholder.com/100x40?text=Logo4' },
  { name: 'Partner 5', url: 'https://via.placeholder.com/100x40?text=Logo5' },
]

export default function Home() {
  const [handleIndex, setHandleIndex] = useState(0)
  const [playerHandles, setPlayerHandles] = useState<string[]>([])
  const [loadingHandles, setLoadingHandles] = useState(true)

  // Fetch real Twitter handles from database
  useEffect(() => {
    const fetchHandles = async () => {
      try {
        const response = await fetch('/api/twitter-handles')
        if (response.ok) {
          const handles = await response.json()
          // Only use real handles from database, no fallback
          setPlayerHandles(handles)
        } else {
          // No fallback - just empty array
          setPlayerHandles([])
        }
      } catch (error) {
        console.error('Error fetching Twitter handles:', error)
        // No fallback - just empty array
        setPlayerHandles([])
      } finally {
        setLoadingHandles(false)
      }
    }

    fetchHandles()
  }, [])

  // Handle scrolling Twitter handles
  useEffect(() => {
    if (playerHandles.length === 0) return
    
    const interval = setInterval(() => {
      setHandleIndex((prev) => (prev + 1) % playerHandles.length)
    }, 2000) // Change handle every 2 seconds

    return () => clearInterval(interval)
  }, [playerHandles])

  // Duplicate images for seamless scrolling - enough duplicates to hide start/end points
  // With 6 sets, each set is ~16.67% of total height, so we animate through one set
  const scrollingImages = [...COLLAGE_IMAGES, ...COLLAGE_IMAGES, ...COLLAGE_IMAGES, ...COLLAGE_IMAGES, ...COLLAGE_IMAGES, ...COLLAGE_IMAGES]

  return (
    <>
      <Head>
        <title>Design Gym</title>
        <meta name="description" content="Practice platform where designers train their visual judgment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="h-screen overflow-hidden relative" style={{ backgroundColor: '#FAF9F7', overflowX: 'hidden', overflowY: 'hidden' }}>
        {/* Hero Section */}
        <section className="h-full px-4 md:px-8 lg:px-12 xl:px-16 py-8 md:py-12 lg:py-16 relative">
          {/* Social Proof Strip - Bottom Left of Screen */}
          <div className="absolute bottom-0 left-4 md:left-8 lg:left-12 xl:left-16 pb-4 sm:pb-8 md:pb-12 lg:pb-16 w-full lg:w-1/2">
            <div className="flex flex-col items-start gap-2">
              <div className="w-full lg:w-[45vw] border-t border-gray-200 mb-2"></div>
              <p className="text-xs md:text-sm text-gray-600 font-medium">
                110+ designers already training
              </p>
              <div className="relative h-5 w-full max-w-md overflow-hidden">
                {loadingHandles ? (
                  <span className="text-xs text-gray-400 font-normal">Loading...</span>
                ) : playerHandles.length > 0 ? (
                  <div className="absolute inset-0 flex flex-col">
                    {playerHandles.map((handle, index) => (
                      <span
                        key={index}
                        className="text-xs text-gray-500 font-normal whitespace-nowrap w-full text-left transition-all duration-500 ease-in-out absolute"
                        style={{
                          transform: `translateY(${(index - handleIndex) * 100}%)`,
                          opacity: Math.abs(index - handleIndex) <= 1 ? 1 : 0,
                        }}
                      >
                        {handle}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 font-normal">Be the first to connect your Twitter!</span>
                )}
              </div>
            </div>
          </div>

          <div className="h-full flex flex-col relative">
            <div className="flex-1 flex items-center min-h-0 relative">
              {/* Hero Content - Left Side - Aligned to left edge */}
              <div className="flex flex-col justify-center relative min-h-0 w-full lg:w-1/2 lg:max-w-[50%]">
                {/* Eyebrow Text - Top Left - Inside left column for perfect alignment */}
                <p className="text-xs md:text-sm font-medium text-gray-500 tracking-wide uppercase mb-6 md:mb-8">
                  Trusted design practice, Worldwide
                </p>
                
                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bold text-black mb-4 md:mb-6 tracking-tight leading-[1.1]">
                  Design Gym
                </h1>

                {/* Supporting Paragraph */}
                <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6 md:mb-8 max-w-xl">
                  Experience a hassle-free, seamless practice with efficient, professional design training tailored to your needs.
                </p>

                {/* CTA Row */}
                <div className="flex flex-col sm:flex-row gap-3 mb-12 md:mb-16">
                  <Link
                    href="/quiz"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[8px]"
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    Start Training
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-normal hover:bg-gray-50 transition-colors rounded-[8px] border border-gray-200"
                  >
                    View Leaderboard
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Media - Right Side - Scrolling Grid Frame */}
          <div className="hidden lg:block fixed top-0 right-0 w-1/2 h-screen overflow-hidden z-0">
            {/* Fixed Frame - Acts as viewport */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Scrolling Grid Container */}
              <div className="image-grid-scroll h-full">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {scrollingImages.map((src, index) => {
                    // Determine which column (0 or 1)
                    const columnIndex = index % 2
                    // Apply offset to second column (right column)
                    const offsetClass = columnIndex === 1 ? 'column-offset' : ''
                    
                    return (
                      <div
                        key={`${src}-${index}`}
                        className={`rounded-2xl overflow-hidden aspect-[3/4] ${offsetClass}`}
                      >
                        <img
                          src={src}
                          alt={`Design training example ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Credit - Bottom Right with filled frame - Hidden on mobile */}
          <div className="hidden sm:block absolute bottom-0 right-4 md:right-8 lg:right-12 xl:right-16 pb-8 md:pb-12 lg:pb-16 z-30">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-[8px] border border-gray-300/50 shadow-md hover:shadow-lg transition-all duration-200">
              <p className="text-xs text-gray-800 font-medium tracking-wide">
                <span className="text-gray-500">Vibe coded by</span>{' '}
                <span className="text-black font-semibold">Quadri Morin</span>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
