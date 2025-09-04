# 🚀 Quick Start: Deploy to GitHub & Vercel

Your ChimeSDK Video application is now ready for GitHub deployment and Vercel hosting!

## ⚡ **5-Minute Setup**

### 1. **Create GitHub Repository**
```bash
# Go to GitHub.com → New Repository
# Name: chimesdk-video
# Public/Private: Your choice
# Don't initialize with README (we already have one)
```

### 2. **Add GitHub Remote**
```bash
git remote add origin https://github.com/YOUR_USERNAME/chimesdk-video.git
git push -u origin main
```

### 3. **Install Vercel CLI**
```bash
npm install -g vercel
vercel login
```

### 4. **Link Vercel Project**
```bash
cd frontend-nextjs
vercel link
# Follow prompts to link your project
```

### 5. **Configure GitHub Secrets**
Go to: `https://github.com/YOUR_USERNAME/chimesdk-video/settings/secrets/actions`

Add these secrets:
- `VERCEL_TOKEN` - From [Vercel Account Settings](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - From `vercel project ls`
- `VERCEL_PROJECT_ID` - From `vercel project ls`
- `NEXT_PUBLIC_API_URL` - `https://xxzrb5vqse.execute-api.us-east-1.amazonaws.com/dev`

### 6. **Deploy!**
```bash
git push origin main
# GitHub Actions will automatically deploy to Vercel! 🎉
```

## 🔄 **What Happens Next**

1. **Push to GitHub** → Triggers GitHub Actions
2. **GitHub Actions** → Tests, builds, and deploys
3. **Vercel** → Hosts your Next.js frontend
4. **AWS Lambda** → Powers your backend API

## 📚 **Full Documentation**

- **📖 Complete Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **🔧 Setup Script**: `./scripts/setup-github-vercel.sh`
- **⚙️ GitHub Actions**: `.github/workflows/deploy.yml`
- **🚀 Vercel Config**: `vercel.json`

## 🎯 **Your Application**

- **Frontend**: Next.js with AWS Amplify
- **Backend**: AWS Lambda + API Gateway
- **Database**: PostgreSQL
- **Video**: AWS ChimeSDK
- **Auth**: AWS Cognito

## 🚨 **Need Help?**

1. **Run the setup script**: `./scripts/setup-github-vercel.sh`
2. **Check DEPLOYMENT.md** for detailed troubleshooting
3. **Verify GitHub secrets** are configured correctly
4. **Check Vercel project** is linked properly

---

**Ready to deploy?** 🚀 Just follow the 5 steps above and your app will be live on Vercel!
