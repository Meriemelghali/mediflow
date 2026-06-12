package tn.mediflow.assuranceservice.messaging;


import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class AssuranceEventProducer {

    public static final String ASSURANCE_QUEUE = "assurance.events";

    private final RabbitTemplate rabbitTemplate;

    public AssuranceEventProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishAssuranceCreated(Object payload) {
        rabbitTemplate.convertAndSend(ASSURANCE_QUEUE, payload);
    }
}
