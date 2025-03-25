'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BsGripVertical } from 'react-icons/bs';

const SortableRepositoryItem = ({ repo, unpinRepo }: { repo: any, unpinRepo: any }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: repo.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };
  
  return (
    <li 
      ref={setNodeRef} 
      style={style}
      className="px-4 py-4 flex items-start sm:items-center flex-col sm:flex-row sm:justify-between hover:bg-gray-50 border-b border-gray-200 last:border-none"
    >
      <div className="mb-2 sm:mb-0 sm:pr-4 flex-1 flex items-center">
        <button 
          className="mr-2 px-1 py-1 rounded hover:bg-gray-100 cursor-grab touch-none"
          {...attributes} 
          {...listeners}
        >
          <BsGripVertical className="h-5 w-5 text-gray-400" />
        </button>
        
        <div className="flex-1">
          <a 
            href={repo.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          >
            {repo.name}
          </a>
          <p className="text-sm text-gray-500 mt-1">{repo.description || 'No description'}</p>
          <div className="flex items-center mt-2">
            {repo.language && (
              <span className="flex items-center text-xs text-gray-500 mr-4">
                <span className="w-2 h-2 rounded-full bg-indigo-400 mr-1"></span>
                {repo.language}
              </span>
            )}
            {repo.stargazers_count > 0 && (
              <span className="flex items-center text-xs text-gray-500 mr-4">
                <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {repo.stargazers_count}
              </span>
            )}
            {repo.forks_count > 0 && (
              <span className="flex items-center text-xs text-gray-500">
                <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
                </svg>
                {repo.forks_count}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => unpinRepo(repo.id)}
        className="inline-flex items-center px-3 py-1.5 border border-red-200 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Unpin
      </button>
    </li>
  );
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<any[]>([]);
  const [pinnedRepos, setPinnedRepos] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const router = useRouter();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  useEffect(() => {
    const githubUser = document.cookie
      .split('; ')
      .find(row => row.startsWith('github_user='))
      ?.split('=')[1];
      
    if (!githubUser) {
      router.push('/');
      return;
    }
    
    setUsername(githubUser);
    fetchUserProfile(githubUser);
    fetchUserRepos();
    fetchPinnedRepos();
  }, [router]);
  
  const fetchUserProfile = async (username: string) => {
    try {
      const response = await fetch(`https://api.github.com/users/${username}`, { next: { revalidate: 3600 } });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  const fetchUserRepos = async () => {
    try {
      const response = await fetch('/api/repos', { next: {
        revalidate: 3600
      } });
      if (response.ok) {
        const data: any = await response.json();
        setRepos(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching repos:', error);
      setLoading(false);
    }
  };
  
  const fetchPinnedRepos = async () => {
    try {
      const response = await fetch('/api/pinned');
      if (response.ok) {
        const data: any = await response.json();
        setPinnedRepos(data);
        setOrderChanged(false);
      }
    } catch (error) {
      console.error('Error fetching pinned repos:', error);
    }
  };
  
  const pinRepo = async (repo: any) => {
    try {
      const response = await fetch('/api/pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ repo })
      });
      
      if (response.ok) {
        fetchPinnedRepos();
      }
    } catch (error) {
      console.error('Error pinning repo:', error);
    }
  };
  
  const unpinRepo = async (repoId: any) => {
    try {
      const response = await fetch(`/api/pin?id=${repoId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchPinnedRepos();
      }
    } catch (error) {
      console.error('Error unpinning repo:', error);
    }
  };
  
  const saveRepoOrder = async () => {
    if (!orderChanged) return;
    
    setIsSaving(true);
    try {
      const workerUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL || 'https://profile.parson.workers.dev';
      const repoIds = pinnedRepos.map(repo => repo.id);
      
      const response = await fetch('/api/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ repoIds })
      });
      
      if (response.ok) {
        setOrderChanged(false);
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      console.error('Error saving repository order:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setPinnedRepos((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        setOrderChanged(true);
        return newItems;
      });
    }
  };

  const filteredRepos = searchTerm 
    ? repos.filter(repo => 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : repos;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-lg text-gray-700">Loading your repositories...</span>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">GitHub Extended Profile</h1>
          {userProfile && (
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-3">
                Signed in as <span className="font-semibold">{username}</span>
              </span>
              {userProfile.avatar_url && (
                <img
                  src={userProfile.avatar_url}
                  alt={`${username}'s avatar`}
                  className="h-8 w-8 rounded-full"
                />
              )}
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Customize your extended GitHub profile by pinning repositories
                </p>
              </div>
              
              {username && (
                <Link 
                  href={`/${username}`}
                  className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Public Profile
                </Link>
              )}
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Repositories
                </h3>
                <div className="mt-4">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search repositories"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-gray-200 max-h-[60vh] overflow-y-auto">
                {filteredRepos.length > 0 ? (
                  filteredRepos.map((repo: any) => (
                    <li key={repo.id} className="px-4 py-4 flex items-start sm:items-center flex-col sm:flex-row sm:justify-between hover:bg-gray-50">
                      <div className="mb-2 sm:mb-0 sm:pr-4">
                        <a 
                          href={repo.html_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          {repo.name}
                        </a>
                        <p className="text-sm text-gray-500 mt-1">{repo.description || 'No description'}</p>
                        <div className="flex items-center mt-2">
                          {repo.language && (
                            <span className="flex items-center text-xs text-gray-500 mr-4">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 mr-1"></span>
                              {repo.language}
                            </span>
                          )}
                          {repo.stargazers_count > 0 && (
                            <span className="flex items-center text-xs text-gray-500 mr-4">
                              <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {repo.stargazers_count}
                            </span>
                          )}
                          {repo.forks_count > 0 && (
                            <span className="flex items-center text-xs text-gray-500">
                              <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
                              </svg>
                              {repo.forks_count}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => pinRepo(repo)}
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-100 text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Pin
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      {searchTerm ? "No repositories match your search" : "No repositories found"}
                    </p>
                  </li>
                )}
              </ul>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      Pinned Repositories
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {pinnedRepos.length}
                      </span>
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      These repositories will be displayed on your extended profile
                    </p>
                    {pinnedRepos.length > 1 && (
                      <p className="mt-1 text-sm text-indigo-600">
                        <span className="inline-flex items-center">
                          <BsGripVertical className="h-4 w-4 mr-1" />
                          Drag to reorder repositories
                        </span>
                      </p>
                    )}
                  </div>
                  
                  {orderChanged && (
                    <button
                      onClick={saveRepoOrder}
                      disabled={isSaving}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                        isSaving 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Order
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {pinnedRepos.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pinnedRepos.map(repo => repo.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="divide-y divide-gray-200 max-h-[60vh] overflow-y-auto">
                      {pinnedRepos.map(repo => (
                        <SortableRepositoryItem 
                          key={repo.id} 
                          repo={repo} 
                          unpinRepo={unpinRepo} 
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="px-4 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    No pinned repositories yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Pin repositories to customize your extended profile
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            GitHub Extended Profile — Pin unlimited repositories beyond GitHub's 6 limit
          </p>
        </div>
      </footer>
    </div>
  );
}