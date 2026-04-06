/**
 * Session Configuration Template
 * Based on: "Modernization of Enterprise Payment Infrastructure: A Case Study on LLM-Assisted Migration of Legacy Distributed Systems"
 * Research Paper reference: Session management strategy
 * 
 * This template demonstrates the session configuration approach
 * described in the Research Paper with security best practices.
 */

import env from '#start/env'

export interface SessionConfig {
  driver: 'redis' | 'memory' | 'cookie'
  cookieName: string
  clearWithBrowser: boolean
  maxAge: number
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
  encrypt: boolean
  encryptionKey: string
}

/**
 * Session configuration for payment portal
 * 
 * SECURITY CONSIDERATIONS:
 * - httpOnly: Prevents XSS attacks by blocking JavaScript access to cookies
 * - secure: Ensures cookies only sent over HTTPS
 * - sameSite: Prevents CSRF attacks
 * - encrypt: Sensitive payment data encrypted in session
 * - maxAge: 30 minutes for payment sessions (PCI compliance consideration)
 */
export const sessionConfig: SessionConfig = {
  // Redis Standard Tier driver for stateless Cloud Run deployment.
  // Research Paper reference: "Cloud Run's stateless nature required different approach"
  driver: env.get('SESSION_DRIVER', 'redis') as 'redis',

  // Cookie configuration
  cookieName: env.get('SESSION_COOKIE_NAME', 'pay_session'),
  clearWithBrowser: false, // Persist for 30 minutes even if browser closed
  maxAge: env.get('SESSION_TIMEOUT_MINUTES', 30) * 60 * 1000, // 30 minutes in milliseconds

  // Security settings
  httpOnly: true,  // Prevent XSS access to session cookie
  secure: env.get('NODE_ENV') === 'production', // HTTPS only in production
  sameSite: 'strict', // Strongest CSRF protection

  // Encryption for sensitive payment data
  encrypt: true,
  encryptionKey: env.get('SESSION_ENCRYPTION_KEY'),
}

/**
 * Session timeout configuration
 * Research Paper reference: Session extension system (Appendix A)
 */
export const sessionTimeoutConfig = {
  // When to show warning modal (25 minutes = 5 minutes before expiry)
  warningAtMinutes: env.get('SESSION_WARNING_MINUTES', 25),
  
  // How often to check session expiry on client (every 30 seconds)
  checkIntervalMs: 30 * 1000,
  
  // Grace period for session extension requests (10 seconds)
  extensionGracePeriodMs: 10 * 1000,
}

/**
 * Redis configuration for session storage
 * Research Paper reference: Infrastructure deployment (Section 2.2, Table 1)
 *
 * Deployment tier: VPC-Private Redis Standard Tier.
 * The Standard tier was selected to provide automatic failover (primary +
 * replica), mirroring production-grade enterprise payment environments.
 * Redis is deployed within the VPC to ensure network isolation; Cloud Run
 * accesses it exclusively via the VPC connector (see cloud-run.yaml).
 */
export const redisConfig = {
  host: env.get('REDIS_HOST'),
  port: env.get('REDIS_PORT', 6379),
  password: env.get('REDIS_PASSWORD'),
  
  // Connection pool settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  
  // Key prefix for session data
  keyPrefix: env.get('REDIS_KEY_PREFIX', 'pay:session:'),
  
  // TTL aligned with session maxAge
  ttl: env.get('SESSION_TIMEOUT_MINUTES', 30) * 60,
}

/**
 * Session data structure
 * Research Paper reference: Complex session management (Section 2)
 */
export interface SessionData {
  // User information from OIDC authentication
  user?: {
    userId: string
    email: string
    firstName: string
    lastName: string
    companyName?: string
    customerNumber?: string
    roles: string[]
  }
  
  // Payment workflow data
  payment?: {
    amount: number
    currency: string
    selectedInvoices: string[]
    contactInfo?: {
      firstName: string
      lastName: string
      email: string
      company: string
      phoneNumber: string
    }
  }
  
  // Session management
  lastActivity: number
  sessionExtended: boolean
  csrfToken: string
  
  // Feature flags
  impersonationEnabled?: boolean
  
  // Audit trail
  createdAt: number
  ipAddress: string
  userAgent: string
}

/**
 * Example usage in controller:
 * 
 * ```typescript
 * export default class SessionController {
 *   async extend({ session, response }: HttpContext) {
 *     const lastActivity = session.get('lastActivity', 0)
 *     const currentTime = Date.now()
 *     const timeDiff = currentTime - lastActivity
 *     
 *     // Update session activity timestamp
 *     session.put('lastActivity', currentTime)
 *     session.put('sessionExtended', true)
 *     
 *     return response.json({
 *       success: true,
 *       timeRemaining: this.calculateTimeRemaining(session),
 *     })
 *   }
 * }
 * ```
 */
