-- Video Conferencing Platform Database Schema
-- Aurora PostgreSQL Serverless v2 with ChimeSDK Integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Cognito)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Meetings table with ChimeSDK integration
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    host_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meeting_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    max_participants INTEGER DEFAULT 100,
    recording_enabled BOOLEAN DEFAULT false,
    chat_enabled BOOLEAN DEFAULT true,
    screen_sharing_enabled BOOLEAN DEFAULT true,
    waiting_room_enabled BOOLEAN DEFAULT false,
    password_protected BOOLEAN DEFAULT false,
    meeting_password VARCHAR(100),
    settings JSONB DEFAULT '{}',
    -- ChimeSDK specific fields
    chime_meeting_id VARCHAR(255) UNIQUE,
    chime_media_region VARCHAR(50) DEFAULT 'us-east-1',
    chime_external_meeting_id VARCHAR(255),
    chime_meeting_arn VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Meeting participants with ChimeSDK integration
CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('host', 'co-host', 'participant')),
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    device_info JSONB DEFAULT '{}',
    connection_quality VARCHAR(20),
    -- ChimeSDK specific fields
    chime_attendee_id VARCHAR(255) UNIQUE,
    chime_external_user_id VARCHAR(255),
    chime_join_token VARCHAR(1000),
    chime_capabilities JSONB DEFAULT '{"Audio": "SendReceive", "Video": "SendReceive", "Content": "SendReceive"}',
    UNIQUE(meeting_id, user_id)
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    sender_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    content TEXT NOT NULL,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    is_private BOOLEAN DEFAULT false,
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Meeting recordings with ChimeSDK integration
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    recording_type VARCHAR(20) DEFAULT 'video' CHECK (recording_type IN ('video', 'audio', 'transcript')),
    s3_bucket VARCHAR(255) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    -- ChimeSDK specific fields
    chime_recording_id VARCHAR(255),
    chime_media_pipeline_id VARCHAR(255),
    chime_recording_arn VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User sessions (for analytics)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Meeting analytics
CREATE TABLE meeting_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ChimeSDK Voice Connector configurations
CREATE TABLE voice_connectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    chime_voice_connector_id VARCHAR(255) UNIQUE,
    chime_voice_connector_arn VARCHAR(500),
    region VARCHAR(50) DEFAULT 'us-east-1',
    encryption_enabled BOOLEAN DEFAULT true,
    streaming_enabled BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PSTN phone numbers
CREATE TABLE phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voice_connector_id UUID REFERENCES voice_connectors(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    phone_number_type VARCHAR(20) DEFAULT 'Local' CHECK (phone_number_type IN ('Local', 'TollFree')),
    chime_phone_number_id VARCHAR(255),
    chime_phone_number_arn VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_meetings_host_user_id ON meetings(host_user_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX idx_meetings_meeting_code ON meetings(meeting_code);
CREATE INDEX idx_meetings_chime_meeting_id ON meetings(chime_meeting_id);

CREATE INDEX idx_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_participants_user_id ON meeting_participants(user_id);
CREATE INDEX idx_participants_is_active ON meeting_participants(is_active);
CREATE INDEX idx_participants_chime_attendee_id ON meeting_participants(chime_attendee_id);

CREATE INDEX idx_chat_messages_meeting_id ON chat_messages(meeting_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX idx_recordings_meeting_id ON recordings(meeting_id);
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_recordings_chime_recording_id ON recordings(chime_recording_id);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_is_active ON user_sessions(is_active);

CREATE INDEX idx_analytics_meeting_id ON meeting_analytics(meeting_id);
CREATE INDEX idx_analytics_metric_name ON meeting_analytics(metric_name);
CREATE INDEX idx_analytics_recorded_at ON meeting_analytics(recorded_at);

CREATE INDEX idx_voice_connectors_chime_id ON voice_connectors(chime_voice_connector_id);
CREATE INDEX idx_phone_numbers_voice_connector_id ON phone_numbers(voice_connector_id);
CREATE INDEX idx_phone_numbers_phone_number ON phone_numbers(phone_number);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_connectors_updated_at BEFORE UPDATE ON voice_connectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for common operations
CREATE OR REPLACE FUNCTION generate_meeting_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate a 6-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_count FROM meetings WHERE meeting_code = code;
        
        -- If code doesn't exist, return it
        IF exists_count = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get active participants count
CREATE OR REPLACE FUNCTION get_active_participants_count(meeting_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM meeting_participants 
        WHERE meeting_id = meeting_uuid AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is meeting host
CREATE OR REPLACE FUNCTION is_meeting_host(meeting_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM meetings 
        WHERE id = meeting_uuid AND host_user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get ChimeSDK meeting details
CREATE OR REPLACE FUNCTION get_chime_meeting_details(meeting_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    meeting_record RECORD;
    result JSONB;
BEGIN
    SELECT 
        chime_meeting_id,
        chime_media_region,
        chime_external_meeting_id,
        chime_meeting_arn
    INTO meeting_record
    FROM meetings 
    WHERE id = meeting_uuid;
    
    IF meeting_record.chime_meeting_id IS NOT NULL THEN
        result := jsonb_build_object(
            'chime_meeting_id', meeting_record.chime_meeting_id,
            'media_region', meeting_record.chime_media_region,
            'external_meeting_id', meeting_record.chime_external_meeting_id,
            'meeting_arn', meeting_record.chime_meeting_arn
        );
    ELSE
        result := '{}'::jsonb;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
