'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/client/Sidebar';
import Chat from "./components/client/Chat";
import SignInForm from './components/client/SignIn';
import SignUpForm from './components/client/SignUp';
import { Bot } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'

export default function HomePage() {
  const { data: session, status } = useSession();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const router = useRouter();

  // Handle logout using NextAuth
  const handleLogout = () => signOut();

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <Bot className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in form if requested
  if (showSignInForm) {
    return (
      <SignInForm 
        onBack={() => setShowSignInForm(false)} 
      />
    );
  }

  // Show sign-up form if requested
  if (showSignUpForm) {
    return (
      <SignUpForm 
        onBack={() => setShowSignUpForm(false)}
        onSignInClick={() => {
          setShowSignUpForm(false);
          setShowSignInForm(true);
        }}
      />
      )
  }

  // Show login page if not authenticated
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white font-sans">
        <div className="text-center w-full max-w-sm">
          <Bot className="w-24 h-24 text-purple-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-2">Welcome to Multi AI Chat</h1>
          <p className="text-gray-400 mb-8">Sign in to begin your conversation with the future of AI.</p>
          
          {/* OAuth Sign-in buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => signIn('github')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98.01 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
              </svg>
              Continue with GitHub
            </button>
            <button
              onClick={() => signIn('google')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <g>
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.49 30.74 0 24 0 14.82 0 6.71 5.48 2.69 13.44l7.98 6.2C12.38 13.02 17.74 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.02l7.19 5.6C43.98 37.05 46.1 31.37 46.1 24.55z"/>
                  <path fill="#FBBC05" d="M10.67 28.64A14.5 14.5 0 0 1 9.5 24c0-1.62.28-3.18.77-4.64l-7.98-6.2A23.96 23.96 0 0 0 0 24c0 3.81.91 7.41 2.53 10.56l8.14-5.92z"/>
                  <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.19-5.6c-2 1.34-4.56 2.15-8.71 2.15-6.26 0-11.62-3.52-14.33-8.64l-8.14 5.92C6.71 42.52 14.82 48 24 48z"/>
                </g>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Alternative: Credentials sign-in */}
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-400 mb-4">Or sign in/up with email</p>
            <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowSignInForm(true)}
              className="px-10 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors w-50%"
            >
              Sign In
            </button><button
              onClick={() => setShowSignUpForm(true)}
              className="px-10 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-500 transition-colors w-50%"
            >
              Sign Up
            </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main app if authenticated
  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <Sidebar 
        activeChatId={activeChatId} 
        setActiveChatId={setActiveChatId} 
        onLogout={handleLogout}
        user={session.user} // Pass user data to sidebar
      />
      <main className="flex-1 flex flex-col">
        <Chat key={activeChatId || 'new'} chatId={activeChatId} />
      </main>
    </div>
  );
}