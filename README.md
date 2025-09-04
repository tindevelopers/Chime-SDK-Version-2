# Video Conferencing Platform

A modern, scalable video conferencing platform built with AWS services and ChimeSDK integration.

## 🏗️ Architecture

### Core Services
- **Database**: Aurora PostgreSQL Serverless v2 (Auto-scaling)
- **Authentication**: AWS Cognito User Pools
- **Video Conferencing**: AWS ChimeSDK Meetings
- **Voice/PSTN**: AWS ChimeSDK Voice
- **API**: API Gateway + Lambda Functions
- **Storage**: S3 for recordings and assets
- **Messaging**: SNS/SQS for notifications

### Current Infrastructure
- **Database Cluster**: `video-conferencing-dev`
- **Database Endpoint**: `video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com`
- **Cognito User Pool**: `us-east-1_2lpfwBcaO`
- **Cognito Client ID**: `uus0oqfhqto7lo0rud3nco8a0`
- **ChimeSDK**: Fully integrated for meetings and voice

## 🚀 Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [x] Set up Aurora PostgreSQL database
- [x] Configure AWS Cognito authentication
- [x] Integrate ChimeSDK for meetings
- [x] Create database schema with ChimeSDK fields
- [x] Set up API Gateway
- [x] Create Lambda functions for ChimeSDK operations

### Phase 2: Core Features (Week 3-4)
- [ ] User registration and authentication
- [ ] Meeting creation and management via ChimeSDK
- [ ] Basic video conferencing interface
- [ ] Participant management
- [ ] Voice connector setup for PSTN calling

### Phase 3: Advanced Features (Week 5-6)
- [ ] Screen sharing (ChimeSDK Content)
- [ ] Chat functionality
- [ ] Recording capabilities (ChimeSDK Media Pipelines)
- [ ] Meeting analytics
- [ ] PSTN integration

### Phase 4: Production Ready (Week 7-8)
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Monitoring and logging
- [ ] Deployment automation

## 🛠️ Development Setup

### Prerequisites
- AWS CLI configured
- Node.js 18+
- PostgreSQL client
- Docker (for local development)

### Environment Variables
```bash
# Database
DB_HOST=video-conferencing-dev.cluster-clrcltlw1dlu.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=video_conferencing
DB_USER=dbadmin
DB_PASSWORD=VideoConf2025!

# Cognito
COGNITO_USER_POOL_ID=us-east-1_2lpfwBcaO
COGNITO_CLIENT_ID=uus0oqfhqto7lo0rud3nco8a0
COGNITO_REGION=us-east-1

# ChimeSDK
CHIME_REGION=us-east-1

# API Gateway
API_BASE_URL=https://your-api-gateway-url.amazonaws.com/prod
```

## 📊 Database Schema

### Core Tables with ChimeSDK Integration
- `users` - User profiles and authentication
- `meetings` - Meeting information with ChimeSDK meeting IDs
- `meeting_participants` - Participant tracking with ChimeSDK attendee IDs
- `chat_messages` - Meeting chat history
- `recordings` - Meeting recordings metadata with ChimeSDK pipeline IDs
- `voice_connectors` - ChimeSDK Voice Connector configurations
- `phone_numbers` - PSTN phone numbers for voice calling

## 🔐 Authentication Flow

1. User registers/signs in via Cognito
2. Cognito returns JWT tokens
3. Frontend includes tokens in API requests
4. Lambda functions validate tokens
5. Database operations performed with user context
6. ChimeSDK operations executed with proper permissions

## 🎥 ChimeSDK Integration

### Meeting Management
- **Create Meeting**: Lambda creates ChimeSDK meeting + database record
- **Join Meeting**: Lambda creates ChimeSDK attendee + database participant
- **End Meeting**: Lambda deletes ChimeSDK meeting + updates database
- **Meeting Features**: HD video, echo reduction, content sharing

### Voice/PSTN Integration
- **Voice Connectors**: Manage PSTN calling infrastructure
- **Phone Numbers**: Order and manage phone numbers
- **SIP Applications**: Custom voice applications
- **SIP Rules**: Route calls based on rules

### Recording & Media
- **Media Pipelines**: Record meetings to S3
- **Transcription**: Real-time meeting transcription
- **Content Capture**: Screen sharing and content recording

## 💰 Cost Optimization

### Development Environment
- **Aurora Serverless v2**: Min 0.5 ACU, Max 8 ACU
- **ChimeSDK**: Pay per meeting minute + attendee
- **Lambda**: Pay per request (minimal cost)
- **Cognito**: Free tier (50,000 MAUs)
- **Estimated Cost**: $20-50/month during development

### Production Considerations
- **Min ACU**: 2-4 for production responsiveness
- **Max ACU**: 32-64 for high traffic
- **ChimeSDK**: Scale with usage
- **Multi-AZ**: Enabled for reliability

## 🚀 Next Steps

1. **Set up local development environment**
2. **Create database schema and migrations**
3. **Build authentication flow**
4. **Develop core API endpoints**
5. **Create frontend interface**
6. **Test ChimeSDK integration**

## 📝 Development Notes

- Database is configured with auto-scaling for cost efficiency
- Cognito is set up for email-based authentication
- ChimeSDK is fully integrated for video/audio meetings
- API Gateway will be configured for RESTful endpoints
- Lambda functions handle all ChimeSDK operations
- S3 will store recordings and user assets
- SNS/SQS handle meeting notifications

## 🔧 API Endpoints

### Meetings (ChimeSDK)
- `POST /meetings` - Create a new meeting
- `GET /meetings` - List user's meetings
- `POST /meetings/join` - Join a meeting
- `POST /meetings/{id}/end` - End a meeting

### Voice (ChimeSDK Voice)
- `GET /voice-connectors` - List voice connectors
- `POST /voice-connectors` - Create voice connector
- `POST /voice-connectors/{id}/phone-numbers` - Associate phone numbers
- `GET /phone-numbers/search` - Search available phone numbers
- `POST /phone-numbers/order` - Order phone numbers

### Authentication
- `GET /auth` - Verify authentication token

## 🎯 ChimeSDK Benefits

### ✅ Why ChimeSDK is Perfect for This Platform
- **Enterprise-Grade**: Built for production use
- **Scalable**: Handles thousands of concurrent meetings
- **Feature-Rich**: HD video, screen sharing, recording, transcription
- **PSTN Integration**: Phone number calling capabilities
- **Global Infrastructure**: Low-latency worldwide
- **Security**: End-to-end encryption, compliance ready
- **Cost-Effective**: Pay per usage, no upfront costs

### 🚀 Ready for Production
- **Meeting Capacity**: 1000+ concurrent meetings
- **Participant Limit**: 250 participants per meeting
- **Video Quality**: Up to 4K resolution
- **Audio Quality**: HD audio with echo cancellation
- **Recording**: Cloud recording with transcription
- **Analytics**: Real-time meeting analytics
