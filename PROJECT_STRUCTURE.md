# 📁 ChimeSDK Video - Project Structure

This document outlines the clean, refactored structure of the ChimeSDK Video application.

## 🎯 **Project Overview**

A modern video conferencing platform built with:
- **Frontend**: Next.js 15 + AWS Amplify
- **Backend**: AWS Lambda + API Gateway
- **Database**: PostgreSQL
- **Video**: AWS ChimeSDK
- **Auth**: AWS Cognito
- **Deployment**: Vercel (Frontend) + AWS (Backend)

## 🏗️ **Directory Structure**

```
chimesdk-video/
├── 📁 frontend-nextjs/           # Next.js Frontend Application
│   ├── 📁 src/                   # Source code
│   │   ├── 📁 app/               # App router pages
│   │   ├── 📁 components/        # React components
│   │   └── 📁 lib/               # Utility libraries
│   ├── 📁 public/                # Static assets
│   ├── package.json              # Frontend dependencies
│   └── next.config.ts            # Next.js configuration
│
├── 📁 src/                       # Backend Lambda Functions
│   └── 📁 lambda/                # AWS Lambda handlers
│       ├── auth.js               # Authentication
│       ├── create-meeting.js     # Meeting creation
│       ├── get-meetings.js       # Meeting retrieval
│       ├── join-meeting.js       # Meeting joining
│       └── utils.js              # Shared utilities
│
├── 📁 .github/                   # GitHub Configuration
│   └── 📁 workflows/             # CI/CD pipelines
│       └── deploy.yml            # Vercel deployment workflow
│
├── 📁 scripts/                   # Utility Scripts
│   ├── clean-project.sh          # Project cleanup
│   ├── setup-github-vercel.sh    # Deployment setup
│   └── setup-aws-mcp.sh          # AWS MCP setup
│
├── 📁 env-configs/               # Environment Configurations
│   ├── 📁 development/           # Development environment
│   ├── 📁 staging/               # Staging environment
│   └── 📁 production/            # Production environment
│
├── 📁 database/                  # Database Schema
│   └── schema.sql                # PostgreSQL schema
│
├── 📁 mcp-servers/               # MCP Server Configurations
│   └── 📁 chime-sdk/             # ChimeSDK MCP server
│
├── serverless.yml                # AWS Serverless configuration
├── vercel.json                   # Vercel deployment config
├── package.json                  # Root dependencies (Serverless tools)
├── .gitignore                    # Git ignore rules
└── README.md                     # Project documentation
```

## 📦 **Dependencies Management**

### **Root Level (Backend Tools)**
```json
{
  "devDependencies": {
    "serverless": "^3.40.0",        # AWS Serverless Framework
    "serverless-offline": "^13.3.0" # Local development
  }
}
```

### **Frontend (Next.js App)**
```json
{
  "dependencies": {
    "next": "15.5.2",              # Next.js framework
    "react": "19.1.0",             # React library
    "@aws-amplify/ui-react": "^6.12.0", # AWS Amplify UI
    "aws-amplify": "^6.15.5"       # AWS Amplify
  }
}
```

### **Lambda Functions (Inline)**
Dependencies are managed directly in the Lambda functions:
- `@aws-sdk/client-chime-sdk-meetings`
- `@aws-sdk/client-chime-sdk-voice`
- `pg` (PostgreSQL)
- `jsonwebtoken`
- `cors`

## 🚀 **Available Commands**

### **Root Level Commands**
```bash
npm run deploy              # Deploy to AWS (dev)
npm run deploy:prod        # Deploy to AWS (production)
npm run deploy:staging     # Deploy to AWS (staging)
npm run dev                # Start Serverless offline
npm run logs               # View Lambda logs
npm run remove             # Remove AWS resources
npm run clean              # Clean all dependencies
npm run install:all        # Install all dependencies
```

### **Frontend Commands**
```bash
npm run frontend:dev       # Start Next.js dev server
npm run frontend:build     # Build for production
npm run frontend:start     # Start production server
```

### **Utility Scripts**
```bash
./scripts/clean-project.sh         # Clean and reorganize project
./scripts/setup-github-vercel.sh   # Setup deployment
./scripts/setup-aws-mcp.sh         # Setup AWS MCP servers
```

## 🔄 **Development Workflow**

1. **Local Development**
   ```bash
   npm run frontend:dev     # Frontend (Next.js)
   npm run dev              # Backend (Serverless offline)
   ```

2. **Testing**
   ```bash
   npm run frontend:build   # Build frontend
   npm run deploy           # Deploy backend to AWS
   ```

3. **Production Deployment**
   ```bash
   git push origin main     # Trigger GitHub Actions
   # → Automatic Vercel deployment
   ```

## 🧹 **Cleanup Benefits**

### **Before Refactoring**
- ❌ Multiple `node_modules` directories
- ❌ Duplicate dependencies
- ❌ Redundant package.json files
- ❌ Old React frontend (unused)
- ❌ Webpack configuration (unnecessary)

### **After Refactoring**
- ✅ Single root `node_modules` for tools
- ✅ Separate frontend dependencies
- ✅ No duplicate packages
- ✅ Clear separation of concerns
- ✅ Optimized for deployment
- ✅ Clean project structure

## 📚 **Documentation Files**

- **README.md** - Main project overview
- **DEPLOYMENT.md** - Complete deployment guide
- **GITHUB_DEPLOYMENT_README.md** - Quick start deployment
- **PROJECT_STRUCTURE.md** - This file
- **DEVELOPMENT_ROADMAP.md** - Development timeline

## 🎯 **Next Steps**

1. **Test the clean structure**: `./scripts/clean-project.sh`
2. **Verify dependencies**: `npm run install:all`
3. **Test local development**: `npm run frontend:dev`
4. **Deploy to AWS**: `npm run deploy`
5. **Push to GitHub**: `git push origin main`

---

**The project is now clean, organized, and ready for production deployment!** 🚀
