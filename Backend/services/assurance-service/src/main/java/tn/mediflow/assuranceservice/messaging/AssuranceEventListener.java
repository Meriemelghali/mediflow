package tn.mediflow.assuranceservice.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class AssuranceEventListener {

    @RabbitListener(queues = AssuranceEventProducer.ASSURANCE_QUEUE)
    public void handleAssuranceEvent(Object payload) {
        // TODO: implement domain handling
        System.out.println("[AssuranceEventListener] received: " + payload);
    }
}
