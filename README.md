# 🤖 AI Chat Assistant - Mentora 

A pixel-perfect Mentora built with Next.js, featuring advanced AI capabilities, file uploads, chat memory, and seamless user experience.

![AI Chat Assistant](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk)

## 🚀 Live Demo

**[ Live Link](https://ai-chat-galaxy-assignment.vercel.app/)**

## ✨ Features

### 🎯 Core Chat Interface
- **Pixel-perfect Mentora  UI** - Exact layout, spacing, fonts, and animations
- **Real-time streaming** - Instant AI responses with smooth typing animations
- **Message editing** - Edit and regenerate previous messages seamlessly
- **Conversation management** - Create, delete, and organize chat threads
- **Mobile responsive** - Perfect experience on all devices
- **Accessibility** - Full ARIA compliance and keyboard navigation

### 🧠 AI Capabilities
- **Google Gemini AI** - Advanced language model integration
- **Context management** - Intelligent conversation memory
- **Streaming responses** - Real-time AI message generation
- **Long context handling** - Optimized for extended conversations
- **Message regeneration** - Retry failed or unsatisfactory responses

### 📁 File & Document Support
- **PDF Viewer** - Full-featured PDF viewing with zoom, navigation, and rotation
- **Document uploads** - Support for PDF, DOCX, TXT, RTF, EPUB
- **Image support** - PNG, JPG, and other image formats
- **File storage** - Secure cloud storage with Cloudinary
- **Download functionality** - Easy file access and sharing

### 🎤 Voice Input
- **Voice-to-text** - Speak your messages with real-time transcription
- **Browser speech API** - No external dependencies required
- **Visual feedback** - Recording indicators and transcript preview
- **Accessibility** - Screen reader support and keyboard controls

### 🔐 Authentication & Security
- **Clerk authentication** - Secure user registration and login
- **Protected routes** - Secure chat access and user data
- **File security** - Safe file uploads and storage
- **Session management** - Persistent user sessions

### 🎨 Modern UI/UX
- **Dark/Light themes** - Automatic theme switching
- **Smooth animations** - Polished micro-interactions
- **Loading states** - Professional loading indicators
- **Error handling** - Graceful error messages and recovery
- **Toast notifications** - User-friendly feedback system





## 🛠️ Tech Stack

### Frontend
- **Next.js 15.2.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **ShadCN/ui** - Beautiful component library
- **React PDF** - PDF viewing capabilities
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **MongoDB** - NoSQL database with Mongoose ODM
- **Google Gemini AI** - Advanced language model
- **Cloudinary** - Cloud file storage
- **Clerk** - Authentication and user management


## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **pnpm** package manager
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/abhinav2805-ux/Ai_chat_galaxy-Assignment
cd Ai_chat_galaxy-Assignment
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
# ========================================
# CLERK AUTHENTICATION (Required)
# ========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# ========================================
# DATABASE (Required)
# ========================================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority

# ========================================
# AI SERVICES (Required)
# ========================================
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# ========================================
# FILE STORAGE (Optional - for Cloudinary)
# ========================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ========================================
# MEMORY SERVICE
# ========================================
MEM0_API_KEY=your_mem0_api_key_here

# ========================================
# FILE UPLOAD (Optional - for Uploadcare)
# ========================================
UPLOADCARE_PUBLIC_KEY=your_uploadcare_public_key
UPLOADCARE_SECRET_KEY=your_uploadcare_secret_key

# ========================================
# WEBHOOKS
# ========================================
WEBHOOK_SECRET=your_webhook_secret_here

# ========================================
```

### 4. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
Ai_chat_galaxy-Assignment/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── chat/                 # Chat API endpoints
│   │   ├── conversations/        # Conversation management
│   │   ├── messages/             # Message operations
│   │   ├── upload/               # File upload handling
│   │   └── webhook/              # Webhook endpoints
│   ├── chat/                     # Chat pages
│   ├── sign-in/                  # Authentication pages
│   ├── sign-up/                  # Registration pages
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── chat/                     # Chat interface components
│   ├── ui/                       # ShadCN UI components
│   ├── sidebar/                  # Navigation sidebar
│   ├── pdf-viewer.tsx            # PDF viewer component
│   └── setup-page.tsx            # Setup configuration
├── lib/                          # Utility libraries
│   ├── models/                   # MongoDB models
│   ├── db.ts                     # Database connection
│   ├── file-storage.ts           # File handling utilities
│   └── utils.ts                  # Helper functions
├── hooks/                        # Custom React hooks
│   ├── use-voice-recorder.ts     # Voice recording hook
│   └── use-toast.ts              # Toast notifications
├── types/                        # TypeScript type definitions
├── public/                       # Static assets
│   └── uploads/                  # File upload directory
└── middleware.ts                 # Next.js middleware
```

## 🙏 Acknowledgments

- **OpenAI** for Mentora  inspiration
- **Vercel** for Next.js framework
- **Clerk** for authentication
- **Google** for Gemini AI
- **ShadCN** for UI components
- **Tailwind CSS** for styling



***Built with ❤️***

