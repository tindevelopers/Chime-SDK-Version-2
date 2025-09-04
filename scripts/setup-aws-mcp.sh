#!/bin/bash

# AWS MCP Server Setup Script for ChimeSDK Video Project
# This script helps configure the AWS MCP servers for your project

set -e

echo "🚀 Setting up AWS MCP Servers for ChimeSDK Video Project"
echo "=================================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed. Please install it first:"
    echo "   https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Verify AWS MCP servers are installed
echo ""
echo "📋 Verifying AWS MCP Server installations..."
echo "=================================================="

servers=(
    "awslabs.core-mcp-server"
    "awslabs.aws-serverless-mcp-server"
    "awslabs.lambda-tool-mcp-server"
    "awslabs.cdk-mcp-server"
    "awslabs.aws-documentation-mcp-server"
)

for server in "${servers[@]}"; do
    if uv tool list | grep -q "$server"; then
        echo "✅ $server is installed"
    else
        echo "❌ $server is not installed"
        echo "   Installing $server..."
        uv tool install "$server"
    fi
done

echo ""
echo "🔧 AWS Configuration Setup"
echo "=================================================="

# Check AWS credentials
echo "Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS credentials are configured"
    aws sts get-caller-identity
else
    echo "❌ AWS credentials are not configured"
    echo "Please run: aws configure"
    echo "Or set up your credentials using one of these methods:"
    echo "1. AWS CLI: aws configure"
    echo "2. Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    echo "3. IAM roles (if running on EC2)"
    echo "4. AWS SSO: aws configure sso"
fi

echo ""
echo "📁 Environment Configuration"
echo "=================================================="

# Create .env files from examples if they don't exist
for env in development staging production; do
    env_file="env-configs/$env/.env"
    example_file="env-configs/$env/env.example"
    
    if [ ! -f "$env_file" ] && [ -f "$example_file" ]; then
        echo "Creating $env_file from example..."
        cp "$example_file" "$env_file"
        echo "✅ Created $env_file"
        echo "   Please edit $env_file with your actual values"
    elif [ -f "$env_file" ]; then
        echo "✅ $env_file already exists"
    else
        echo "⚠️  No example file found for $env environment"
    fi
done

echo ""
echo "🎯 ChimeSDK Specific Configuration"
echo "=================================================="

# Check if ChimeSDK specific services are available
echo "The following AWS services will be available through MCP servers:"
echo "• ChimeSDK Meetings API"
echo "• ChimeSDK Voice API"
echo "• Lambda Functions"
echo "• IAM Roles and Policies"
echo "• S3 Buckets (for recordings)"
echo "• CloudWatch Logs and Metrics"
echo "• API Gateway"
echo "• Cognito (for authentication)"

echo ""
echo "📚 Next Steps"
echo "=================================================="
echo "1. Configure your AWS credentials:"
echo "   aws configure"
echo ""
echo "2. Edit environment files with your actual values:"
echo "   - env-configs/development/.env"
echo "   - env-configs/staging/.env"
echo "   - env-configs/production/.env"
echo ""
echo "3. Test the MCP servers with your AI assistant"
echo ""
echo "4. For ChimeSDK operations, you can now use:"
echo "   - Create and manage meetings"
echo "   - Handle voice calls"
echo "   - Manage Lambda functions"
echo "   - Deploy infrastructure with CDK"
echo "   - Access AWS documentation"
echo ""
echo "✅ Setup complete! Your AWS MCP servers are ready for ChimeSDK development."
