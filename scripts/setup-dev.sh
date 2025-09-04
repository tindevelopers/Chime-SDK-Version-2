#!/bin/bash

# Video Conferencing Platform - Development Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Video Conferencing Platform Development Environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
check_aws_cli() {
    print_status "Checking AWS CLI installation..."
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    print_success "AWS CLI is installed"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION is installed"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install it first."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION is installed"
}

# Install npm dependencies
install_dependencies() {
    print_status "Installing npm dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Store environment variables in AWS Systems Manager
setup_environment_variables() {
    print_status "Setting up environment variables in AWS Systems Manager..."
    
    # Database configuration
    aws ssm put-parameter \
        --name "/video-conferencing/dev/db-host" \
        --value "video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com" \
        --type "String" \
        --overwrite
    
    aws ssm put-parameter \
        --name "/video-conferencing/dev/db-port" \
        --value "5432" \
        --type "String" \
        --overwrite
    
    aws ssm put-parameter \
        --name "/video-conferencing/dev/db-name" \
        --value "video_conferencing" \
        --type "String" \
        --overwrite
    
    aws ssm put-parameter \
        --name "/video-conferencing/dev/db-user" \
        --value "dbadmin" \
        --type "String" \
        --overwrite
    
    aws ssm put-parameter \
        --name "/video-conferencing/dev/db-password" \
        --value "VideoConf2025!" \
        --type "SecureString" \
        --overwrite
    
    # Cognito configuration
    aws ssm put-parameter \
        --name "/video-conferencing/dev/cognito-user-pool-id" \
        --value "us-east-1_2lpfwBcaO" \
        --type "String" \
        --overwrite
    
    aws ssm put-parameter \
        --name "/video-conferencing/dev/cognito-client-id" \
        --value "uus0oqfhqto7lo0rud3nco8a0" \
        --type "String" \
        --overwrite
    
    # Account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    aws ssm put-parameter \
        --name "/video-conferencing/account-id" \
        --value "$ACCOUNT_ID" \
        --type "String" \
        --overwrite
    
    print_success "Environment variables configured in AWS Systems Manager"
}

# Create database and run schema
setup_database() {
    print_status "Setting up database schema..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client (psql) is not installed. Please install it to run database migrations."
        print_warning "You can run the schema manually using the file: database/schema.sql"
        return
    fi
    
    # Create database if it doesn't exist
    print_status "Creating database if it doesn't exist..."
    PGPASSWORD="VideoConf2025!" psql -h video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com \
        -U dbadmin -d postgres -c "CREATE DATABASE video_conferencing;" 2>/dev/null || true
    
    # Run schema
    print_status "Running database schema..."
    PGPASSWORD="VideoConf2025!" psql -h video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com \
        -U dbadmin -d video_conferencing -f database/schema.sql
    
    print_success "Database schema applied successfully"
}

# Deploy Lambda functions
deploy_functions() {
    print_status "Deploying Lambda functions..."
    
    # Check if serverless is installed
    if ! command -v serverless &> /dev/null; then
        print_warning "Serverless Framework is not installed globally. Installing..."
        npm install -g serverless
    fi
    
    # Deploy to dev stage
    serverless deploy --stage dev
    
    print_success "Lambda functions deployed successfully"
}

# Create local environment file
create_env_file() {
    print_status "Creating local environment file..."
    
    cat > .env.local << EOF
# Database Configuration
DB_HOST=video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=video_conferencing
DB_USER=dbadmin
DB_PASSWORD=VideoConf2025!

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_2lpfwBcaO
COGNITO_CLIENT_ID=uus0oqfhqto7lo0rud3nco8a0
COGNITO_REGION=us-east-1

# AWS Configuration
AWS_REGION=us-east-1
EOF
    
    print_success "Local environment file created: .env.local"
}

# Main setup function
main() {
    echo "=========================================="
    echo "Video Conferencing Platform Setup"
    echo "=========================================="
    
    # Check prerequisites
    check_aws_cli
    check_nodejs
    check_npm
    
    # Install dependencies
    install_dependencies
    
    # Setup environment variables
    setup_environment_variables
    
    # Setup database
    setup_database
    
    # Create local environment file
    create_env_file
    
    # Deploy functions (optional - can be done later)
    read -p "Do you want to deploy Lambda functions now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_functions
    else
        print_warning "You can deploy Lambda functions later using: serverless deploy --stage dev"
    fi
    
    echo ""
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Review the configuration in .env.local"
    echo "2. Deploy Lambda functions: serverless deploy --stage dev"
    echo "3. Start local development: npm run dev"
    echo "4. Check the README.md and DEVELOPMENT_ROADMAP.md for more details"
    echo ""
    echo "Database endpoint: video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com"
    echo "Cognito User Pool: us-east-1_2lpfwBcaO"
    echo "Estimated monthly cost: $15-30 during development"
    echo ""
}

# Run main function
main "$@"
