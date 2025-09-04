#!/bin/bash

echo "🧹 ChimeSDK Video - Project Cleanup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📁 Current project structure:"
echo "============================="
tree -I 'node_modules|.git|.next|.serverless|.aws-sam' -L 2 2>/dev/null || echo "tree command not available, showing directory structure:"
ls -la | grep -E '^d' | awk '{print "  " $9}'
echo ""

echo "🧹 Cleaning up unnecessary files..."
echo "=================================="

# Remove old frontend if it exists
if [ -d "frontend" ]; then
    echo -e "${YELLOW}Removing old frontend directory...${NC}"
    rm -rf frontend
    echo -e "${GREEN}✓ Old frontend removed${NC}"
fi

# Remove redundant package files
if [ -f "src/package.json" ]; then
    echo -e "${YELLOW}Removing redundant src/package.json...${NC}"
    rm -f src/package.json src/package-lock.json
    echo -e "${GREEN}✓ Redundant package files removed${NC}"
fi

# Clean build artifacts
echo -e "${YELLOW}Cleaning build artifacts...${NC}"
rm -rf .serverless .aws-sam dist build
echo -e "${GREEN}✓ Build artifacts cleaned${NC}"

# Clean node_modules (will reinstall)
echo -e "${YELLOW}Cleaning node_modules...${NC}"
rm -rf node_modules package-lock.json
echo -e "${GREEN}✓ Node modules cleaned${NC}"

echo ""
echo "📦 Reinstalling dependencies..."
echo "==============================="

# Install root dependencies
echo -e "${YELLOW}Installing root dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend-nextjs
npm install
cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

echo ""
echo "🎯 Final project structure:"
echo "=========================="
echo ""
echo "📁 Root (Serverless Backend)"
echo "  ├── serverless.yml          # AWS infrastructure"
echo "  ├── src/lambda/             # Lambda functions"
echo "  ├── package.json            # Backend dependencies"
echo "  └── scripts/                # Utility scripts"
echo ""
echo "📁 frontend-nextjs (Next.js Frontend)"
echo "  ├── src/                    # React components"
echo "  ├── package.json            # Frontend dependencies"
echo "  └── next.config.ts          # Next.js config"
echo ""
echo "📁 Configuration"
echo "  ├── .github/workflows/      # GitHub Actions"
echo "  ├── vercel.json             # Vercel deployment"
echo "  └── .gitignore              # Git ignore rules"
echo ""

echo -e "${GREEN}🎉 Project cleanup complete!${NC}"
echo ""
echo "🚀 Available commands:"
echo "  npm run deploy              # Deploy to AWS (dev)"
echo "  npm run frontend:dev        # Start Next.js dev server"
echo "  npm run frontend:build      # Build Next.js for production"
echo "  npm run clean               # Clean all dependencies"
echo ""
echo "📚 Next steps:"
echo "  1. Test the backend: npm run dev"
echo "  2. Test the frontend: npm run frontend:dev"
echo "  3. Deploy to AWS: npm run deploy"
echo "  4. Push to GitHub for Vercel deployment"
