package tn.mediflow.pharmacyservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.mediflow.pharmacyservice.entity.Medication;
import tn.mediflow.pharmacyservice.repository.MedicationRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicationService {

    private final MedicationRepository repository;

    public List<Medication> getAll() {
        return repository.findAll();
    }

    public Medication getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medication not found: " + id));
    }

    public Medication create(Medication medication) {
        return repository.save(medication);
    }

    public Medication update(Long id, Medication updated) {
        Medication existing = getById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setCategory(updated.getCategory());
        existing.setUnitPrice(updated.getUnitPrice());
        existing.setCurrentStock(updated.getCurrentStock());
        existing.setManufacturer(updated.getManufacturer());
        existing.setExpirationDate(updated.getExpirationDate());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Medication> getLowStock(Integer threshold) {
        return repository.findByCurrentStockLessThan(threshold);
    }
}