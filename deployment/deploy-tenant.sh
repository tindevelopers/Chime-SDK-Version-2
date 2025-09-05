#!/bin/bash

# Multi-Tenant Deployment Script
# Usage: ./deploy-tenant.sh customer-name production

set -e

TENANT_NAME=$1
STAGE=$2

if [ -z "$TENANT_NAME" ] || [ -z "$STAGE" ]; then
    echo "Usage: ./deploy-tenant.sh <tenant-name> <stage>"
    echo "Example: ./deploy-tenant.sh acme-corp production"
    exit 1
fi

CONFIG_FILE="tenants/${TENANT_NAME}-${STAGE}.yml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Configuration file not found: $CONFIG_FILE"
    echo "Please create it from tenant-config-template.yml"
    exit 1
fi

echo "🚀 Deploying tenant: $TENANT_NAME ($STAGE)"

# Load configuration
source <(yq eval '.tenant | to_entries | .[] | .key + "=" + (.value | tostring)' $CONFIG_FILE)
source <(yq eval '.aws | to_entries | .[] | .key + "=" + (.value | tostring)' $CONFIG_FILE)

# Set AWS profile
export AWS_PROFILE=$profile

echo "📋 Deployment Configuration:"
echo "  Tenant: $name"
echo "  Stage: $stage"  
echo "  Region: $region"
echo "  Account: $account_id"

# 1. Deploy Backend Infrastructure
echo "🔧 Deploying backend infrastructure..."
cd ..
npx serverless deploy \
  --stage $stage \
  --region $region \
  --param="tenantName=$name" \
  --param="awsAccountId=$account_id" \
  --config-file deployment/serverless-multi-tenant.yml

# 2. Deploy Frontend
echo "🎨 Deploying frontend..."
cd frontend-nextjs

# Create environment file for this tenant
cat > .env.production << EOF
NEXT_PUBLIC_API_GATEWAY_URL=https://api-$name-$stage.execute-api.$region.amazonaws.com
NEXT_PUBLIC_TENANT_NAME=$name
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
NEXT_PUBLIC_AWS_REGION=$region
EOF

# Deploy to Vercel with custom domain
npx vercel --prod \
  --env NEXT_PUBLIC_TENANT_NAME=$name \
  --env NEXT_PUBLIC_STAGE=$stage

echo "✅ Deployment completed for tenant: $name"
echo "🌐 Frontend URL: Will be provided by Vercel"
echo "🔗 API Gateway URL: https://api-$name-$stage.execute-api.$region.amazonaws.com"
