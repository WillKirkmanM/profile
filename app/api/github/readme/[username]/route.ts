import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  const token = (await cookies()).get('github_token')?.value;
  
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${username}/${username}/main/README.md`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      return new Response(null, { status: 404 });
    }
    
    const readme = await response.text();
    return new Response(readme, {
      headers: { 'Content-Type': 'text/markdown' }
    });
  } catch (error) {
    console.error('Error fetching user README:', error);
    return new Response(null, { status: 500 });
  }
}