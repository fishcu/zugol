import Link from 'next/link'

export default function RegistrationConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300">
            ⚫Zugol⚪
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4 mb-2">Check Your Email</h1>
          <p className="text-gray-400">Registration almost complete!</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">📧</div>
            
            <h2 className="text-xl font-semibold text-white mb-4">
              Confirmation Email Sent
            </h2>
            
            <p className="text-gray-300 leading-relaxed">
              We've sent you a confirmation email to activate your Zugol account. 
              Please check your inbox and click the confirmation link.
            </p>
            
            <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4 mt-6">
              <p className="text-sm text-orange-200">
                <strong>Don't see the email?</strong><br/>
                Check your spam folder or try registering again with a different email address.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center space-y-4">
            <Link
              href="/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Go to Sign In
            </Link>
            
            <Link
              href="/"
              className="block text-gray-400 hover:text-gray-300 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 