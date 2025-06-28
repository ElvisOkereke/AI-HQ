# 🚀 AI.HQ - Multi-Provider AI Chat Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC)](https://tailwindcss.com/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4-purple)](https://next-auth.js.org/)

> **🎯 Production-Ready AI Chat Platform** - Enterprise-grade multi-provider AI conversations

A sophisticated, full-stack AI chat platform built with Next.js 15 and modern React architecture. Features seamless integration with multiple AI providers (Google Gemini, Nvidia NIMs, HuggingFace), advanced logging systems, responsive mobile design, and comprehensive user management. Perfect for developers and teams who need a reliable, scalable AI chat solution.

## ✨ Features

### 🤖 Multi-Provider AI Integration
- **Multiple AI Providers** - Google Gemini, Nvidia NIMs, HuggingFace, OpenAI, Anthropic
- **Dynamic Model Switching** - Change AI models mid-conversation with context preservation
- **Streaming Responses** - Real-time AI response streaming with typing indicators
- **Image Generation** - AI-powered image creation (Gemini 2.0 Flash)
- **Context Preservation** - Intelligent conversation history management
- **Provider Registry** - Modular system for easy AI provider integration

### 🔐 Advanced Authentication & User Management
- **NextAuth.js Integration** - Secure OAuth and credentials-based authentication
- **GitHub OAuth** - One-click sign-in with GitHub
- **User Preferences** - Persistent user settings and preferences
- **Update Notifications** - Automatic alerts for new features and updates
- **Session Management** - Secure, persistent user sessions

### 💾 Robust Data Architecture
- **MongoDB Atlas** - Cloud-native database with optimized queries
- **Chat Persistence** - Never lose conversations with automatic saving
- **Media Storage** - Integrated file and image attachment system
- **User Tracking** - Advanced user preference and activity tracking
- **Data Migration** - Seamless database schema updates

### 📱 Responsive Mobile-First Design
- **Mobile Optimized** - Fully responsive design with mobile-specific UI
- **Touch-Friendly** - Optimized for mobile touch interactions
- **Adaptive Layout** - Smart sidebar that adapts to screen size
- **Mobile Navigation** - Hamburger menu and gesture-friendly interface
- **Cross-Platform** - Consistent experience across all devices

### 🛠️ Developer Experience
- **Advanced Logging System** - Toggleable, categorized logging for debugging
- **Debug Panel** - Built-in development tools (desktop only)
- **TypeScript** - Full type safety throughout the application
- **Error Handling** - Comprehensive error management and user feedback
- **Hot Reload** - Fast development with Next.js Turbopack

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router and Turbopack
- **TypeScript** - Full type safety throughout
- **Tailwind CSS** - Responsive utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Modern icon library
- **React Hooks** - Advanced state management

### Backend & Database
- **Next.js Server Actions** - Type-safe server functions
- **MongoDB Atlas** - Cloud NoSQL database
- **NextAuth.js** - Authentication and session management
- **Server Components** - Secure server-side operations

### AI Integration
- **Google Generative AI** - Gemini 2.0 Flash and Pro models
- **Nvidia NIMs** - Enterprise AI inference
- **HuggingFace** - Open-source model access
- **OpenAI & Anthropic** - Additional provider support
- **Streaming Responses** - Real-time AI output

### Development Tools
- **ESLint & Prettier** - Code quality and formatting
- **Advanced Logging** - Categorized debug system
- **Error Boundaries** - Comprehensive error handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Google, Anthropic, and OpenAI API keys

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ElvisOkereke/t3-chat-clone.git
   cd t3-chat-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_MONGODB_URI=your_mongodb_connection_string
   GOOGLE_API_KEY=your_google_ai_api_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
ai-hq-chat/
├── src/app/                      # Next.js 15 App Router
│   ├── api/                     # API routes and authentication
│   │   └── auth/[...nextauth]/  # NextAuth.js configuration
│   ├── components/              # React components
│   │   ├── actions/             # Server actions
│   │   ├── client/              # Client-side components
│   │   │   ├── Chat.tsx         # Main chat interface
│   │   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   │   ├── UpdateAlert.tsx  # Feature update notifications
│   │   │   ├── DebugPanel.tsx   # Developer debug tools
│   │   │   └── ...              # Other UI components
│   │   └── server/              # Server-side components
│   │       └── db.tsx           # Database operations
│   ├── lib/                     # Utility libraries
│   │   └── providers/           # AI provider integrations
│   │       ├── google.tsx       # Google Gemini integration
│   │       ├── nvidia.tsx       # Nvidia NIMs integration
│   │       ├── huggingface.tsx  # HuggingFace integration
│   │       └── registry.tsx     # Provider management
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   │   ├── logger.tsx           # Advanced logging system
│   │   └── mediaUtils.tsx       # Media handling utilities
│   ├── globals.css              # Global styles and Tailwind
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Main application page
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
└── package.json                 # Dependencies and scripts
```

## 🔧 Configuration

### Required Environment Variables
```env
# Database
NEXT_PUBLIC_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# AI Providers
GOOGLE_API_KEY=your-google-ai-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
NVIDIA_API_KEY=your-nvidia-nim-api-key
```

### Database Setup
1. Create a MongoDB Atlas cluster
2. Create a database user with read/write permissions
3. Get your connection string and add it to `.env.local`
4. The app will automatically create required collections

### Authentication Setup
1. **GitHub OAuth**:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
   - Add client ID and secret to environment variables

2. **NextAuth.js**:
   - Generate a random secret: `openssl rand -base64 32`
   - Add it as `NEXTAUTH_SECRET` in your environment

### AI Provider Setup
- **Google Gemini**: Get API key from [Google AI Studio](https://makersuite.google.com/)
- **OpenAI**: Get API key from [OpenAI Platform](https://platform.openai.com/)
- **Anthropic**: Get API key from [Anthropic Console](https://console.anthropic.com/)
- **HuggingFace**: Get API key from [HuggingFace Settings](https://huggingface.co/settings/tokens)
- **Nvidia NIMs**: Get API key from [Nvidia Developer Portal](https://developer.nvidia.com/)

## 🎯 Key Features Showcase

### Advanced Logging System
```typescript
// Toggle logging on/off globally
logger.toggle(true);  // Enable logging
logger.toggle(false); // Disable logging

// Categorized logging for different areas
logger.db('Database operation completed');
logger.ai('AI response received');
logger.auth('User authentication successful');
logger.chat('New message sent');

// Available in browser console
window.logger.toggle(); // Toggle from dev tools
```

### Dynamic AI Provider Switching
```typescript
// Switch models mid-conversation with context preservation
const handleModelChange = async (newModel: LLMModel) => {
  if (activeChat && activeChat.model !== newModel.id) {
    const result = await updateChatModelAction(activeChat._id, newModel.id, user);
    if (result.success) {
      setActiveChat(prev => ({ ...prev, model: newModel.id }));
      setSelectedModel(newModel);
    }
  }
};
```

### Update Notification System
```typescript
// Automatic update alerts for users
const UPDATE_CONTENT = {
  version: '2024-12-28-v1',
  title: 'New Features Available! 🎉',
  features: [
    { icon: '🔧', title: 'Advanced Logging System' },
    { icon: '📱', title: 'Enhanced Mobile Experience' },
    { icon: '🔔', title: 'Update Notifications' }
  ]
};

// Check if user has seen this update
const hasSeenUpdate = user.lastSeenUpdate === CURRENT_UPDATE_VERSION;
```

### Mobile-First Responsive Design
```typescript
// Smart responsive behavior
const [isMobile, setIsMobile] = useState(false);

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
```

## 📱 Mobile Experience

### Mobile-Specific Features
- **Hamburger Navigation** - Touch-friendly sidebar access
- **Responsive Layout** - Optimized for all screen sizes
- **Touch Gestures** - Swipe-friendly interactions
- **Mobile Header** - Dedicated mobile navigation
- **Adaptive UI** - Smart component sizing for mobile
- **Desktop-Only Features** - Debug panel restricted to desktop for better UX

### Mobile Development Considerations
```typescript
// Mobile-responsive sidebar
const [isMobile, setIsMobile] = useState(false);
const [showMobileSidebar, setShowMobileSidebar] = useState(false);

// Mobile-specific UI adjustments
className={`${
  isMobile 
    ? 'fixed left-0 top-0 h-full z-50 transform transition-transform'
    : 'relative'
}`}
```

## 🛠️ Development Features

### Debug Panel (Desktop Only)
- **Logging Control** - Toggle logging on/off
- **Console Management** - Clear console, test messages
- **Development Tools** - Built-in debugging utilities
- **Status Monitoring** - Real-time logging status
- **Browser Integration** - Access via `window.logger`

### Advanced Logging System
```typescript
// Categorized logging for different components
logger.db('Database query executed successfully');
logger.ai('AI model response received');
logger.auth('User authentication completed');
logger.chat('Message sent to conversation');

// Production-safe logging (disabled by default)
logger.toggle(false); // Always starts disabled
```

### Update Management
- **Version Tracking** - Track user's last seen update
- **Feature Announcements** - Beautiful update notifications
- **User Preferences** - Persistent settings storage
- **Database Migrations** - Seamless schema updates

## 🎨 Design Philosophy

This project embodies modern web development principles:

- **Mobile-First Architecture** - Responsive design from the ground up
- **Server-First Components** - Leveraging Next.js 15's server components
- **Type Safety** - Full TypeScript implementation throughout
- **Performance Optimized** - Code splitting, lazy loading, and Turbopack
- **Scalable Design** - Modular component and provider architecture
- **Security Focused** - Server-only sensitive operations
- **Developer Experience** - Advanced tooling and debugging capabilities

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
# Connect your MongoDB Atlas cluster
# Configure OAuth providers
```

### Docker Deployment
```dockerfile
# Build the app
npm run build

# Create Docker image
docker build -t ai-hq-chat .

# Run container
docker run -p 3000:3000 ai-hq-chat
```

### Production Checklist
- [ ] Environment variables configured
- [ ] MongoDB Atlas connected
- [ ] OAuth providers set up
- [ ] AI API keys added
- [ ] Domain and SSL configured
- [ ] Error monitoring enabled

## 🏆 Project Highlights

### Why This Project Stands Out
- **Enterprise-Grade Architecture** - Production-ready with Next.js 15 and Turbopack
- **Multi-Provider AI Integration** - Seamless switching between AI providers
- **Mobile-First Design** - Fully responsive with mobile-specific optimizations
- **Advanced Developer Tools** - Built-in logging system and debug panel
- **User-Centric Features** - Update notifications and preference management
- **Type Safety** - Complete TypeScript implementation with proper error handling

### Innovation Points
- **Dynamic Model Switching** - Change AI providers mid-conversation
- **Advanced Logging System** - Categorized, toggleable debugging
- **Update Management** - Automatic feature announcements
- **Mobile Optimization** - Touch-friendly, responsive design
- **Developer Experience** - Built-in debug tools and comprehensive documentation
- **Scalable Architecture** - Modular provider system for easy extension

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Theo Browne** for inspiring the T3 stack and hosting the cloneathon

## 📞 Contact

**Elvis Okereke**
- GitHub: [@ElvisOkereke](https://github.com/ElvisOkereke)
- Project Link: [https://github.com/ElvisOkereke/t3-chat-clone](https://github.com/ElvisOkereke/t3-chat-clone)

---

⭐ **Star this repository if you found it helpful!** ⭐
