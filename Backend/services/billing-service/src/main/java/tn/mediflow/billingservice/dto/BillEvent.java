package tn.mediflow.billingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillEvent {
    private String reference;
    private Double montantTotal;
    private String statut;
}
