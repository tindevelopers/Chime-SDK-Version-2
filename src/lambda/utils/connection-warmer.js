const { RDSClient, ModifyDBClusterCommand } = require('@aws-sdk/client-rds');

class ConnectionWarmer {
  constructor() {
    this.rdsClient = new RDSClient({ region: 'us-east-1' });
    this.isWarming = false;
    this.lastWarmTime = 0;
    this.warmCooldown = 300000; // 5 minutes cooldown between warming attempts
  }

  // Warm up Aurora Serverless by adjusting capacity temporarily
  async warmDatabase() {
    const now = Date.now();
    
    // Avoid frequent warming attempts
    if (this.isWarming || (now - this.lastWarmTime) < this.warmCooldown) {
      console.log('⏳ Database warming already in progress or in cooldown');
      return false;
    }

    this.isWarming = true;
    this.lastWarmTime = now;

    try {
      console.log('🔥 Warming Aurora Serverless database...');
      
      // Temporarily increase minimum capacity to ensure database is active
      const modifyParams = {
        DBClusterIdentifier: 'video-conferencing-dev',
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 2.0, // Temporarily increase to 2 ACUs
          MaxCapacity: 8.0
        },
        ApplyImmediately: true
      };

      await this.rdsClient.send(new ModifyDBClusterCommand(modifyParams));
      console.log('✅ Database warming initiated - increased min capacity to 2.0 ACU');

      // Wait 30 seconds for scaling to take effect
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Scale back down to maintain cost efficiency
      const scaleDownParams = {
        DBClusterIdentifier: 'video-conferencing-dev',
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 1.0, // Back to 1 ACU
          MaxCapacity: 8.0
        },
        ApplyImmediately: true
      };

      await this.rdsClient.send(new ModifyDBClusterCommand(scaleDownParams));
      console.log('✅ Database warmed - scaled back to 1.0 ACU min capacity');

      return true;

    } catch (error) {
      console.error('❌ Database warming failed:', error);
      return false;
    } finally {
      this.isWarming = false;
    }
  }

  // Check if warming is recommended based on error patterns
  shouldWarmDatabase(error) {
    const errorMessage = error.message.toLowerCase();
    
    return errorMessage.includes('timeout') || 
           errorMessage.includes('etimedout') ||
           errorMessage.includes('connection terminated') ||
           errorMessage.includes('network is unreachable');
  }
}

module.exports = new ConnectionWarmer();
