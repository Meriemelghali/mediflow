package tn.mediflow.roomservice.feign;

import lombok.*;
import tn.mediflow.roomservice.entity.Bed;

import java.util.List;

/**
 * Réponse enrichie retournée lors de l'assignation d'un patient à un lit.
 * Combine les infos du lit (room-service) avec l'historique
 * des médicaments délivrés au patient (pharmacy-service via Feign).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BedAssignmentResponse {

    // Infos du lit assigné
    private Bed bed;

    // Historique des médicaments du patient (depuis pharmacy-service)
    private List<DispensingDto> patientDispensings;

    // Alerte si des médicaments sont en stock faible dans la pharmacie
    private List<MedicationDto> lowStockAlerts;

    // Indique si le pharmacy-service était disponible lors de l'appel
    private boolean pharmacyServiceAvailable;

    // Message informatif
    private String message;
}