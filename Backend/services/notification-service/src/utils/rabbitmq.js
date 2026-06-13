const amqp = require('amqplib');
const Notification = require('../models/Notification');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = 'mediflow.exchange';
  }

  async connect() {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://mediflow:mediflow123@localhost:5672';
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Ensure the exchange exists
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      console.log('✅ Connected to RabbitMQ (notification-service)');

      // Configure consumers
      await this.setupConsumers();
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ in notification-service:', error.message);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async setupConsumers() {
    const routingQueueMapping = [
      {
        queue: 'notification.stock.queue',
        routingKey: 'stock.low_alert',
        type: 'STOCK_ALERT',
        handler: (msg) => `⚠️ Alerte Stock Faible: Le médicament "${msg.medicationName}" (ID: ${msg.medicationId}) est sous le seuil critique avec seulement ${msg.currentStock} unités restantes.`
      },
      {
        queue: 'notification.dispense.queue',
        routingKey: 'medication.dispensed',
        type: 'MEDICATION_DISPENSED',
        handler: (msg) => `💊 Médicament Délivré: Le patient #${msg.patientId} a reçu ${msg.quantity} unités de "${msg.medicationName}" (Montant total: ${msg.totalAmount} DT).`
      },
      {
        queue: 'notification.appointment.queue',
        routingKey: 'appointment.created',
        type: 'APPOINTMENT_CREATED',
        handler: (msg) => `📅 Nouveau Rendez-vous: Patient #${msg.patientId} a réservé le rendez-vous #${msg.appointmentId} le ${msg.appointmentDate} avec le médecin #${msg.doctorId}.`
      },
      {
        queue: 'notification.room.queue',
        routingKey: 'room.assigned',
        type: 'ROOM_ASSIGNED',
        handler: (msg) => `🏥 Chambre Assignée: Le patient #${msg.patientId} a été admis dans la chambre #${msg.roomId} (Service: ${msg.department}) pour un coût journalier de ${msg.pricePerDay} DT.`
      }
    ];

    for (const mapping of routingQueueMapping) {
      await this.channel.assertQueue(mapping.queue, { durable: true });
      await this.channel.bindQueue(mapping.queue, this.exchange, mapping.routingKey);

      this.channel.consume(mapping.queue, async (msg) => {
        if (!msg) return;
        
        try {
          const payload = JSON.parse(msg.content.toString());
          const friendlyMessage = mapping.handler(payload);
          
          console.log(`📥 [RabbitMQ Consumer] Événement reçu (${mapping.routingKey}):`, friendlyMessage);

          // Save to MongoDB
          const notification = new Notification({
            type: mapping.type,
            message: friendlyMessage,
            payload: payload
          });
          await notification.save();

          this.channel.ack(msg);
        } catch (err) {
          console.error(`❌ Error processing queue ${mapping.queue}:`, err.message);
          // Nack and requeue
          this.channel.nack(msg, false, true);
        }
      });
      console.log(`📡 Écoute activée sur la queue: ${mapping.queue}`);
    }
  }
}

const rabbitMQService = new RabbitMQService();
module.exports = rabbitMQService;
