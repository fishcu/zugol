'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
})

type LoginForm = z.infer<typeof loginSchema>
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
    reset: resetForgotForm,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
          // Don't automatically show the modal - let user click the link if they want
        } else {
          setError(authError.message)
        }
        return
      }

      // Success - redirect to homepage
      router.push('/')
      
    } catch (err) {
      setError('Sign in failed. Please try again.')
    }
  }

  const onForgotPasswordSubmit = async (data: ForgotPasswordForm) => {
    setForgotPasswordError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setForgotPasswordError(error.message)
        return
      }

      setForgotPasswordSuccess(true)
    } catch (err) {
      setForgotPasswordError('Failed to send reset email. Please try again.')
    }
  }

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false)
    setForgotPasswordSuccess(false)
    setForgotPasswordError(null)
    resetForgotForm()
  }

  const openForgotPasswordWithEmail = () => {
    const currentEmail = getValues('email')
    setShowForgotPassword(true)
    if (currentEmail) {
      resetForgotForm({ email: currentEmail })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300">
            ⚫Zugol⚪
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4 mb-2">Sign In</h1>
          <p className="text-gray-400">Welcome back to the Zurich Go Ladder</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-200">{error}</p>
                {error.includes('Invalid email or password') && (
                  <button
                    type="button"
                    onClick={openForgotPasswordWithEmail}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                {...register('password')}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300">
                Register
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="mt-2 text-sm text-gray-400 hover:text-gray-300 underline"
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-gray-400">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {forgotPasswordSuccess ? (
              <div className="text-center">
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-200">
                    Password reset email sent! Check your inbox for further instructions.
                  </p>
                </div>
                <button
                  onClick={closeForgotPasswordModal}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitForgot(onForgotPasswordSubmit)} className="space-y-6">
                {forgotPasswordError && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                    <p className="text-sm text-red-200">{forgotPasswordError}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="forgot-email"
                    {...registerForgot('email')}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      forgotErrors.email ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter your email"
                  />
                  {forgotErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{forgotErrors.email.message}</p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={closeForgotPasswordModal}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {isForgotSubmitting ? 'Sending...' : 'Send Reset Email'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 