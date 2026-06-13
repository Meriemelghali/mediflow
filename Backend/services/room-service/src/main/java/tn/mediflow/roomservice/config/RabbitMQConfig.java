package tn.mediflow.roomservice.config;

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
    public static final String QUEUE_ROOM = "notification.room.queue";
    public static final String RK_ROOM_ASSIGNED = "room.assigned";

    @Bean
    public TopicExchange mediflowExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue roomQueue() {
        return new Queue(QUEUE_ROOM, true);
    }

    @Bean
    public Binding bindingRoom(Queue roomQueue, TopicExchange mediflowExchange) {
        return BindingBuilder.bind(roomQueue).to(mediflowExchange).with(RK_ROOM_ASSIGNED);
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
