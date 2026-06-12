package tn.mediflow.assuranceservice.messaging;

import java.util.Map;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class AssuranceEventListener {

    @RabbitListener(queues = AssuranceEventProducer.ASSURANCE_QUEUE)
    public void handleAssuranceEvent(Map<String, Object> payload) {
        Object patientId = payload.get("patientId");
        Object tauxRemboursement = payload.get("tauxRemboursement");
        Object active = payload.get("active");

        System.out.println("[AssuranceEventListener] Police d'assurance créée pour patient " + patientId
                + ", taux=" + tauxRemboursement + ", active=" + active);
    }
}
