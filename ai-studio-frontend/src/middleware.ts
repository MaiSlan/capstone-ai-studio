// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Fetch the user session
  const { data: { user } } = await supabase.auth.getUser()

  // THE BOUNCER LOGIC:
  // If the user is NOT logged in and tries to access the /studio folder, redirect to /auth
  if (!user && request.nextUrl.pathname.startsWith('/studio')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // If the user IS logged in and tries to access /auth, redirect to /studio
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/studio'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// Ensure the middleware only runs on specific paths to save performance
export const config = {
  matcher: [
    '/studio/:path*',
    '/auth/:path*',
  ],
}