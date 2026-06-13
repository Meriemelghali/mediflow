package tn.mediflow.patientservice.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import tn.mediflow.patientservice.dto.PatientDto;
import tn.mediflow.patientservice.exception.PatientNotFoundException;

@Service
public class PatientService {

    private final Map<Long, PatientDto> patients = new ConcurrentHashMap<>(Map.of(
            1L, new PatientDto(1L, "Test Patient One"),
            2L, new PatientDto(2L, "Test Patient Two")
    ));

    public PatientDto getById(Long id) {
        PatientDto patient = patients.get(id);
        if (patient == null) {
            throw new PatientNotFoundException(id);
        }
        return patient;
    }

    public void savePatient(PatientDto patient) {
        patients.put(patient.id(), patient);
    }
}

