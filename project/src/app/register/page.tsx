'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { supabase, rankToRatingPoints } from '@/lib/supabase'

const registerSchema = z.object({
  name: z.string().min(1, 'A name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rank: z.string().min(1, 'Please select your Go rank'),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setError(null)

    // Check if captcha is completed
    if (!captchaToken) {
      setError('Please complete the captcha verification')
      return
    }

    try {
      // Convert rank to rating points
      const ratingPoints = rankToRatingPoints(data.rank)
      
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            rating_points: ratingPoints,
          }
        }
      })

      if (authError) {
        // Most auth errors will be validation or network related
        setError(authError.message)
        // Reset captcha on error
        captchaRef.current?.resetCaptcha()
        setCaptchaToken(null)
        return
      }

      // Success - redirect to confirmation page
      router.push('/register/confirmation')
      
    } catch (err) {
      setError('Registration failed. Please try again.')
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
    }
  }

  const onCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
  }

  const onCaptchaExpire = () => {
    setCaptchaToken(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300">
            ⚫Zugol⚪
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4 mb-2">Register</h1>
          <p className="text-gray-400">Join the Zurich Go Ladder</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-200 mb-2">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Your name or nickname"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>
            
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
            
            <div>
              <label htmlFor="rank" className="block text-sm font-medium text-gray-300 mb-2">
                Go Rank
              </label>
              <select
                id="rank"
                {...register('rank')}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rank ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Select your rank</option>
                <option value="25k">25 kyu</option>
                <option value="24k">24 kyu</option>
                <option value="23k">23 kyu</option>
                <option value="22k">22 kyu</option>
                <option value="21k">21 kyu</option>
                <option value="20k">20 kyu</option>
                <option value="19k">19 kyu</option>
                <option value="18k">18 kyu</option>
                <option value="17k">17 kyu</option>
                <option value="16k">16 kyu</option>
                <option value="15k">15 kyu</option>
                <option value="14k">14 kyu</option>
                <option value="13k">13 kyu</option>
                <option value="12k">12 kyu</option>
                <option value="11k">11 kyu</option>
                <option value="10k">10 kyu</option>
                <option value="9k">9 kyu</option>
                <option value="8k">8 kyu</option>
                <option value="7k">7 kyu</option>
                <option value="6k">6 kyu</option>
                <option value="5k">5 kyu</option>
                <option value="4k">4 kyu</option>
                <option value="3k">3 kyu</option>
                <option value="2k">2 kyu</option>
                <option value="1k">1 kyu</option>
                <option value="1d">1 dan</option>
                <option value="2d">2 dan</option>
                <option value="3d">3 dan</option>
                <option value="4d">4 dan</option>
                <option value="5d">5 dan</option>
                <option value="6d">6 dan</option>
                <option value="7d">7 dan</option>
                <option value="8d">8 dan</option>
                <option value="9d">9 dan</option>
              </select>
              {errors.rank && (
                <p className="mt-1 text-sm text-red-400">{errors.rank.message}</p>
              )}
            </div>

            {/* hCaptcha */}
            <div className="flex justify-center">
              <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                onVerify={onCaptchaVerify}
                onExpire={onCaptchaExpire}
                ref={captchaRef}
                theme="dark"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !captchaToken}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 