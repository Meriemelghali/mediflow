package tn.mediflow.examservice.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import tn.mediflow.examservice.dto.Patient;

@FeignClient(name = "patient-service")
public interface PatientClient {
    @GetMapping("/patients/{id}")
    Patient getPatientById(@PathVariable("id") Long id);
}
