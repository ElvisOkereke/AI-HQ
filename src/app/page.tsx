'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/client/Sidebar';
import ChatComponent from "./components/client/Chat";
import SignInForm from './components/client/SignIn';
import SignUpForm from './components/client/SignUp';
import UpdateAlert from './components/client/UpdateAlert';
import { Building2, Menu } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";
import { Chat, User } from "./types/types";
import { getUserPreferencesAction, createOrUpdateOAuthUserAction } from './components/actions/dbActions';
import { logger } from './utils/logger';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat>();
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [userPreferences, setUserPreferences] = useState<User>({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const router = useRouter();

  const guestUser: User = { name: 'Guest', email: 'guest@local', isGuest: true };
  const effectiveUser = isGuestMode ? guestUser : userPreferences;
  
  // Check screen size for mobile responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowMobileSidebar(false);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Load user preferences and setup logging
  useEffect(() => {
    if (session?.user?.email) {
      const loadUserPreferences = async () => {
        try {
          const result = await getUserPreferencesAction(session.user!.email!);
          if (result.success && result.data && session.user) {
            const userData: User = {
              name: session.user.name || null,
              email: session.user.email || null,
              lastSeenUpdate: result.data.lastSeenUpdate || null,
              preferences: result.data.preferences || { loggingEnabled: false }
            };
            setUserPreferences(userData);
            
            // Configure logging based on user preferences
            if (result.data.preferences?.loggingEnabled) {
              logger.toggle(true);
            }
            
            logger.auth('User preferences loaded:', userData);
          } else {
            // User preferences not found - likely an OAuth user not yet in database
            // Try to create the OAuth user
            logger.warn('User preferences not found, attempting to create OAuth user');
            
            if (session.user?.email) {
              try {
                const createResult = await createOrUpdateOAuthUserAction(
                  session.user.email,
                  session.user.name,
                  'github' // Default to github, can be improved to detect actual provider
                );
                
                if (createResult.success) {
                  logger.auth('OAuth user created/updated successfully');
                  
                  // Retry loading preferences
                  const retryResult = await getUserPreferencesAction(session.user.email);
                  if (retryResult.success && retryResult.data) {
                    const userData: User = {
                      name: session.user.name || null,
                      email: session.user.email || null,
                      lastSeenUpdate: retryResult.data.lastSeenUpdate || null,
                      preferences: retryResult.data.preferences || { loggingEnabled: false }
                    };
                    setUserPreferences(userData);
                    logger.auth('User preferences loaded after OAuth user creation:', userData);
                    return;
                  }
                }
              } catch (createError) {
                logger.error('Failed to create OAuth user:', createError);
              }
            }
            
            // Fallback: Set default user data if all else fails
            if (session.user) {
              const defaultUserData: User = {
                name: session.user.name || null,
                email: session.user.email || null,
                lastSeenUpdate: undefined,
                preferences: { loggingEnabled: false }
              };
              setUserPreferences(defaultUserData);
              logger.auth('Using default user data as fallback');
            }
          }
        } catch (error) {
          logger.error('Failed to load user preferences:', error);
          // Set default user data on error
          if (session?.user) {
            const defaultUserData: User = {
              name: session.user.name || null,
              email: session.user.email || null,
              lastSeenUpdate: undefined,
              preferences: { loggingEnabled: false }
            };
            setUserPreferences(defaultUserData);
          }
        }
      };
      
      loadUserPreferences();
    }
  }, [session?.user?.email]);

  // Handle logout using NextAuth (or just exit guest mode, which never had a real session)
  const handleLogout = () => {
    if (isGuestMode) {
      setIsGuestMode(false);
      setActiveChat(undefined);
      setChatList([]);
      return;
    }
    signOut();
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
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

  // Show login page if not authenticated and not in guest mode
  if (!session && !isGuestMode) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white font-sans">
        <div className="text-center w-full max-w-sm">
          <Building2 className="w-24 h-24 text-purple-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-2">Welcome to AI.HQ</h1>
          <p className="text-gray-400 mb-8">Sign in to begin your conversation with the future of AI.</p>

          {/* Guest mode - try instantly, no signup */}
          <button
            onClick={() => setIsGuestMode(true)}
            className="w-full mb-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Try as Guest — no signup required
          </button>

          {/* OAuth Sign-in buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => signIn('github')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98.01 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Alternative: Credentials sign-in */}
          <div className="border-t border-gray-700 pt-5">
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

  // Show main app if authenticated (or in guest mode)
  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
      {/* Update Alert */}
      {userPreferences.email && (
        <UpdateAlert
          user={userPreferences}
          onDismiss={() => {
            // Refresh user preferences to hide the alert
            setUserPreferences(prev => ({
              ...prev,
              lastSeenUpdate: '2024-12-28-v1' // Current version
            }));
          }}
        />
      )}

      {/* Mobile Sidebar Backdrop */}
      {isMobile && showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${isMobile ?
        `fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ${
          showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
        }` :
        ''
      }`}>
        <Sidebar
          chatList={chatList}
          activeChat={activeChat}
          setChatList={setChatList}
          setActiveChat={setActiveChat}
          onLogout={handleLogout}
          user={effectiveUser}
        />
      </div>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 ${isMobile ? 'w-full' : ''}`}>
        {/* Guest mode banner */}
        {isGuestMode && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-900/40 border-b border-purple-700 text-sm text-purple-200 text-center">
            <span>Guest mode — chats aren&apos;t saved and the model is locked. Sign up to keep your history and unlock all models.</span>
          </div>
        )}

        {/* Mobile Header with Menu Button */}
        {isMobile && (
          <header className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-800">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">AI.HQ</h1>
          </header>
        )}

        {/* Chat Component */}
        <div className="flex-1 min-h-0">
          <ChatComponent
            key={activeChat?._id || 'new'}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            setChatList={setChatList}
            user={effectiveUser}
          />
        </div>
      </main>
    </div>
  );
}

//TODO account/time based rated limit, add logic for resumeable streams when interrupted, chat sharing (export to pdf), finalize attachments.  