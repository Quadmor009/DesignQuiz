import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Debug endpoint to check if environment variables are set
 * Remove this in production for security
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development or with a secret key
  if (process.env.NODE_ENV === 'production' && req.query.secret !== process.env.DEBUG_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const hasDatabaseUrl = !!process.env.DATABASE_URL
  const databaseUrlLength = process.env.DATABASE_URL?.length || 0
  const nodeEnv = process.env.NODE_ENV

  res.status(200).json({
    hasDatabaseUrl,
    databaseUrlLength,
    nodeEnv,
    message: hasDatabaseUrl 
      ? 'DATABASE_URL is set ✅' 
      : 'DATABASE_URL is NOT set ❌ - Add it to your environment variables and redeploy',
    hint: hasDatabaseUrl 
      ? 'Database connection should work'
      : 'Go to your deployment platform (Vercel/Render) → Settings → Environment Variables → Add DATABASE_URL'
  })
}

