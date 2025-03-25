import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  const token = (await cookies()).get('github_token')?.value;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  try {
    const response = await fetch(`https://api.github.com/users/${username}/orgs`, {
      headers,
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }
    
    const orgs: any = await response.json();
    
    const detailedOrgs = await Promise.all(
      orgs.map(async (org: { login: any; }) => {
        try {
          const detailsResponse = await fetch(`https://api.github.com/orgs/${org.login}`, {
            headers,
            next: { revalidate: 3600 }
          });
          
          if (detailsResponse.ok) {
            const details = await detailsResponse.json() as Record<string, any>;
            return { ...org, ...details };
          }
          return org;
        } catch {
          return org;
        }
      })
    );
    
    return NextResponse.json(detailedOrgs);
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json([], { status: 500 });
  }
}