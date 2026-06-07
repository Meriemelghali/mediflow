package tn.mediflow.pharmacyservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.mediflow.pharmacyservice.dto.DispensingRequest;
import tn.mediflow.pharmacyservice.entity.Dispensing;
import tn.mediflow.pharmacyservice.service.DispensingService;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/dispensings")
@RequiredArgsConstructor
public class DispensingController {

    private final DispensingService service;

    @PostMapping
    public ResponseEntity<Dispensing> dispense(@Valid @RequestBody DispensingRequest request) {
        return ResponseEntity.ok(service.dispense(request));
    }

    @GetMapping
    public List<Dispensing> getAll() {
        return service.getAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<Dispensing> getByPatient(@PathVariable Long patientId) {
        return service.getByPatient(patientId);
    }
}