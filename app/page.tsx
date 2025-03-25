'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import Link from 'next/link';
import Image from 'next/image';

import parsonlabs from "@/public/parsonlabs.png"

const SpinningCube = () => {
  return (
    <mesh rotation={[0, Math.PI / 4, 0]}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#FFFFFF" wireframe />
    </mesh>
  );
};

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  
  useEffect(() => {
    const githubUser = document.cookie
      .split('; ')
      .find(row => row.startsWith('github_user='))
      ?.split('=')[1];
    
    if (githubUser) {
      setIsAuthenticated(true);
      setUsername(githubUser);
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white antialiased font-['SF Pro Display', 'Inter', 'system-ui', 'sans-serif']">
      <div className="fixed inset-0 -z-10">
        <Canvas>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} />
          <Stars radius={100} depth={50} count={1000} factor={4} />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
          <SpinningCube />
        </Canvas>
      </div>
      
      <header className="container mx-auto px-8 py-6 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Image src={parsonlabs} alt="ParsonLabs Logo" width={200} height={200} className="rounded-lg" />
          </div>
          <span className="font-medium text-xl tracking-tight">Parson Profile</span>
        </motion.div>
        
        <nav>
          <ul className="flex gap-8">
            {isAuthenticated ? (
              <li className="flex items-center">
                <Link href="/dashboard" className="flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/20 px-4 py-2.5 rounded-full transition-colors text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <Image src={`https://github.com/${username}.png`} alt={`${username} Image`} className='w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center' width={100} height={100} />
                  </div>
                  <span>{username}</span>
                </Link>
              </li>
            ) : (
              <li>
                <Link href="/api/auth/" className="bg-white/90 text-black hover:bg-white px-5 py-2.5 rounded-full transition-colors text-sm font-medium">
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </header>
      
      <section className="container mx-auto px-8 pt-20 md:pt-32 pb-44">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="mb-6 inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium tracking-wide"
          >
            Introducing Parson Profile
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Your GitHub Profile, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              reimagined.
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Transform your contributions into a portfolio that showcases your true potential.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-5 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="relative group w-full sm:w-auto">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-300 animate-spin-slow"></div>
              <Link 
                href="/api/auth/" 
                className="relative flex items-center justify-center bg-white text-black hover:bg-gray-100 hover:text-gray-800 px-8 py-4 rounded-full text-base font-medium transition-all shadow-lg hover:shadow-xl w-full"
              >
                Transform your profile
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            className="mt-20 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1 }}
          >
          </motion.div>
        </div>
      </section>
    </div>
  );
}