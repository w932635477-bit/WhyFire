import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Maximum verification attempts before lockout
const MAX_ATTEMPTS = 5
// Lockout duration after max attempts (15 minutes)
const LOCKOUT_DURATION = 15 * 60 * 1000

interface StoredVerification {
  code: string
  expiresAt: number
  attempts: number
  createdAt: number
}

// Mock SMS service - In production, replace with actual SMS provider (e.g., Twilio, AWS SNS)
// Store verification codes in memory (in production, use Redis or database)
// SECURITY NOTE: Memory storage is not suitable for production multi-instance deployments
// TODO: Replace with Redis or database storage before production
const verificationCodes = new Map<string, StoredVerification>()

/**
 * Generate cryptographically secure random 6-digit code
 * Uses crypto.randomInt instead of Math.random for security
 */
function generateCode(): string {
  // crypto.randomInt generates cryptographically secure random integers
  // Range: 100000 to 999999 (inclusive)
  return crypto.randomInt(100000, 1000000).toString()
}

// Mock send SMS function
async function sendSMS(phoneNumber: string, code: string): Promise<boolean> {
  // Simulate SMS sending delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // In production, integrate with SMS provider:
  // Example with Twilio:
  // const client = require('twilio')(accountSid, authToken)
  // await client.messages.create({
  //   body: `Your WhyFire verification code is: ${code}`,
  //   from: '+1234567890',
  //   to: phoneNumber
  // })

  console.log(`[SMS Mock] Sending code ${code} to ${phoneNumber}`)
  return true
}

// POST - Send verification code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber } = body

    // Validate phone number format (simple validation)
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Basic phone number validation (supports international format)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Check rate limiting (in production, use Redis)
    const existing = verificationCodes.get(cleanPhone)
    if (existing && existing.expiresAt > Date.now()) {
      const timeLeft = Math.ceil((existing.expiresAt - Date.now()) / 1000)
      if (timeLeft > 50) { // Less than 10 seconds passed
        return NextResponse.json(
          { error: 'Please wait before requesting a new code' },
          { status: 429 }
        )
      }
    }

    // Generate new code
    const code = generateCode()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes expiry

    // Store code with attempt counter
    verificationCodes.set(cleanPhone, {
      code,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
    })

    // Send SMS
    const sent = await sendSMS(cleanPhone, code)

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    // SECURITY FIX: Use separate environment variable instead of NODE_ENV
    // to prevent accidental code exposure in misconfigured production
    const shouldReturnCode = process.env.VERIFICATION_DEBUG_MODE === 'true'

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      // Only return code if explicitly enabled via VERIFICATION_DEBUG_MODE
      ...(shouldReturnCode && { code })
    })
  } catch (error) {
    console.error('SMS send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Verify code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phoneNumber = searchParams.get('phoneNumber')
    const code = searchParams.get('code')

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      )
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Get stored code
    const stored = verificationCodes.get(cleanPhone)

    if (!stored) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check if account is locked due to too many attempts
    if (stored.attempts >= MAX_ATTEMPTS) {
      const lockoutRemaining = LOCKOUT_DURATION - (Date.now() - stored.createdAt)
      if (lockoutRemaining > 0) {
        return NextResponse.json(
          {
            error: 'Too many failed attempts. Please try again later.',
            retryAfter: Math.ceil(lockoutRemaining / 1000)
          },
          { status: 429 }
        )
      } else {
        // Lockout expired, reset attempts
        stored.attempts = 0
      }
    }

    // Check if expired
    if (stored.expiresAt < Date.now()) {
      verificationCodes.delete(cleanPhone)
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      )
    }

    // Verify code
    if (stored.code !== code) {
      // Increment attempt counter
      stored.attempts += 1
      verificationCodes.set(cleanPhone, stored)

      const attemptsRemaining = MAX_ATTEMPTS - stored.attempts
      if (attemptsRemaining > 0) {
        return NextResponse.json(
          {
            error: 'Invalid verification code',
            attemptsRemaining
          },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new code.' },
          { status: 429 }
        )
      }
    }

    // Code is valid - remove it to prevent reuse
    verificationCodes.delete(cleanPhone)

    // In production, create or get user from database
    // Return user session/token
    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
      phoneNumber: cleanPhone
    })
  } catch (error) {
    console.error('SMS verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
