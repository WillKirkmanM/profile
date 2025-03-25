import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}?error=no_code`);
  }
  
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
      })
    });
    
    const tokenData: any = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${request.nextUrl.origin}?error=auth_failed`);
    }
    
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    const userData: any = await userResponse.json();
    
    (await
      cookies()).set('github_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    (await cookies()).set('github_user', userData.login, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard`);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}?error=auth_error`);
  }
}