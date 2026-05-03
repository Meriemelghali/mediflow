package tn.mediflow.billingservice.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {
    private Long id;
    private Long patientId;
    private BigDecimal totalAmount;
    private String status;
}