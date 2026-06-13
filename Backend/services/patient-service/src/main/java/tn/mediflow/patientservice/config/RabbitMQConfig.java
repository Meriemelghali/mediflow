package tn.mediflow.patientservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "mediflow.exchange";
    public static final String QUEUE_PATIENT_SYNC = "patient.sync.queue";
    public static final String RK_PATIENT_CREATED = "patient.created";

    @Bean
    public TopicExchange mediflowExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue patientSyncQueue() {
        return new Queue(QUEUE_PATIENT_SYNC, true);
    }

    @Bean
    public Binding bindingPatientSync(Queue patientSyncQueue, TopicExchange mediflowExchange) {
        return BindingBuilder.bind(patientSyncQueue).to(mediflowExchange).with(RK_PATIENT_CREATED);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
