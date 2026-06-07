package tn.mediflow.assuranceservice.exception;

public class AssuranceNotFoundException extends RuntimeException {
    public AssuranceNotFoundException(Long id) {
        super("Assurance not found: " + id);
    }
}

