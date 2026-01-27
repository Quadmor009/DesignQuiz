import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Health check endpoint that shows diagnostic information
 * Visit: https://your-site.vercel.app/api/health
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const hasDatabaseUrl = !!process.env.DATABASE_URL
  const databaseUrlLength = process.env.DATABASE_URL?.length || 0
  const nodeEnv = process.env.NODE_ENV
  
  // Get first 20 and last 10 chars of DATABASE_URL for verification (without exposing full URL)
  const databaseUrlPreview = process.env.DATABASE_URL 
    ? `${process.env.DATABASE_URL.substring(0, 20)}...${process.env.DATABASE_URL.substring(Math.max(0, process.env.DATABASE_URL.length - 10))}`
    : 'not set'

  res.status(200).json({
    status: hasDatabaseUrl ? 'healthy' : 'unhealthy',
    database: {
      configured: hasDatabaseUrl,
      urlLength: databaseUrlLength,
      urlPreview: databaseUrlPreview,
      message: hasDatabaseUrl 
        ? 'DATABASE_URL is set ✅' 
        : 'DATABASE_URL is NOT set ❌'
    },
    environment: {
      nodeEnv: nodeEnv,
      vercel: process.env.VERCEL ? 'true' : 'false',
      vercelEnv: process.env.VERCEL_ENV || 'not set'
    },
    timestamp: new Date().toISOString(),
    instructions: !hasDatabaseUrl ? [
      '1. Go to https://vercel.com/dashboard',
      '2. Select your project',
      '3. Settings → Environment Variables',
      '4. Add DATABASE_URL with your Render PostgreSQL External Database URL',
      '5. Select all environments (Production, Preview, Development)',
      '6. Save and Redeploy'
    ] : []
  })
}

