# ChimeSDK Video Conferencing - Multi-Tenant Deployment Guide

## 🚀 Quick Start for New Tenant

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- Serverless Framework (`npm install -g serverless`)
- Vercel CLI (`npm install -g vercel`)

### Step 1: Prepare Tenant Configuration

1. Copy the template configuration:
```bash
cp deployment/tenant-config-template.yml deployment/tenants/customer-name-production.yml
```

2. Edit the configuration file with tenant-specific values:
```yaml
tenant:
  name: "acme-corp"
  stage: "production"
  region: "us-east-1"
aws:
  account_id: "123456789012"
  profile: "acme-corp-profile"
# ... customize other values
```

### Step 2: Deploy Backend Infrastructure

```bash
# Make deploy script executable
chmod +x deployment/deploy-tenant.sh

# Deploy for new tenant
./deployment/deploy-tenant.sh acme-corp production
```

### Step 3: Deploy Frontend

#### Option A: Vercel (Recommended)
```bash
cd frontend-nextjs
npx vercel --prod
# Follow prompts to configure custom domain
```

#### Option B: AWS Amplify/CloudFront
```bash
# Build the frontend
npm run build

# Deploy to S3 + CloudFront (manual setup required)
aws s3 sync out/ s3://acme-corp-video-frontend --delete
```

### Step 4: Configure Custom Domains

#### Backend API (API Gateway)
```bash
# Create custom domain in API Gateway
aws apigateway create-domain-name \
  --domain-name api.video.acmecorp.com \
  --certificate-arn arn:aws:acm:region:account:certificate/cert-id
```

#### Frontend (Vercel)
```bash
# Add custom domain in Vercel dashboard
# or via CLI
vercel domains add video.acmecorp.com
```

## 🔧 Advanced Configuration

### Environment Variables per Tenant

Create `.env.production.local` for each deployment:

```bash
# API Configuration
NEXT_PUBLIC_API_GATEWAY_URL=https://api.video.acmecorp.com
NEXT_PUBLIC_TENANT_NAME=acme-corp

# AWS Services
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx

# Branding
NEXT_PUBLIC_COMPANY_NAME="Acme Corporation"
NEXT_PUBLIC_PRIMARY_COLOR="#1e40af"
```

### Multi-Region Deployment

For global customers, deploy to multiple regions:

```bash
# Deploy to multiple regions
./deployment/deploy-tenant.sh acme-corp production us-east-1
./deployment/deploy-tenant.sh acme-corp production eu-west-1
./deployment/deploy-tenant.sh acme-corp production ap-southeast-1
```

## 📊 Monitoring and Operations

### CloudWatch Dashboard per Tenant

```yaml
# cloudformation/monitoring-template.yml
Resources:
  TenantDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub "${TenantName}-video-conferencing"
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Duration", "FunctionName", "${TenantName}-create-meeting"],
                  ["AWS/Lambda", "Errors", "FunctionName", "${TenantName}-create-meeting"]
                ]
              }
            }
          ]
        }
```

### Centralized Logging

Use CloudWatch Logs with tenant-specific log groups:
- `/aws/lambda/acme-corp-create-meeting`
- `/aws/lambda/acme-corp-get-meetings`

## 🛡️ Security Best Practices

### 1. IAM Roles per Tenant
```yaml
# Separate IAM roles for each tenant
TenantExecutionRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: !Sub "${TenantName}-video-conferencing-execution"
    # Minimal permissions specific to tenant
```

### 2. Resource Tagging
```yaml
Tags:
  - Key: Tenant
    Value: !Ref TenantName
  - Key: Environment
    Value: !Ref Stage
  - Key: Application
    Value: video-conferencing
```

### 3. Network Isolation (if required)
- Separate VPCs per tenant
- Private subnets for Lambda functions
- VPC endpoints for AWS services

## 💰 Cost Optimization

### 1. Resource Sharing
- Share ChimeSDK service (no additional cost)
- Individual DynamoDB tables per tenant
- Separate S3 buckets for recordings

### 2. Monitoring Costs
```bash
# Create billing alerts per tenant
aws cloudwatch put-metric-alarm \
  --alarm-name "acme-corp-billing-alert" \
  --alarm-description "Billing alert for Acme Corp" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold
```

## 🔄 Backup and Disaster Recovery

### 1. DynamoDB Backup
```yaml
BackupPlan:
  Type: AWS::Backup::BackupPlan
  Properties:
    BackupPlan:
      BackupPlanName: !Sub "${TenantName}-video-conferencing-backup"
      BackupPlanRule:
        - RuleName: DailyBackups
          TargetBackupVault: default
          ScheduleExpression: cron(0 2 ? * * *)
```

### 2. Cross-Region Replication
```yaml
# For critical tenants, enable cross-region replication
GlobalTable:
  Type: AWS::DynamoDB::GlobalTable
  Properties:
    TableName: !Sub "${TenantName}-video-conferencing-meetings"
    Replicas:
      - Region: us-east-1
      - Region: eu-west-1
```

## 📞 Support and Troubleshooting

### Common Issues

1. **ChimeSDK Quotas**: Each AWS account has limits
   - Solution: Request quota increases for production tenants

2. **API Gateway Throttling**: Shared across account
   - Solution: Implement usage plans per tenant

3. **DynamoDB Throttling**: High traffic tenants
   - Solution: Use On-Demand billing mode

### Monitoring Commands

```bash
# Check Lambda function health
aws logs filter-log-events \
  --log-group-name /aws/lambda/acme-corp-create-meeting \
  --start-time $(date -d '1 hour ago' +%s)000

# Check DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=acme-corp-video-conferencing-meetings \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum
```
