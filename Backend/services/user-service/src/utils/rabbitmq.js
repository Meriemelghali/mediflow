const amqp = require('amqplib');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = 'mediflow.exchange';
  }

  async connect() {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();
      
      // Ensure the exchange exists (Topic exchange for flexible routing)
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      
      console.log('✅ Connected to RabbitMQ (user-service)');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error.message);
      // Retry logic could be added here
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publish(routingKey, message) {
    if (!this.channel) {
      console.warn('RabbitMQ channel not initialized. Cannot publish message.');
      return;
    }
    
    try {
      const buffer = Buffer.from(JSON.stringify(message));
      this.channel.publish(this.exchange, routingKey, buffer, { persistent: true });
      console.log(`📤 Message published to [${routingKey}]`);
    } catch (error) {
      console.error('Failed to publish message:', error);
    }
  }
}

// Export a singleton instance
const rabbitMQService = new RabbitMQService();
module.exports = rabbitMQService;
