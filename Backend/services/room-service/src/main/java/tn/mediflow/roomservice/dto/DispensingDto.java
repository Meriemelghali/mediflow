package tn.mediflow.roomservice.feign;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO reçu depuis le pharmacy-service via OpenFeign.
 * Correspond à l'entité Dispensing du pharmacy-service.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispensingDto {
    private Long id;
    private Long medicationId;
    private Long patientId;
    private Integer quantity;
    private BigDecimal totalAmount;
    private LocalDateTime dispensingDate;
    private Long invoiceId;
}