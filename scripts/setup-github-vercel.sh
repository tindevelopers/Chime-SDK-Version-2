#!/bin/bash

echo "🚀 ChimeSDK Video - GitHub & Vercel Setup"
echo "=========================================="
echo ""

# Check if git remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No GitHub remote configured yet."
    echo ""
    echo "📋 To set up GitHub deployment:"
    echo "1. Create a new repository on GitHub"
    echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/chimesdk-video.git"
    echo "3. Run: git push -u origin main"
    echo ""
else
    echo "✅ GitHub remote configured:"
    git remote get-url origin
    echo ""
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed."
    echo "📦 Install with: npm install -g vercel"
    echo ""
else
    echo "✅ Vercel CLI installed"
    echo ""
fi

echo "🔧 Next Steps:"
echo "=============="
echo ""
echo "1. 📚 Read DEPLOYMENT.md for detailed instructions"
echo "2. 🌐 Create GitHub repository and add remote origin"
echo "3. 🔑 Configure GitHub secrets (VERCEL_TOKEN, VERCEL_ORG_ID, etc.)"
echo "4. 🚀 Link Vercel project: cd frontend-nextjs && vercel link"
echo "5. 📤 Push to GitHub: git push origin main"
echo "6. 🎯 Monitor deployment in GitHub Actions"
echo ""
echo "📖 Documentation: DEPLOYMENT.md"
echo "🔗 GitHub Actions: .github/workflows/deploy.yml"
echo "⚙️  Vercel Config: vercel.json"
echo ""

# Check if we're ready to deploy
if git remote get-url origin > /dev/null 2>&1 && command -v vercel &> /dev/null; then
    echo "🎉 Ready to deploy! Run: git push origin main"
else
    echo "⚠️  Complete the setup steps above before deploying."
fi
