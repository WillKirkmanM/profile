import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  
  try {
    const response = await fetch(`https://pinned.berrysauce.me/get/${username}`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying pinned repositories:', error);
    return NextResponse.json([], { status: 500 });
  }
}