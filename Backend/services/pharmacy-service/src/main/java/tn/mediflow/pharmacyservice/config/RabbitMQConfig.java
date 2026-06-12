package tn.mediflow.pharmacyservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // ── Exchange (Topic = routage flexible par pattern) ──────────────────────
    public static final String EXCHANGE = "mediflow.exchange";

    // ── Queues ───────────────────────────────────────────────────────────────
    /** Scénario 3 : Écoute les patients créés par le user-service */
    public static final String QUEUE_PATIENT_CREATED  = "pharmacy.patient.queue";

    /** Scénario 1 & 2 : La pharmacie publie ici pour le notification-service */
    public static final String QUEUE_STOCK_ALERT      = "notification.stock.queue";
    public static final String QUEUE_DISPENSE_EVENT   = "notification.dispense.queue";

    // ── Routing Keys ─────────────────────────────────────────────────────────
    public static final String RK_PATIENT_CREATED  = "patient.created";
    public static final String RK_STOCK_LOW_ALERT  = "stock.low_alert";
    public static final String RK_MEDICATION_DISPENSED = "medication.dispensed";

    // ─── Beans ───────────────────────────────────────────────────────────────

    @Bean
    TopicExchange mediflowExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    Queue patientCreatedQueue() {
        return new Queue(QUEUE_PATIENT_CREATED, true);
    }

    @Bean
    Queue stockAlertQueue() {
        return new Queue(QUEUE_STOCK_ALERT, true);
    }

    @Bean
    Queue dispenseEventQueue() {
        return new Queue(QUEUE_DISPENSE_EVENT, true);
    }

    @Bean
    Binding bindingPatientCreated(Queue patientCreatedQueue, TopicExchange mediflowExchange) {
        return BindingBuilder.bind(patientCreatedQueue).to(mediflowExchange).with(RK_PATIENT_CREATED);
    }

    @Bean
    Binding bindingStockAlert(Queue stockAlertQueue, TopicExchange mediflowExchange) {
        return BindingBuilder.bind(stockAlertQueue).to(mediflowExchange).with(RK_STOCK_LOW_ALERT);
    }

    @Bean
    Binding bindingDispenseEvent(Queue dispenseEventQueue, TopicExchange mediflowExchange) {
        return BindingBuilder.bind(dispenseEventQueue).to(mediflowExchange).with(RK_MEDICATION_DISPENSED);
    }

    /** Convertisseur JSON — les messages sont sérialisés/désérialisés en JSON automatiquement */
    @Bean
    MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
