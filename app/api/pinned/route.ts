import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL || 'https://profile.parson.workers.dev';

export async function GET(request: NextRequest) {
  const username = (await cookies()).get('github_user')?.value;
  
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const response = await fetch(`${WORKER_URL}/user/${username}/pinned`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json([]);
      }
      throw new Error(`Worker API error: ${response.status}`);
    }
    
    const pinnedRepos = await response.json();
    return NextResponse.json(pinnedRepos);
  } catch (error) {
    console.error('Error fetching pinned repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch pinned repositories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const username = (await cookies()).get('github_user')?.value;
  const token = (await cookies()).get('github_token')?.value;
  
  if (!username || !token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { repo }: any = await request.json();
    
    if (!repo || !repo.id) {
      return NextResponse.json({ error: 'Invalid repository data' }, { status: 400 });
    }
    
    const response = await fetch(`${WORKER_URL}/user/${username}/pinned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repo }),
    });
    
    if (!response.ok) {
      throw new Error(`Worker API error: ${response.status}`);
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error pinning repository:', error);
    return NextResponse.json({ error: 'Failed to pin repository' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const username = (await cookies()).get('github_user')?.value;
  
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const url = new URL(request.url);
    const repoId = url.searchParams.get('id');
    
    if (!repoId) {
      return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 });
    }
    
    const response = await fetch(`${WORKER_URL}/user/${username}/pinned?id=${repoId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Worker API error: ${response.status}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unpinning repository:', error);
    return NextResponse.json({ error: 'Failed to unpin repository' }, { status: 500 });
  }
}