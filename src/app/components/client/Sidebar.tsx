'use client';
import { Plus, MessageSquare, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { fetchChatsByUserAction } from '../actions/dbActions';
import { SidebarProps } from "../../types/types"

export default function Sidebar({ chatList, setChatList, activeChat, setActiveChat, onLogout, user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // For mobile overlay state
  
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      
      // Auto-collapse on mobile, but don't auto-expand on desktop
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
        setIsOpen(false);
      }
    };

    // Check initial screen size
    checkScreenSize();
    
    // Add event listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isCollapsed]);
  
  useEffect(() => {
    if(user){// fetch only if user is logged in
    const fetchAllChats = async () => {
      const fetchChats = await fetchChatsByUserAction(user.email as string);
      if (!fetchChats.success) {
        console.error('Failed to fetch chats:', fetchChats.error);
        throw new Error(fetchChats.error);
      }
      setChatList(fetchChats.data ?? []);
    };
    fetchAllChats();
    }
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      // On mobile, toggle the overlay
      setIsOpen(!isOpen);
    } else {
      // On desktop, toggle collapse
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleChatSelect = (chat: any) => {
    setActiveChat(chat);
    // Close sidebar on mobile after selection
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleNewChat = () => {
    setActiveChat(undefined);
    // Close sidebar on mobile after selection
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Mobile overlay backdrop
  if (isMobile && isOpen) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
        
        {/* Sidebar Overlay */}
        <div className="fixed left-0 top-0 h-full w-72 bg-gray-800 border-r border-gray-700 p-4 z-50 transform transition-transform duration-300">
          {/* Header with close button */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-xl font-bold">AI-HQ</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
              title="Close sidebar"
            >
              <ChevronLeft className="w-3 h-3 text-gray-300" />
            </button>
          </div>

          {/* New Chat Button */}
          <button 
            onClick={handleNewChat}
            className="flex items-center justify-center w-full px-4 py-3 mb-6 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Plus className="w-5 h-5" />
            <span className="ml-2">New Chat</span>
          </button>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
            <h2 className="text-sm font-semibold text-gray-400 px-2 mb-2">Recent</h2>
            {chatList.map((chat, index) => (
              <button
                key={chat._id.toString()}
                onClick={() => handleChatSelect(chat)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeChat === chat
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-700/50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="truncate flex-1">{chat.title}</span>
              </button>
            ))}
          </div>
          
          {/* Footer / User Profile Area */}
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-300"/>
              </div>
              <span className="font-semibold flex-1">{user?.name ?? "User"}</span>
              <button 
                onClick={onLogout} 
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar (normal behavior)
  return (
    <div className={`flex flex-col bg-gray-800 border-r border-gray-700 p-4 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-72'
    } ${isMobile ? 'hidden' : ''}`}>
      {/* Collapse Toggle Button */}
      <div className={isCollapsed ? "flex justify-left ml-2 mb-3" : "flex justify-left mb-3"}>
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-300" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-300" />
          )}
        </button>
        {!isCollapsed && <span className="ml-15 mt-1 text-xl font-bold">AI-HQ</span>}
      </div>

      {/* New Chat Button */}
      <button 
        onClick={handleNewChat}
        className={`flex items-center justify-center w-full px-4 py-3 mb-6 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400`}
        title={isCollapsed ? "New Chat" : ""}
      >
        <Plus className="w-5 h-5" />
        {!isCollapsed && <span className="ml-2">New Chat</span>}
      </button>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-gray-400 px-2 mb-2">Recent</h2>
        )}
        {chatList.map((chat, index) => (
          <button
            key={chat._id.toString()}
            onClick={() => handleChatSelect(chat)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeChat === chat
                ? 'bg-gray-700'
                : 'hover:bg-gray-700/50'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? chat.title : ""}
          >
            {isCollapsed ? (
              <span className="text-xs font-semibold text-gray-300">{(index + 1).toString()}</span>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="truncate flex-1">{chat.title}</span>
              </>
            )}
          </button>
        ))}
      </div>
      
      {/* Footer / User Profile Area */}
      <div className="pt-4 border-t border-gray-700">
        <div className={`flex items-center p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer ${
          isCollapsed ? 'justify-center' : 'gap-3'
        }`}>
          {isCollapsed ? (
            <button 
              onClick={onLogout} 
              className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center hover:bg-gray-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-300" />
            </button>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-300"/>
              </div>
              <span className="font-semibold flex-1">{user?.name ?? "User"}</span>
              <button 
                onClick={onLogout} 
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}