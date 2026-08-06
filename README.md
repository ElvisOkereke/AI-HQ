# 🚀 AI.HQ - Multi-Provider AI Chat Platform

[![CI](https://github.com/ElvisOkereke/t3-chat-clone/actions/workflows/ci.yml/badge.svg)](https://github.com/ElvisOkereke/t3-chat-clone/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC)](https://tailwindcss.com/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4-purple)](https://next-auth.js.org/)

A full-stack AI chat platform built with Next.js 15, with pluggable integrations for Google Gemini, Nvidia NIM, and HuggingFace models. Supports streaming responses, image generation, per-chat model switching, media attachments, and a no-signup guest mode.

## 🔗 Live Demo

**[<!-- TODO: paste Vercel production URL here -->](#)**

Click "Try as Guest" on the landing page to start chatting immediately — no account required. Guest sessions are locked to a single default model and aren't saved to a database; sign up (email/password or GitHub) to unlock model switching and persistent chat history.

## 📸 Screenshots

<!--
TODO: Replace this section with actual screenshots before sharing the repo. Recommended captures:
  1. Landing page (signed out) showing the "Sign In" and "Try as Guest" entry points
  2. An active chat with a streamed response and the model dropdown open
  3. The guest-mode banner + locked model selector
  4. Mobile view of the sidebar/hamburger navigation
Drop images in a `docs/screenshots/` folder and reference them here, e.g.:
  ![Landing page](docs/screenshots/landing.png)
-->

## ✨ Features

### 🤖 Multi-Provider AI Integration
- **Multiple AI Providers** - Google Gemini, Nvidia NIM, HuggingFace
- **Dynamic Model Switching** - Change AI models mid-conversation with context preservation
- **Streaming Responses** - Real-time AI response streaming with typing indicators
- **Image Generation** - AI-powered image creation (Gemini 2.0 Flash)
- **Context Preservation** - Intelligent conversation history management
- **Provider Registry** - Modular system for easy AI provider integration

### 🔐 Authentication & User Management
- **NextAuth.js Integration** - Secure OAuth and credentials-based authentication with bcrypt password hashing
- **GitHub OAuth** - One-click sign-in with GitHub
- **Guest Mode** - Try the app instantly with no signup required; chats aren't persisted and the model is locked to control API cost, enforced both in the UI and server-side in the AI actions
- **User Preferences** - Persistent user settings and preferences
- **Session Management** - Secure, persistent user sessions

### 💾 Data Architecture
- **MongoDB** - Cloud-native database with optimized queries
- **Chat Persistence** - Automatic saving of conversations for signed-in users
- **Media Storage** - Integrated file and image attachment system
- **Rate Limiting** - In-memory, per-instance rate limiting on guest AI calls (best-effort on serverless; see [Known Limitations](#-known-limitations))

### 📱 Responsive Mobile-First Design
- **Mobile Optimized** - Fully responsive design with mobile-specific UI
- **Adaptive Layout** - Smart sidebar that adapts to screen size
- **Mobile Navigation** - Hamburger menu and gesture-friendly interface

### 🛠️ Developer Experience
- **Automated Tests** - Vitest + React Testing Library covering provider routing, guest-mode gating, and core UI components
- **CI Pipeline** - GitHub Actions runs lint, typecheck, and tests on every push/PR
- **Advanced Logging System** - Toggleable, categorized logging for debugging
- **Debug Panel** - Built-in development tools (desktop only)
- **TypeScript** - Full type safety throughout the application

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router and Turbopack
- **TypeScript** - Full type safety throughout
- **Tailwind CSS** - Responsive utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Modern icon library

### Backend & Database
- **Next.js Server Actions** - Type-safe server functions
- **MongoDB** - NoSQL database, native driver
- **NextAuth.js** - Authentication and session management (GitHub OAuth + credentials/bcrypt)
- **Server Components** - Secure server-side operations

### AI Integration
- **Google Generative AI** - Gemini 2.0/2.5 Flash models
- **Nvidia NIM** - Enterprise AI inference (Llama 3.1/3.2, Phi-3 Vision)
- **HuggingFace** - Open-source model access (Llama 4, Mistral)
- **Streaming Responses** - Real-time AI output via `ai/rsc`

### Testing & Tooling
- **Vitest + React Testing Library** - Unit and component tests
- **ESLint** - Code quality (`next/core-web-vitals` + `next/typescript`)
- **GitHub Actions** - CI on push/PR (lint, typecheck, test)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- At least one AI provider API key (Google, HuggingFace, or Nvidia)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ElvisOkereke/t3-chat-clone.git
   cd t3-chat-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy [`.env.example`](.env.example) to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Running tests

```bash
npm run test        # run the Vitest suite once
npm run lint        # ESLint
npx tsc --noEmit    # type-check
```

## 🏗️ Project Structure

```
ai-hq/
├── src/app/                          # Next.js 15 App Router
│   ├── api/                         # API routes and authentication
│   │   └── auth/[...nextauth]/      # NextAuth.js configuration
│   ├── components/
│   │   ├── actions/                 # Server actions (dbActions.tsx)
│   │   ├── client/                  # Client-side components
│   │   │   ├── Chat.tsx             # Chat orchestrator
│   │   │   ├── chat/                # Chat internals (composer, message bubble, send/edit/branch logic)
│   │   │   ├── ModelDropdown.tsx    # Model picker entry point
│   │   │   ├── models.ts            # Model catalog data
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── SignIn.tsx           # Credentials + GitHub OAuth sign-in
│   │   │   └── ...                  # Other UI components
│   │   └── server/
│   │       └── db.tsx               # Database operations
│   ├── lib/
│   │   ├── rateLimiter.ts           # In-memory guest rate limiter
│   │   └── providers/               # AI provider integrations
│   │       ├── google.tsx
│   │       ├── nvidia.tsx
│   │       ├── huggingface.tsx
│   │       └── registry.tsx         # Provider routing/selection
│   ├── types/                       # TypeScript type definitions
│   ├── utils/
│   │   ├── logger.tsx                # Categorized logging system
│   │   └── mediaUtils.tsx            # Media handling utilities
│   ├── layout.tsx
│   └── page.tsx                      # Landing page / guest entry / main app shell
├── .github/workflows/ci.yml          # CI: lint + typecheck + test
├── vitest.config.ts
└── package.json
```

## 🔧 Configuration

### Environment Variables

See [`.env.example`](.env.example) for the full list. At minimum you need `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and one AI provider key.

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
GITHUB_ID=your-github-oauth-client-id
GITHUB_SECRET=your-github-oauth-client-secret

# AI Providers
GOOGLE_API_KEY=your-google-ai-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
NVIDIA_API_KEY=your-nvidia-nim-api-key
```

### Database Setup
1. Create a MongoDB Atlas cluster (or run MongoDB locally)
2. Create a database user with read/write permissions
3. Add the connection string as `MONGODB_URI`
4. The app creates required collections automatically on first write

### Authentication Setup
1. **GitHub OAuth**:
   - GitHub Settings → Developer settings → OAuth Apps → New OAuth App
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Add the client ID/secret to your env vars
2. **NextAuth.js**:
   - Generate a secret: `openssl rand -base64 32`
   - Set it as `NEXTAUTH_SECRET`

### AI Provider Setup
- **Google Gemini**: [Google AI Studio](https://makersuite.google.com/)
- **HuggingFace**: [HuggingFace Settings](https://huggingface.co/settings/tokens)
- **Nvidia NIM**: [Nvidia Developer Portal](https://developer.nvidia.com/)

## ⚠️ Known Limitations

- **Guest rate limiting is in-memory and per-instance.** On serverless platforms (Vercel), each function instance has its own counter, so it's a best-effort deterrent rather than a hard cap. A hardened version would back it with Upstash Redis or similar shared store.
- **File/image upload attachments are UI-scaffolded but disabled** (`handleFileUpload` short-circuits) pending further work.
- **`registry.tsx` and other server-only modules require `// @vitest-environment node`** in their tests, since `server-only` throws when imported in a DOM environment.

## 🎨 Design Notes

- **Guest mode** is implemented as a synthetic, client-only `User` object (`{ isGuest: true }`) rather than a real session — it never touches NextAuth or MongoDB. Persistence calls and model switching are gated behind `user.isGuest` both in the UI and (defense in depth) inside the server actions themselves.
- **Provider registry** (`lib/providers/registry.tsx`) routes a model ID string to the right provider client, so adding a new provider means implementing one interface and registering it — the rest of the app is provider-agnostic.
- **Mobile-first layout** — the sidebar collapses to a hamburger menu and the chat composer is responsive down to small viewports.

## 🚀 Deployment

This project is deployed on **Vercel**, which builds and deploys automatically on push to `master` via its native Git integration — there's no separate CI/CD deploy step (see `.github/workflows/ci.yml`, which only runs lint/typecheck/test).

```bash
npm i -g vercel
vercel
```

Set the environment variables listed above in the Vercel project dashboard before deploying.

### Docker (alternative)
```bash
npm run build
docker build -t ai-hq .
docker run -p 3000:3000 ai-hq
```

## 🧬 What's Original vs. Starting Point

This project began as an entry for Theo Browne's T3 Chat Cloneathon. Since then it's been substantially reworked: multi-provider AI routing (Gemini/Nvidia NIM/HuggingFace) via a provider registry, guest mode with server-enforced model/rate limits, credentials auth with bcrypt hashing, the categorized logging system, the mobile-responsive layout, and the automated test suite/CI pipeline are all additions on top of the original T3-stack scaffold.

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
