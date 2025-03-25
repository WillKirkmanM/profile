import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FiGithub, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const githubUser = document.cookie
      .split('; ')
      .find(row => row.startsWith('github_user='))
      ?.split('=')[1];
    
    if (githubUser) {
      setIsAuthenticated(true);
      setUsername(githubUser);
    }
    
    const handleClickOutside = (event: { target: any; }) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <header className="bg-[#0d1117] text-white sticky top-0 z-50 border-b border-gray-700">
          <section className="py-20 bg-primary text-white">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Streamline Your Workflow?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of teams already using StreamLine to boost their productivity.
        </p>
        <Button size="lg" variant="secondary">
          Start Your Free Trial
        </Button>
      </div>
    </section>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold flex items-center">
              <FiGithub className="mr-2 text-white" />
              <span className="font-sans">Parson Profile</span>
            </Link>
            
            <div className="hidden md:block ml-6">
              <a href="#features" className="px-3 py-2 text-sm text-gray-300 hover:text-white">
                Features
              </a>
              <a href="#testimonials" className="px-3 py-2 text-sm text-gray-300 hover:text-white">
                Testimonials
              </a>
              <a href="#faq" className="px-3 py-2 text-sm text-gray-300 hover:text-white">
                FAQ
              </a>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white"
                  >
                    <img 
                      src={`https://github.com/${username}.png`} 
                      alt={username}
                      className="w-5 h-5 rounded-full mr-2"
                    />
                    {username}
                    <FiChevronDown className="ml-1" />
                  </button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-[#161b22] rounded-md shadow-lg py-1 z-10 border border-gray-700"
                      >
                        <Link 
                          href="/dashboard" 
                          className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                        >
                          Dashboard
                        </Link>
                        <Link 
                          href={`/${username}`}
                          className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                        >
                          Your profile
                        </Link>
                        <div className="border-t border-gray-700 my-1"></div>
                        <Link 
                          href="/auth/signout"
                          className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                        >
                          Sign out
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link 
                    href="/auth/github" 
                    className="px-3 py-1.5 rounded-md text-sm text-white hover:bg-gray-800 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link 
                    href="/auth/github" 
                    className="px-3 py-1.5 rounded-md text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700 bg-[#0d1117]">
              <a
                href="#features"
                className="block px-3 py-2 rounded-md text-base text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="block px-3 py-2 rounded-md text-base text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonials
              </a>
              <a
                href="#faq"
                className="block px-3 py-2 rounded-md text-base text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </a>
              
              {isAuthenticated ? (
                <>
                  <div className="pt-4 pb-3 border-t border-gray-700">
                    <div className="flex items-center px-3">
                      <div className="flex-shrink-0">
                        <img 
                          src={`https://github.com/${username}.png`} 
                          alt={username}
                          className="h-10 w-10 rounded-full"
                        />
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-white">{username}</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Link
                        href="/dashboard"
                        className="block px-3 py-2 rounded-md text-base text-gray-300 hover:text-white hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href={`/${username}`}
                        className="block px-3 py-2 rounded-md text-base text-gray-300 hover:text-white hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Your profile
                      </Link>
                      <Link
                        href="/auth/signout"
                        className="block px-3 py-2 rounded-md text-base text-gray-300 hover:text-white hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign out
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="pt-4 pb-3 border-t border-gray-700 flex flex-col space-y-2">
                  <Link
                    href="/auth/github"
                    className="flex items-center justify-center px-3 py-2 rounded-md text-base text-white hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/github"
                    className="flex items-center justify-center px-3 py-2 rounded-md text-base bg-green-600 text-white hover:bg-green-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up with GitHub
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}