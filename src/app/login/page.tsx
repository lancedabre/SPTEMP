'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    
    // Try to sign in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/') // Redirect to home on success
      router.refresh()
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError(null)
    
    // Create new user
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      setError('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white bg-[url('/menu-bg.jpg')] bg-cover">
      <div className="bg-black/50 backdrop-blur-md p-8 rounded-2xl border border-white/10 w-96 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center tracking-widest text-[#eb60c3]">CINEHORIA</h1>
        
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#eb60c3] transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-[#eb60c3] transition-colors"
          />
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#eb60c3] hover:bg-[#d94db0] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Log In'}
          </button>

          <button 
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-transparent hover:bg-white/10 text-gray-300 font-bold py-3 rounded-lg transition-all text-sm"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}