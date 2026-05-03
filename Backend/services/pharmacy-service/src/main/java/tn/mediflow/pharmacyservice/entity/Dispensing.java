package tn.mediflow.pharmacyservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispensings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispensing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long medicationId;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private LocalDateTime dispensingDate;

    private Long invoiceId;
}