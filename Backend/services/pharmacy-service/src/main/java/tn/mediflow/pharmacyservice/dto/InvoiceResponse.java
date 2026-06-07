package tn.mediflow.pharmacyservice.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private Long patientId;
    private BigDecimal totalAmount;
    private String status;
}