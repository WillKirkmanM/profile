import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

export async function GET(request: NextRequest) {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.append('client_id', CLIENT_ID);
  url.searchParams.append('redirect_uri', REDIRECT_URI);
  url.searchParams.append('scope', 'read:user user:email repo');
  
  return NextResponse.redirect(url.toString());
}