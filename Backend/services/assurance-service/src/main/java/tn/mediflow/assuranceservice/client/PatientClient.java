package tn.mediflow.assuranceservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import tn.mediflow.assuranceservice.dto.PatientDto;

@FeignClient(name = "patient-service")
public interface PatientClient {

    @GetMapping("/patients/{id}")
    PatientDto getPatientById(@PathVariable("id") Long id);
}

