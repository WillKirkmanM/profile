import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL || 'https://profile.parson.workers.dev';

export async function POST(request: NextRequest) {
  const username = (await cookies()).get('github_user')?.value;
  const token = (await cookies()).get('github_token')?.value;
  
  if (!username || !token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { repo}: any = await request.json();
    
    if (!repo || !repo.id) {
      return NextResponse.json({ error: 'Invalid repository data' }, { status: 400 });
    }
    
    console.log(`Sending request to ${WORKER_URL}/user/${username}/pinned with repo:`, JSON.stringify(repo));
    
    const response = await fetch(`${WORKER_URL}/user/${username}/pinned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ repo }),
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
    console.error('Error pinning repository:', error);
    return NextResponse.json({ error: 'Failed to pin repository', details: error.message }, { status: 500 });
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
    
    console.log(`Sending DELETE request to ${WORKER_URL}/user/${username}/pinned?id=${repoId}`);
    
    const response = await fetch(`${WORKER_URL}/user/${username}/pinned?id=${repoId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
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
    console.error('Error unpinning repository:', error);
    return NextResponse.json({ error: 'Failed to unpin repository', details: error.message }, { status: 500 });
  }
}