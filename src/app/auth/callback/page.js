'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (session) {
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (!existingUser) {
            await supabase
              .from('users')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  username: session.user.email?.split('@')[0] || 'user',
                  full_name: session.user.user_metadata?.full_name || '',
                  avatar_url: session.user.user_metadata?.avatar_url || '',
                },
              ])
          }

          router.push('/')
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
      color: '#ffffff',
      fontSize: '1.1rem',
      fontWeight: '500',
      letterSpacing: '0.3px',
    }}>
      Memproses autentikasi...
    </div>
  )
}
