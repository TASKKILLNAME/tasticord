import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// auth.getUser()가 hang될 경우를 대비한 타임아웃 (Vercel middleware 25s 제한 내에서 안전하게)
const AUTH_TIMEOUT_MS = 4000;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  // 세션 쿠키가 아예 없으면 Supabase 호출 자체를 스킵 (auth 페이지로만 리다이렉트)
  // 이렇게 하면 비로그인 트래픽이 미들웨어에서 네트워크 호출을 안 하게 됨
  // Supabase는 토큰을 청크로 분할해 쿠키 이름이 sb-xxx-auth-token, .0, .1 등 다양 → includes로 체크
  const hasSessionCookie = request.cookies.getAll().some((c) =>
    c.name.startsWith('sb-') && c.name.includes('auth-token')
  );
  if (!hasSessionCookie && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }
  if (!hasSessionCookie) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser()가 행 걸리는 경우(Supabase 일시 장애, 네트워크 지연)에 대비해 타임아웃 가드.
  // 타임아웃이 발생하면 인증 검사를 건너뛰고 응답을 통과시킨다.
  // (페이지/API 레이어에서 다시 auth 체크하므로 보안상 안전)
  let user: { id: string } | null = null;
  let authTimedOut = false;

  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AUTH_TIMEOUT')), AUTH_TIMEOUT_MS),
      ),
    ]);
    user = result.data.user;
  } catch (e) {
    if (e instanceof Error && e.message === 'AUTH_TIMEOUT') {
      authTimedOut = true;
      console.warn(`[middleware] auth.getUser() timeout on ${request.nextUrl.pathname}`);
    } else {
      console.error('[middleware] auth.getUser() error:', e);
    }
  }

  // 타임아웃이면 리다이렉트 스킵 (페이지 자체에서 처리)
  if (authTimedOut) return supabaseResponse;

  if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
