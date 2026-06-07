package tn.mediflow.assuranceservice.service;

import feign.FeignException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.mediflow.assuranceservice.client.PatientClient;
import tn.mediflow.assuranceservice.dto.AssuranceCreateRequest;
import tn.mediflow.assuranceservice.dto.AssuranceResponse;
import tn.mediflow.assuranceservice.dto.AssuranceUpdateRequest;
import tn.mediflow.assuranceservice.entity.Assurance;
import tn.mediflow.assuranceservice.exception.AssuranceNotFoundException;
import tn.mediflow.assuranceservice.exception.PatientNotFoundException;
import tn.mediflow.assuranceservice.repository.AssuranceRepository;

@Service
public class AssuranceService {

    private final AssuranceRepository assuranceRepository;
    private final PatientClient patientClient;

    public AssuranceService(AssuranceRepository assuranceRepository, PatientClient patientClient) {
        this.assuranceRepository = assuranceRepository;
        this.patientClient = patientClient;
    }

    @Transactional
    public AssuranceResponse create(AssuranceCreateRequest request) {
        verifyPatientExists(request.patientId());

        Assurance assurance = new Assurance();
        assurance.setPatientId(request.patientId());
        assurance.setTypeAssurance(request.typeAssurance());
        assurance.setTauxRemboursement(request.tauxRemboursement());
        assurance.setActive(request.active() == null || request.active());

        Assurance saved = assuranceRepository.save(assurance);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AssuranceResponse getById(Long id) {
        Assurance assurance = assuranceRepository.findById(id).orElseThrow(() -> new AssuranceNotFoundException(id));
        return toResponse(assurance);
    }

    @Transactional(readOnly = true)
    public List<AssuranceResponse> getByPatientId(Long patientId) {
        return assuranceRepository.findByPatientId(patientId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AssuranceResponse setActive(Long id, boolean active) {
        Assurance assurance = assuranceRepository.findById(id).orElseThrow(() -> new AssuranceNotFoundException(id));
        assurance.setActive(active);
        return toResponse(assuranceRepository.save(assurance));
    }

    @Transactional
    public AssuranceResponse update(Long id, AssuranceUpdateRequest request) {
        verifyPatientExists(request.patientId());

        Assurance assurance = assuranceRepository.findById(id).orElseThrow(() -> new AssuranceNotFoundException(id));
        assurance.setPatientId(request.patientId());
        assurance.setTypeAssurance(request.typeAssurance());
        assurance.setTauxRemboursement(request.tauxRemboursement());
        assurance.setActive(request.active());
        return toResponse(assuranceRepository.save(assurance));
    }

    @Transactional
    public void delete(Long id) {
        if (!assuranceRepository.existsById(id)) {
            throw new AssuranceNotFoundException(id);
        }
        assuranceRepository.deleteById(id);
    }

    private void verifyPatientExists(Long patientId) {
        try {
            patientClient.getPatientById(patientId);
        } catch (FeignException.NotFound ex) {
            throw new PatientNotFoundException(patientId);
        }
    }

    private AssuranceResponse toResponse(Assurance assurance) {
        return new AssuranceResponse(
                assurance.getId(),
                assurance.getPatientId(),
                assurance.getTypeAssurance(),
                assurance.getTauxRemboursement(),
                assurance.isActive()
        );
    }
}
