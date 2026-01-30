import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected routes (require login)
  const protectedRoutes = ['/bg-tracker/dashboard', '/bg-tracker/games', '/bg-tracker/sessions', '/bg-tracker/players', '/bg-tracker/stats', '/bg-tracker/settings'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  // Redirect to login if accessing protected route without auth
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/bg-tracker/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Auth routes
  const authRoutes = ['/bg-tracker/login', '/bg-tracker/register'];
  const isAuthRoute = authRoutes.some(route => pathname === route);

  // Redirect logged in users away from auth pages
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const nextParam = request.nextUrl.searchParams.get('next');
    url.pathname = nextParam || '/bg-tracker/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
