package tn.mediflow.pharmacyservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Dossier Pharmaceutique créé automatiquement lors de la réception
 * d'un événement "patient.created" via RabbitMQ depuis le user-service.
 */
@Entity
@Table(name = "pharmacy_patient_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PharmacyPatientRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private Long patientCode;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String email;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime registeredAt = LocalDateTime.now();

    @Column(length = 1000)
    @Builder.Default
    private String notes = "Dossier créé automatiquement à l'inscription.";
}
