'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    const verifyOtpOnLoad = async () => {
      try {
        setIsVerifying(true)
        
        const email = searchParams.get('email')
        const otp = searchParams.get('otp')
        
        if (!email || !otp) {
          setMessage('Invalid or incomplete reset link.')
          setIsError(true)
          return
        }

        // Immediately verify the OTP
        const { error } = await supabase.auth.verifyOtp({
          email: String(email),
          token: String(otp),
          type: 'recovery',
        })

        if (error) {
          console.error('Error verifying OTP:', error)
          setMessage(error.message || 'Invalid or expired reset link.')
          setIsError(true)
        } else {
          setIsVerified(true)
        }
      } catch (err) {
        console.error('Unexpected error verifying OTP:', err)
        setMessage('An error occurred while verifying your reset link.')
        setIsError(true)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyOtpOnLoad()

    // Listen for auth state changes to catch USER_UPDATED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "USER_UPDATED") {
        setIsSuccess(true)
        
        // Unsubscribe from auth listener
        subscription.unsubscribe()
        
        // Redirect to home page after 2 seconds since user is still authenticated
        // Note: Due to JWT design, the user remains authenticated even after password reset
        // because the access token is still valid until expiry. This is expected Supabase behavior.
        // We redirect to home instead of login since the user is already authenticated.
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [searchParams, router])

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setMessage('')
      setIsError(false)
      
      // Don't wait for the promise to resolve due to auth state change listener hanging issue
      // Instead, listen for USER_UPDATED event in the auth state change handler
      supabase.auth.updateUser({ 
        password: data.password 
      }).catch((err) => {
        console.error('Error updating password:', err)
        setMessage('Failed to update password. Please try again.')
        setIsError(true)
      })
      
    } catch (err) {
      console.error('Unexpected error in password reset:', err)
      setMessage('An unexpected error occurred. Please try again later.')
      setIsError(true)
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300">
              ⚫Zugol⚪
            </Link>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
            <p className="text-gray-400 mb-4">Your password has been successfully updated.</p>
            <p className="text-sm text-gray-500">Redirecting you to the home page...</p>
          </div>
        </div>
      </div>
    )
  }

  // Verifying state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300">
              ⚫Zugol⚪
            </Link>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-white text-xl mb-4">Verifying reset link...</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state (invalid/expired link)
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300">
              ⚫Zugol⚪
            </Link>
            <h1 className="text-3xl font-bold text-white mt-4 mb-2">Invalid Reset Link</h1>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-200">{message}</p>
            </div>
            
            <p className="text-gray-400 mb-6">
              Please request a new password reset link.
            </p>
            
            <Link
              href="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Password reset form (only shown if verified)
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300">
            ⚫Zugol⚪
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4 mb-2">Set Your New Password</h1>
          <p className="text-gray-400">Enter your new password below</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {message && (
              <div className={`rounded-lg p-4 ${
                isError 
                  ? 'bg-red-900/30 border border-red-700' 
                  : 'bg-green-900/30 border border-green-700'
              }`}>
                <p className={`text-sm ${isError ? 'text-red-200' : 'text-green-200'}`}>
                  {message}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                {...register('password')}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter your new password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Must be at least 6 characters
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword')}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Confirm your new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/login" className="text-gray-400 hover:text-gray-300 text-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
