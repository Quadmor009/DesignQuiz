import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Quiz() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to landing page
    router.replace('/')
  }, [router])

  return (
    <>
      <Head>
        <title>Design Gym</title>
      </Head>
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </main>
    </>
  )
}


