'use client';

import Image from 'next/image';
import Link from 'next/link';
import path from 'path';
import { Octokit } from '@octokit/rest';
import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  FiUsers, FiUserPlus, FiMapPin, FiMail, FiExternalLink, 
  FiStar, FiGithub, FiEdit3, FiHome, FiCode, FiGlobe,
  FiBook, FiPackage, FiFilter, FiCheckCircle
} from 'react-icons/fi';
import { 
  GoOrganization, GoVerified, GoRepo, GoEye, GoLink,
  GoBookmark, GoGraph, GoStar, GoRepoForked, GoProject,
  GoGitPullRequest, GoIssueOpened, GoSmiley
} from 'react-icons/go';
import { FaTwitter, FaTiktok, FaYoutube, FaTwitch, FaLinkedin, FaDiscord } from 'react-icons/fa';
import { SiMatrix } from 'react-icons/si';
import { BiGitRepoForked, BiLinkAlt } from 'react-icons/bi';
import { getLanguageColours } from '@/actions/getLanguageColours';
import React from 'react';

function getGitHubCookies() {
  if (typeof document === 'undefined') {
    return { token: null, user: null };
  }

  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('github_token='))
    ?.split('=')[1];
    
  const user = document.cookie
    .split('; ')
    .find(row => row.startsWith('github_user='))
    ?.split('=')[1];
    
  return { token, user };
}

async function getGitHubUser(username: string) {
  try {
    const response = await fetch(`/api/github/user/${username}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user');
    }
    
    const data: any = await response.json();
    
    const { user } = getGitHubCookies();
    
    return {
      ...data,
      isAuthenticatedUser: user === username
    };
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    return null;
  }
}

interface GitHubUser {
  blog?: string;
  bio?: string;
}

function extractSocialLinks(user: GitHubUser | null) {
  if (!user) return [];
  
  const links: { url: any; type: string; icon: React.JSX.Element; label?: string; }[] = [];
  
  if (user.blog) {
    const blogLinks = user.blog.split(/\s+/).filter(Boolean);
    
    blogLinks.forEach((link: string) => {
      const url = link.startsWith('http') ? link : `https://${link}`;
      const hostname = new URL(url).hostname;
      
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        links.push({ url, type: 'twitter', icon: <FaTwitter /> });
      } else if (hostname.includes('linkedin.com')) {
        links.push({ url, type: 'linkedin', icon: <FaLinkedin /> });
      } else if (hostname.includes('youtube.com')) {
        links.push({ url, type: 'youtube', icon: <FaYoutube /> });
      } else if (hostname.includes('tiktok.com')) {
        links.push({ url, type: 'tiktok', icon: <FaTiktok /> });
      } else if (hostname.includes('twitch.tv')) {
        links.push({ url, type: 'twitch', icon: <FaTwitch /> });
      } else if (hostname.includes('discord.gg')) {
        links.push({ url, type: 'discord', icon: <FaDiscord /> });
      } else if (hostname.includes('matrix.org')) {
        links.push({ url, type: 'matrix', icon: <SiMatrix /> });
      } else {
        links.push({ url, type: 'website', icon: <FiGlobe />, label: hostname });
      }
    });
  }
  
  if (user.bio) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const bioLinks = user.bio.match(urlRegex) || [];
    
    bioLinks.forEach((link: string) => {
      if (!links.some(existingLink => existingLink.url === link)) {
        try {
          const url = link.trim();
          const hostname = new URL(url).hostname;
          
    if (!links.some(existingLink => existingLink.url === url)) {
            links.push({ url, type: 'website', icon: <FiGlobe />, label: hostname });
          }
        } catch (e) {
          console.error('Error parsing URL from bio:', e);
        }
      }
    });
  }
  
  return links;
}

async function getUserOrganizations(username: any) {
  try {
    const response = await fetch(`/api/github/orgs/${username}`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
}

async function getUserTopics(username: string) {
  try {
    const response = await fetch(`/api/github/topics/${username}`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user topics:', error);
    return [];
  }
}

async function getUserReadme(username: any) {
  try {
    const response = await fetch(`/api/github/readme/${username}`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.text();
  } catch (error) {
    console.error('Error fetching user README:', error);
    return null;
  }
}

async function getGitHubPinnedRepos(username: any) {
  try {
    const response = await fetch(`/api/github-pinned/${username}`);
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching GitHub pinned repositories:', error);
    return [];
  }
}

async function getPinnedRepos(username: any) {
  try {
    const workerUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL || 'https://profile.parson.workers.dev';
    const response = await fetch(`${workerUrl}/user/${username}/pinned`, {
      next: { revalidate: 1800 }
    });
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching extended pinned repositories:', error);
    return [];
  }
}

async function updateRepoOrder(username: any, repoIds: any) {
  try {
    const workerUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL || 'https://profile.parson.workers.dev';
    const response = await fetch(`${workerUrl}/user/${username}/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ repoIds })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update repository order');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating repo order:', error);
    throw error;
  }
}

function useIsCurrentUser(profileUsername: unknown) {
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  
  useEffect(() => {
    const githubUser = document.cookie
      .split('; ')
      .find(row => row.startsWith('github_user='))
      ?.split('=')[1];
      
    setIsCurrentUser(githubUser === profileUsername);
  }, [profileUsername]);
  
  return isCurrentUser;
}

interface Repository {
  id: string;
  name: string;
  html_url: string;
  description?: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  homepage?: string;
  topics?: string[];
}

interface LanguageColor {
  color: string;
  url?: string;
}

interface LanguageColors {
  [key: string]: LanguageColor;
}

const RepositoryCard = ({ repo, languageColors }: { repo: Repository; languageColors: LanguageColors }) => {
  const languageColor = repo.language && languageColors[repo.language] ? 
    languageColors[repo.language].color : 
    '#8b949e';
    
  const hasWebsite = repo.homepage && repo.homepage.trim() !== '';
  
  return (
    <div className="p-4 border border-gray-300 rounded-md mb-4 hover:bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <GoRepo className="text-gray-600 mr-2" />
          <h3 className="font-semibold text-blue-600 hover:underline">
            <a 
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {repo.name}
            </a>
          </h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-600">
          Public
        </span>
      </div>
      
      {repo.description && (
        <p className="text-sm text-gray-600 mb-3">
          {repo.description}
        </p>
      )}
      
      <div className="flex flex-wrap items-center text-xs text-gray-600 gap-4">
        {repo.language && (
          <div className="flex items-center">
            <span 
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: languageColor }}
            ></span>
            <span>
              {repo.language}
            </span>
          </div>
        )}
        
        {repo.stargazers_count > 0 && (
          <a
            href={`${repo.html_url}/stargazers`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-blue-600"
          >
            <GoStar className="mr-1" />
            {repo.stargazers_count.toLocaleString()}
          </a>
        )}
        
        {repo.forks_count > 0 && (
          <a
            href={`${repo.html_url}/network/members`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-blue-600"
          >
            <GoRepoForked className="mr-1" />
            {repo.forks_count.toLocaleString()}
          </a>
        )}
        
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {repo.topics.slice(0, 3).map((topic: string) => (
              <a
                key={topic}
                href={`https://github.com/topics/${topic}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {topic}
              </a>
            ))}
            {repo.topics.length > 3 && (
              <span className="text-xs text-gray-500">+{repo.topics.length - 3} more</span>
            )}
          </div>
        )}
        
        {hasWebsite && (
          <a
            href={repo.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-blue-600"
          >
            <FiExternalLink className="mr-1" />
            Website
          </a>
        )}
      </div>
    </div>
  );
};

interface PageParams {
  params: {
    username: string;
  };
}

export default function ProfilePage({ params }: PageParams) {
  const [username, setUsername] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState([]);
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [githubPinnedRepos, setGithubPinnedRepos] = useState([]);
  const [extendedPinnedRepos, setExtendedPinnedRepos] = useState([]);
  const [pinnedRepos, setPinnedRepos] = useState([]);
  const [topics, setTopics] = useState([]);
  const [languageColors, setLanguageColors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  
  useEffect(() => {
    if (params?.username) {
      const usernameParam = Array.isArray(params.username) 
        ? params.username[0] 
        : params.username;
        
      setUsername(usernameParam);
    }
  }, [params]);

  useEffect(() => {
    if (!username) return;
    
    const githubUser = document.cookie
      .split('; ')
      .find(row => row.startsWith('github_user='))
      ?.split('=')[1];
      
    setIsCurrentUser(githubUser === username);
  }, [username]);
  
  const socialLinks = useMemo(() => {
    return user ? extractSocialLinks(user) : [];
  }, [user]);

  useEffect(() => {
    if (!username) return;
    
    async function fetchData() {
      setLoading(true);
      
      const userData = await getGitHubUser(username);
      if (!userData) {
        setLoading(false);
        return;
      }
      
      setUser(userData);
        
      const [orgs, readme, githubPinned, extendedPinned, colors, userTopics] = await Promise.all<any>([
        getUserOrganizations(username),
        getUserReadme(username),
        getGitHubPinnedRepos(username),
        getPinnedRepos(username),
        getLanguageColours(),
        getUserTopics(username)
      ]);
        
      setOrganizations(orgs);
      setReadmeContent(readme);
      setGithubPinnedRepos(githubPinned);
      setExtendedPinnedRepos(extendedPinned);
      setLanguageColors(colors);
      setTopics(userTopics);
        
      let allPinnedRepos = [];
        
      if (extendedPinned.length > 0) {
        allPinnedRepos = extendedPinned.map((repo: any) => ({
          ...repo,
          source: 'extended'
        }));
      } else {
        allPinnedRepos = githubPinned.map((repo: { author: any; name: any; description: any; language: any; stars: any; forks: any; topics: any; }) => ({
          id: `${repo.author}/${repo.name}`,
          name: repo.name,
          full_name: `${repo.author}/${repo.name}`,
          description: repo.description,
          html_url: `https://github.com/${repo.author}/${repo.name}`,
          language: repo.language,
          stargazers_count: repo.stars,
          forks_count: repo.forks,
          source: 'github',
          topics: repo.topics || []
        }));
      }
        
      setPinnedRepos(allPinnedRepos);
      setLoading(false);
    }
      
    fetchData();
  }, [username]); 

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-gray-500 text-5xl mb-4">
            <GoEye className="mx-auto" />
          </div>
          <h2 className="mt-4 text-xl font-medium text-gray-900">User Not Found</h2>
          <p className="mt-2 text-sm text-gray-600">
            Could not find GitHub user with username "{username}"
          </p>
          <Link href="/" className="mt-6 inline-block px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800">
            Return Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 font-['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'] text-gray-900 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <Link href="/" className="flex items-center gap-2">
              <Image src={"/parsonlabs.png"} alt={`${username} Image`} className='w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center' width={100} height={100} />
              <span className="font-medium tracking-tight text-gray-900">Parson Profile</span>
            </Link>
            
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <a href="#overview" className="text-gray-600 hover:text-gray-900 transition-colors">Overview</a>
              <a href="#repositories" className="text-gray-600 hover:text-gray-900 transition-colors">Repositories</a>
              <a href="#projects" className="text-gray-600 hover:text-gray-900 transition-colors">Projects</a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isCurrentUser && (
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Dashboard
              </Link>
            )}
            <Link href="/" className="text-sm px-3.5 py-1.5 rounded-full font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors">
              Home
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-screen-xl mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4">
            <div className="relative">
              <img
                src={user.avatar_url}
                alt={`${username}'s avatar`}
                className="w-full rounded-full border border-gray-300 mb-4"
              />
              
              {isCurrentUser && (
                <button className="absolute bottom-4 right-0 p-2 bg-gray-100 rounded-full border border-gray-300 hover:bg-gray-200">
                  <FiEdit3 className="h-4 w-4 text-gray-700" />
                </button>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">{user.name || username}</h1>
            <h2 className="text-xl font-normal text-gray-600 mb-4">{username}</h2>
            
            {user.bio && (
              <p className="text-gray-700 mb-4">{user.bio}</p>
            )}
            
            {isCurrentUser ? (
              <Link href="/dashboard" className="w-full block text-center px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 mb-4">
                Edit profile
              </Link>
            ) : (
              <button className="w-full px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 mb-4">
                Follow
              </button>
            )}
            
            <div className="flex items-center space-x-2 mb-3 text-sm">
              <a href={`https://github.com/${username}?tab=followers`} className="flex items-center text-gray-600 hover:text-blue-600">
                <FiUsers className="mr-1 text-gray-500" />
                <span className="font-bold text-gray-900">{user.followers}</span> followers
              </a>
              <span>·</span>
              <a href={`https://github.com/${username}?tab=following`} className="flex items-center text-gray-600 hover:text-blue-600">
                <span className="font-bold text-gray-900">{user.following}</span> following
              </a>
            </div>
            
            <div className="mb-4">
              {user.company && (
                <div className="flex items-center mb-2 text-sm text-gray-600">
                  <GoOrganization className="mr-2 w-4 h-4 text-gray-500" />
                  {user.company}
                </div>
              )}
              
              {user.location && (
                <div className="flex items-center mb-2 text-sm text-gray-600">
                  <FiMapPin className="mr-2 w-4 h-4 text-gray-500" />
                  {user.location}
                </div>
              )}
              
              {user.email && (
                <div className="flex items-center mb-2 text-sm text-gray-600">
                  <FiMail className="mr-2 w-4 h-4 text-gray-500" />
                  <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">{user.email}</a>
                </div>
              )}
              
              {user.blog && (
                <div className="flex items-center mb-2 text-sm text-gray-600">
                  <FiGlobe className="mr-2 w-4 h-4 text-gray-500" />
                  <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-blue-600 hover:underline">
                    {user.blog.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              
              {user.twitter_username && (
                <div className="flex items-center mb-2 text-sm text-gray-600">
                  <FaTwitter className="mr-2 w-4 h-4 text-gray-500" />
                  <a href={`https://twitter.com/${user.twitter_username}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-blue-600 hover:underline">
                    @{user.twitter_username}
                  </a>
                </div>
              )}
            </div>
            
            {socialLinks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Links</h3>
                <div className="flex flex-col space-y-2">
                  {socialLinks.map((link, index) => (
                    <a 
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:underline"
                    >
                      <span className="mr-2 text-gray-500">{link.icon}</span>
                      {link.label || link.type}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {organizations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Organizations</h3>
                <div className="flex flex-wrap gap-2">
                  {organizations.map((org: any) => (
                    <a 
                      key={org.id}
                      href={`https://github.com/${org.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img 
                        src={org.avatar_url} 
                        alt={`${org.login} logo`}
                        className="w-8 h-8 rounded"
                        title={org.login}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {topics.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Topics</h3>
                <div className="flex flex-wrap gap-1">
                  {topics.map(topic => (
                    <a 
                      key={topic}
                      href={`https://github.com/topics/${topic}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      {topic}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="md:w-3/4">
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex -mb-px">
                <button 
                  onClick={() => setActiveTab('overview')} 
                  className={`py-3 px-4 text-sm font-medium ${activeTab === 'overview' ? 'text-gray-900 border-b-2 border-orange-500' : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'}`}
                >
                  <div className="flex items-center">
                    <FiBook className="mr-2" />
                    Overview
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('repositories')} 
                  className={`py-3 px-4 text-sm font-medium ${activeTab === 'repositories' ? 'text-gray-900 border-b-2 border-orange-500' : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'}`}
                >
                  <div className="flex items-center">
                    <GoRepo className="mr-2" />
                    Repositories <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-gray-200">{user.public_repos}</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('projects')} 
                  className={`py-3 px-4 text-sm font-medium ${activeTab === 'projects' ? 'text-gray-900 border-b-2 border-orange-500' : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent'}`}
                >
                  <div className="flex items-center">
                    <GoProject className="mr-2" />
                    Projects
                  </div>
                </button>
              </nav>
            </div>
            
            {activeTab === 'overview' && (
              <div>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-medium text-gray-900">Pinned</h2>
                  </div>
                  
                  {pinnedRepos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pinnedRepos.map((repo: any) => (
                        <RepositoryCard
                          key={repo.id}
                          repo={repo}
                          languageColors={languageColors}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-md bg-gray-50 p-6 text-center">
                      <GoBookmark className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="text-gray-900 font-medium mb-1">No pinned repositories</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {username} hasn't pinned any repositories yet
                      </p>
                      {isCurrentUser && (
                        <Link 
                          href="/dashboard"
                          className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                        >
                          Customize your pins
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                
                {readmeContent && (
                  <div className="mb-8">
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex items-center">
                        <FiBook className="text-gray-600 mr-2" />
                        <h3 className="text-sm font-medium text-gray-900">
                          {username} / README.md
                        </h3>
                      </div>
                      <div className="p-4 bg-white prose max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {readmeContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'repositories' && (
              <div>
                <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-auto">
                    <input 
                      type="text" 
                      placeholder="Find a repository..." 
                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiFilter className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100">
                      Type
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100">
                      Language
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100">
                      Sort
                    </button>
                    {isCurrentUser && (
                      <Link 
                        href="/new" 
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 ml-2">
                        New
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-300">
                  {pinnedRepos.length > 0 ? (
                    pinnedRepos.map((repo: any) => (
                      <div key={repo.id} className="py-6 border-b border-gray-300">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-medium">
                              <a 
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {repo.name}
                              </a>
                            </h3>
                            
                            {repo.description && (
                              <p className="mt-1 text-sm text-gray-600">
                                {repo.description}
                              </p>
                            )}
                            
                            <div className="mt-3 flex flex-wrap items-center text-xs text-gray-600 gap-4">
                              {repo.language && (
                                <div className="flex items-center">
                                  <span 
                                    className="w-3 h-3 rounded-full mr-1"
                                    style={{ backgroundColor: repo.language && repo.language in languageColors ? languageColors[repo.language as keyof typeof languageColors].color : '#8b949e' }}
                                  ></span>
                                  <span>{repo.language}</span>
                                </div>
                              )}
                              
                              {repo.stargazers_count > 0 && (
                                <a
                                  href={`${repo.html_url}/stargazers`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center hover:text-blue-600"
                                >
                                  <GoStar className="mr-1" />
                                  {repo.stargazers_count.toLocaleString()}
                                </a>
                              )}
                              
                              {repo.forks_count > 0 && (
                                <a
                                  href={`${repo.html_url}/network/members`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center hover:text-blue-600"
                                >
                                  <GoRepoForked className="mr-1" />
                                  {repo.forks_count.toLocaleString()}
                                </a>
                              )}
                              
                              <span className="text-xs">Updated 3 days ago</span>
                            </div>
                          </div>
                          
                          <div>
                            <button className="flex items-center text-sm px-3 py-1 border border-gray-300 rounded-md font-medium text-gray-700 bg-gray-50 hover:bg-gray-100">
                              <GoStar className="mr-1" />
                              Star
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center">
                      <GoRepo className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {username} doesn't have any public repositories yet.
                      </h3>
                      <p className="text-gray-600">
                        Repositories are where work happens on GitHub.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'projects' && (
              <div className="py-16 text-center">
                <GoProject className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {username} doesn't have any projects yet.
                </h3>
                <p className="text-gray-600 mb-6">
                  Projects help you organize and prioritize your work.
                </p>
                {isCurrentUser && (
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100">
                    Create a new project
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}