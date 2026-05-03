package tn.mediflow.pharmacyservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.mediflow.pharmacyservice.entity.Medication;
import tn.mediflow.pharmacyservice.service.MedicationService;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/medications")
@RequiredArgsConstructor
public class MedicationController {

    private final MedicationService service;

    @GetMapping
    public List<Medication> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Medication getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<Medication> create(@Valid @RequestBody Medication medication) {
        return ResponseEntity.ok(service.create(medication));
    }

    @PutMapping("/{id}")
    public Medication update(@PathVariable Long id, @Valid @RequestBody Medication medication) {
        return service.update(id, medication);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/low-stock")
    public List<Medication> getLowStock(@RequestParam(defaultValue = "10") Integer threshold) {
        return service.getLowStock(threshold);
    }
}