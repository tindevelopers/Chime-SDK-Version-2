# Deployment Guide

This guide covers deploying the ChimeSDK Video application to GitHub and Vercel.

## 🚀 Quick Start

1. **Push to GitHub** → **GitHub Actions** → **Vercel Deployment**
2. **Automatic deployment** on every push to `main` branch

## 📋 Prerequisites

- GitHub account
- Vercel account
- AWS account (for backend API)

## 🔧 GitHub Setup

### 1. Create GitHub Repository

```bash
# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/chimesdk-video.git

# Push to GitHub
git add .
git commit -m "Initial commit: ChimeSDK Video application"
git push -u origin main
```

### 2. Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Vercel API token | `vercel_xxxxx` |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_xxxxx` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_xxxxx` |
| `NEXT_PUBLIC_API_URL` | AWS API Gateway URL | `https://xxx.execute-api.us-east-1.amazonaws.com/dev` |

## 🚀 Vercel Setup

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Project

```bash
cd frontend-nextjs
vercel link
```

### 4. Get Project Details

```bash
vercel project ls
```

Note down:
- **Project ID** → Use as `VERCEL_PROJECT_ID` secret
- **Org ID** → Use as `VERCEL_ORG_ID` secret

### 5. Get Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create new token
3. Copy token → Use as `VERCEL_TOKEN` secret

## 🔄 Deployment Flow

### Automatic Deployment

1. **Push to `main` branch**
2. **GitHub Actions trigger:**
   - Install dependencies
   - Run tests
   - Build application
   - Deploy to Vercel

### Manual Deployment

```bash
cd frontend-nextjs
vercel --prod
```

## 🌍 Environment Variables

### Production Environment

Set in Vercel dashboard:

```bash
NEXT_PUBLIC_API_URL=https://xxzrb5vqse.execute-api.us-east-1.amazonaws.com/dev
```

### Local Development

Copy from example:

```bash
cp env-configs/development/env.example env-configs/development/.env
```

## 📁 Project Structure

```
├── frontend-nextjs/          # Next.js frontend
│   ├── src/                  # Source code
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── src/lambda/               # AWS Lambda functions
├── serverless.yml            # Serverless configuration
├── .github/workflows/        # GitHub Actions
├── vercel.json              # Vercel configuration
└── .gitignore               # Git ignore rules
```

## 🧪 Testing

### Local Testing

```bash
# Frontend
cd frontend-nextjs
npm run dev

# Backend (requires AWS credentials)
npx serverless offline
```

### CI/CD Testing

- **GitHub Actions** run on every PR
- **Tests** must pass before deployment
- **Build** must succeed before deployment

## 🔍 Monitoring

### Vercel Analytics

- **Performance metrics**
- **Error tracking**
- **User analytics**

### AWS CloudWatch

- **Lambda function logs**
- **API Gateway metrics**
- **Error tracking**

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify environment variables
   - Check dependency conflicts

2. **Deployment Failures**
   - Verify Vercel secrets
   - Check API Gateway status
   - Verify AWS credentials

3. **CORS Issues**
   - Check API Gateway CORS settings
   - Verify frontend URL in backend config

### Debug Commands

```bash
# Check Vercel status
vercel ls

# View deployment logs
vercel logs

# Check GitHub Actions
# Go to Actions tab in GitHub repo
```

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS Serverless](https://docs.aws.amazon.com/serverless/)

## 🎯 Next Steps

1. **Set up GitHub repository**
2. **Configure GitHub secrets**
3. **Link Vercel project**
4. **Push to trigger deployment**
5. **Monitor deployment status**
6. **Test production application**
