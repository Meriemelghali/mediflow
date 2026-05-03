package tn.mediflow.roomservice.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "pharmacy-service")
public interface PharmacyClient {

    /**
     * Récupère tous les dispensings d'un patient donné.
     */
    @GetMapping("/api/pharmacy/dispensings/patient/{patientId}")
    List<DispensingDto> getDispensingsByPatient(@PathVariable("patientId") Long patientId);

    /**
     * Récupère les médicaments en stock faible.
     * Utile pour afficher une alerte au moment de l'admission.
     */
    @GetMapping("/api/pharmacy/medications/low-stock")
    List<MedicationDto> getLowStockMedications(@RequestParam(defaultValue = "10") Integer threshold);
}