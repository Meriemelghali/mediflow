package tn.mediflow.patientservice.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tn.mediflow.patientservice.config.RabbitMQConfig;
import tn.mediflow.patientservice.dto.PatientDto;
import tn.mediflow.patientservice.service.PatientService;

import java.util.Map;

@Component
public class PatientEventListener {

    private static final Logger log = LoggerFactory.getLogger(PatientEventListener.class);
    private final PatientService patientService;

    public PatientEventListener(PatientService patientService) {
        this.patientService = patientService;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_PATIENT_SYNC)
    public void handlePatientCreated(Map<String, Object> payload) {
        log.info("📥 [RabbitMQ Patient Sync] Message reçu sur '{}' : {}", 
                RabbitMQConfig.QUEUE_PATIENT_SYNC, payload);
        try {
            Long id = Long.valueOf(payload.get("patientCode").toString());
            String firstName = payload.getOrDefault("firstName", "Inconnu").toString();
            String lastName = payload.getOrDefault("lastName", "Inconnu").toString();
            String fullName = firstName + " " + lastName;

            PatientDto patient = new PatientDto(id, fullName);
            patientService.savePatient(patient);

            log.info("✅ [RabbitMQ Patient Sync] Patient synchronisé localement : {} (ID: {})", fullName, id);
        } catch (Exception e) {
            log.error("❌ [RabbitMQ Patient Sync] Erreur de synchronisation patient.created : {}", e.getMessage(), e);
        }
    }
}
