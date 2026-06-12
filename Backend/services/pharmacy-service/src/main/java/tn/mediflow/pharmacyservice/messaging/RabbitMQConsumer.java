package tn.mediflow.pharmacyservice.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import tn.mediflow.pharmacyservice.config.RabbitMQConfig;
import tn.mediflow.pharmacyservice.entity.PharmacyPatientRecord;
import tn.mediflow.pharmacyservice.repository.PharmacyPatientRecordRepository;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Consommateur de messages RabbitMQ.
 *
 * ► Scénario 3 : Écoute "patient.created" depuis le user-service (Node.js)
 *   et crée automatiquement un dossier pharmaceutique pour le nouveau patient.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RabbitMQConsumer {

    private final PharmacyPatientRecordRepository patientRecordRepository;

    /**
     * Scénario 3 — Écoute la queue "pharmacy.patient.queue".
     * Quand un nouveau PATIENT est créé dans le user-service, ce listener
     * est déclenché automatiquement et initialise son dossier pharmaceutique.
     *
     * @param payload Le message JSON reçu (converti automatiquement en Map par Jackson)
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_PATIENT_CREATED)
    public void handlePatientCreated(Map<String, Object> payload) {
        log.info("📥 [RabbitMQ Consumer] Message reçu sur '{}' : {}",
                RabbitMQConfig.QUEUE_PATIENT_CREATED, payload);

        try {
            Long patientCode = Long.valueOf(payload.get("patientCode").toString());

            // Vérifier qu'il n'existe pas déjà (idempotence)
            if (patientRecordRepository.existsByPatientCode(patientCode)) {
                log.warn("⚠️ Dossier pharmaceutique déjà existant pour le patient #{} — ignoré.",
                        patientCode);
                return;
            }

            PharmacyPatientRecord record = PharmacyPatientRecord.builder()
                    .patientCode(patientCode)
                    .firstName(payload.getOrDefault("firstName", "Inconnu").toString())
                    .lastName(payload.getOrDefault("lastName", "Inconnu").toString())
                    .email(payload.getOrDefault("email", "").toString())
                    .registeredAt(LocalDateTime.now())
                    .notes("Dossier créé automatiquement à l'inscription via RabbitMQ.")
                    .build();

            patientRecordRepository.save(record);

            log.info("✅ [RabbitMQ Consumer] Dossier pharmaceutique créé pour : {} {} (code #{})",
                    record.getFirstName(), record.getLastName(), patientCode);

        } catch (Exception e) {
            log.error("❌ [RabbitMQ Consumer] Erreur lors du traitement du message patient.created : {}",
                    e.getMessage(), e);
        }
    }
}
