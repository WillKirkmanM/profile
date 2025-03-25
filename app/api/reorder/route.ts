import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL || 'https://profile.parson.workers.dev';

/**
 * Handle POST requests to reorder pinned repositories
 */
export async function POST(request: NextRequest) {
  const username = (await cookies()).get('github_user')?.value;
  const token = (await cookies()).get('github_token')?.value;
  
  if (!username || !token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { repoIds }: any = await request.json();
    
    if (!repoIds || !Array.isArray(repoIds)) {
      return NextResponse.json({ error: 'Invalid repository data' }, { status: 400 });
    }
    
    console.log(`Sending reorder request to ${WORKER_URL}/user/${username}/reorder with repoIds:`, JSON.stringify(repoIds));
    
    const response = await fetch(`${WORKER_URL}/user/${username}/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ repoIds }),
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`Non-JSON response from worker: ${text}`);
      return NextResponse.json({ 
        error: 'Invalid response from worker',
        details: text.substring(0, 100),
        status: response.status
      }, { status: 502 });
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Worker API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error reordering repositories:', error);
    return NextResponse.json({ error: 'Failed to reorder repositories', details: error.message }, { status: 500 });
  }
}