package tn.mediflow.assuranceservice.exception;

public class PatientNotFoundException extends RuntimeException {
    public PatientNotFoundException(Long patientId) {
        super("Patient not found: " + patientId);
    }
}

