package tn.mediflow.pharmacyservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.mediflow.pharmacyservice.client.BillingClient;
import tn.mediflow.pharmacyservice.dto.DispensingRequest;
import tn.mediflow.pharmacyservice.dto.InvoiceRequest;
import tn.mediflow.pharmacyservice.dto.InvoiceResponse;
import tn.mediflow.pharmacyservice.entity.Dispensing;
import tn.mediflow.pharmacyservice.entity.Medication;
import tn.mediflow.pharmacyservice.repository.DispensingRepository;
import tn.mediflow.pharmacyservice.repository.MedicationRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DispensingService {

    private final MedicationRepository medicationRepository;
    private final DispensingRepository dispensingRepository;
    private final BillingClient billingClient;

    @Transactional
    public Dispensing dispense(DispensingRequest request) {
        log.info("Starting dispensing for medication {} to patient {}",
                request.getMedicationId(), request.getPatientId());

        Medication medication = medicationRepository.findById(request.getMedicationId())
                .orElseThrow(() -> new RuntimeException(
                        "Medication not found: " + request.getMedicationId()));

        if (medication.getCurrentStock() < request.getQuantity()) {
            throw new RuntimeException("Insufficient stock for: " + medication.getName());
        }

        medication.setCurrentStock(medication.getCurrentStock() - request.getQuantity());
        medicationRepository.save(medication);
        log.info("Stock updated: {} units remaining", medication.getCurrentStock());

        BigDecimal totalAmount = medication.getUnitPrice()
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        Dispensing dispensing = Dispensing.builder()
                .medicationId(request.getMedicationId())
                .patientId(request.getPatientId())
                .quantity(request.getQuantity())
                .totalAmount(totalAmount)
                .dispensingDate(LocalDateTime.now())
                .build();

        InvoiceRequest invoiceRequest = InvoiceRequest.builder()
                .patientId(request.getPatientId())
                .description("Medication dispensing: " + medication.getName())
                .quantity(request.getQuantity())
                .unitPrice(medication.getUnitPrice())
                .totalAmount(totalAmount)
                .source("PHARMACY")
                .build();

        try {
            log.info("Calling billing-service to create invoice...");
            InvoiceResponse invoice = billingClient.createInvoice(invoiceRequest);
            dispensing.setInvoiceId(invoice.getId());
            log.info("Invoice created with ID: {}", invoice.getId());
        } catch (Exception e) {
            log.error("Failed to create invoice via billing-service", e);
            throw new RuntimeException("Billing service error: " + e.getMessage());
        }

        return dispensingRepository.save(dispensing);
    }

    public List<Dispensing> getAll() {
        return dispensingRepository.findAll();
    }

    public List<Dispensing> getByPatient(Long patientId) {
        return dispensingRepository.findByPatientId(patientId);
    }
}