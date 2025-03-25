import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  const token = (await cookies()).get('github_token')?.value;
  
  const headers: { Accept: string; Authorization?: string } = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers,
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: response.status });
    }
    
    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}