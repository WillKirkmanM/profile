/// <reference types="@cloudflare/workers-types" />
declare const GITHUB_KV: KVNamespace;

addEventListener('fetch', (event: { respondWith: (arg0: Promise<Response>) => void; request: { url: string | URL; method: string; text: () => any; }; }) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request: { url: string | URL; method: string; text: () => any }) {
  const url = new URL(request.url)
  const path = url.pathname.split('/').filter(Boolean)
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS,PUT,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }
  
  try {
    if (path[0] === 'user' && path[2] === 'pinned') {
      const username = path[1]
      
      if (!username) {
        return jsonResponse({ error: 'Username is required' }, corsHeaders, 400)
      }
      
      if (request.method === 'GET') {
        const pinnedRepos = await getPinnedRepos(username)
        return jsonResponse(pinnedRepos, corsHeaders)
      } else if (request.method === 'POST') {
        try {
          const bodyText = await request.text()
          
          let data
          try {
            data = JSON.parse(bodyText)
          } catch (parseError: any) {
            console.error('JSON parse error:', parseError)
            return jsonResponse({ error: 'Invalid JSON in request body', details: parseError.message }, corsHeaders, 400)
          }
          
          if (!data.repo || !data.repo.id) {
            return jsonResponse({ error: 'Invalid repository data' }, corsHeaders, 400)
          }
          
          const pinnedRepos = await addPinnedRepo(username, data.repo)
          return jsonResponse(pinnedRepos, corsHeaders)
        } catch (error: any) {
          console.error('Error processing POST request:', error)
          return jsonResponse({ error: 'Error processing request', details: error.message }, corsHeaders, 500)
        }
      } else if (request.method === 'DELETE') {
        const searchParams = new URL(request.url).searchParams
        const repoId = searchParams.get('id')
        
        if (!repoId) {
          return jsonResponse({ error: 'Missing repo ID' }, corsHeaders, 400)
        }
        
        const updatedRepos = await removePinnedRepo(username, repoId)
        return jsonResponse(updatedRepos, corsHeaders)
      }
    }
    
    return jsonResponse({ 
      message: 'GitHub Extended Profile API', 
      endpoints: [
        '/user/{username}/pinned', 
        '/{username}'
      ] 
    }, corsHeaders)
    
  } catch (error: any) {
    console.error('Worker error:', error)
    return jsonResponse({ error: 'Internal server error', message: error.message }, corsHeaders, 500)
  }
}

async function getPinnedRepos(username: string) {
  try {
    const pinnedReposJson = await GITHUB_KV.get(`pinned:${username}`)
    return pinnedReposJson ? JSON.parse(pinnedReposJson) : []
  } catch (error) {
    console.error(`Error getting pinned repos for ${username}:`, error)
    return []
  }
}

async function addPinnedRepo(username: string, repo: { id: any; }) {
  try {
    const pinnedRepos = await getPinnedRepos(username)
    
    if (!pinnedRepos.some((r: { id: any; }) => r.id === repo.id)) {
      pinnedRepos.push(repo)
      await GITHUB_KV.put(`pinned:${username}`, JSON.stringify(pinnedRepos))
    }
    
    return pinnedRepos
  } catch (error) {
    console.error(`Error adding pinned repo for ${username}:`, error)
    throw error
  }
}

async function removePinnedRepo(username: string, repoId: string) {
  try {
    const pinnedRepos = await getPinnedRepos(username)
    const repoIdInt = parseInt(repoId, 10)
    
    const updatedRepos = pinnedRepos.filter((repo: { id: number; }) => repo.id !== repoIdInt)
    await GITHUB_KV.put(`pinned:${username}`, JSON.stringify(updatedRepos))
    return updatedRepos
  } catch (error) {
    console.error(`Error removing pinned repo for ${username}:`, error)
    throw error
  }
}

function jsonResponse(data: { error?: string; details?: any; message?: any; endpoints?: string[]; }, headers = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  })
}