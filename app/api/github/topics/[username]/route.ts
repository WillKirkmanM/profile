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
    const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers,
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }
    
    const repos: any = await response.json();
    
    const allTopics = repos.flatMap((repo: { topics: any; }) => repo.topics || []);
    
    const topicCounts: { [key: string]: number } = {};
    allTopics.forEach((topic: string | number) => {
      topicCounts[String(topic)] = (topicCounts[String(topic)] || 0) + 1;
    });
    
    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);
    
    return NextResponse.json(sortedTopics);
  } catch (error) {
    console.error('Error fetching user topics:', error);
    return NextResponse.json([], { status: 500 });
  }
}