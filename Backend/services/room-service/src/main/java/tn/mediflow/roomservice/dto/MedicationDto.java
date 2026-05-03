package tn.mediflow.roomservice.feign;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO reçu depuis le pharmacy-service via OpenFeign.
 * Correspond à l'entité Medication du pharmacy-service.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicationDto {
    private Long id;
    private String name;
    private String description;
    private String category;
    private BigDecimal unitPrice;
    private Integer currentStock;
    private String manufacturer;
    private LocalDate expirationDate;
}