package tn.mediflow.pharmacyservice.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import tn.mediflow.pharmacyservice.config.RabbitMQConfig;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Producteur de messages RabbitMQ.
 *
 * ► Scénario 1 : Alerte de stock faible  → routing key "stock.low_alert"
 * ► Scénario 2 : Médicament délivré      → routing key "medication.dispensed"
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RabbitMQProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Scénario 1 — Publie une alerte quand le stock d'un médicament passe sous 10.
     *
     * @param medicationId   ID du médicament en rupture imminente
     * @param medicationName Nom du médicament
     * @param currentStock   Quantité restante
     */
    public void sendStockLowAlert(Long medicationId, String medicationName, Integer currentStock) {
        Map<String, Object> message = Map.of(
                "medicationId",   medicationId,
                "medicationName", medicationName,
                "currentStock",   currentStock,
                "threshold",      10,
                "alertedAt",      LocalDateTime.now().toString()
        );

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.RK_STOCK_LOW_ALERT,
                message
        );

        log.warn("🔴 [RabbitMQ Producer] ALERTE STOCK FAIBLE envoyée → '{}' (stock: {})",
                medicationName, currentStock);
    }

    /**
     * Scénario 2 — Publie un événement quand un médicament est délivré à un patient.
     *
     * @param patientId      Code patient (patientCode)
     * @param medicationName Nom du médicament distribué
     * @param quantity       Quantité délivrée
     * @param totalAmount    Montant total de la dispensation
     */
    public void sendMedicationDispensedEvent(Long patientId, String medicationName,
                                             Integer quantity, double totalAmount) {
        Map<String, Object> message = Map.of(
                "patientId",      patientId,
                "medicationName", medicationName,
                "quantity",       quantity,
                "totalAmount",    totalAmount,
                "dispensedAt",    LocalDateTime.now().toString()
        );

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.RK_MEDICATION_DISPENSED,
                message
        );

        log.info("📤 [RabbitMQ Producer] Événement 'medication.dispensed' envoyé → Patient: {}, Médicament: '{}'",
                patientId, medicationName);
    }
}
