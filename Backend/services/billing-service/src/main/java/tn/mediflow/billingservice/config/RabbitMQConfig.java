package tn.mediflow.billingservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String BILLING_EXCHANGE = "billing_exchange";
    public static final String BILLING_QUEUE = "billing.queue";
    public static final String BILLING_ROUTING_KEY = "billing_routing_key";

    @Bean
    public TopicExchange billingExchange() {
        return new TopicExchange(BILLING_EXCHANGE);
    }

    @Bean
    public Queue billingQueue() {
        return new Queue(BILLING_QUEUE, true);
    }

    @Bean
    public Binding billingBinding(Queue billingQueue, TopicExchange billingExchange) {
        return BindingBuilder.bind(billingQueue).to(billingExchange).with(BILLING_ROUTING_KEY);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
