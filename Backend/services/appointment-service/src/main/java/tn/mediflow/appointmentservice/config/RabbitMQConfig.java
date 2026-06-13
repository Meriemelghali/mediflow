package tn.mediflow.appointmentservice.config;

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
    public static final String QUEUE_APPOINTMENT = "notification.appointment.queue";
    public static final String RK_APPOINTMENT_CREATED = "appointment.created";

    @Bean
    public TopicExchange mediflowExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue appointmentQueue() {
        return new Queue(QUEUE_APPOINTMENT, true);
    }

    @Bean
    public Binding bindingAppointment(Queue appointmentQueue, TopicExchange mediflowExchange) {
        return BindingBuilder.bind(appointmentQueue).to(mediflowExchange).with(RK_APPOINTMENT_CREATED);
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
