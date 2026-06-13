package tn.mediflow.assuranceservice.messaging;

import java.util.Map;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class AssuranceEventListener {

    public static final List<String> eventLogs = new CopyOnWriteArrayList<>();

    @RabbitListener(queues = AssuranceEventProducer.ASSURANCE_QUEUE)
    public void handleAssuranceEvent(Map<String, Object> payload) {
        Object patientId = payload.get("patientId");
        Object tauxRemboursement = payload.get("tauxRemboursement");
        Object active = payload.get("active");

        String msg = "[AssuranceEventListener] Police d'assurance créée pour patient " + patientId
                + ", taux=" + tauxRemboursement + ", active=" + active;
        System.out.println(msg);
        eventLogs.add(msg);
    }
}
