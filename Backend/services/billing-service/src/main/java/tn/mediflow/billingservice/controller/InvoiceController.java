package tn.mediflow.billingservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.mediflow.billingservice.dto.InvoiceRequest;
import tn.mediflow.billingservice.dto.InvoiceResponse;
import tn.mediflow.billingservice.entity.Facture;
import tn.mediflow.billingservice.repository.FactureRepository;

import java.util.UUID;

@RestController
@RequestMapping("/api/billing/invoices")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {

    private final FactureRepository factureRepository;

    /**
     * Endpoint appelé par pharmacy-service via OpenFeign.
     * Reçoit un InvoiceRequest, crée une Facture (modèle interne), retourne InvoiceResponse.
     */
    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@RequestBody InvoiceRequest request) {
        log.info("Invoice request received from '{}': patient={}, total={}",
                request.getSource(), request.getPatientId(), request.getTotalAmount());

        // Conversion InvoiceRequest -> Facture (modèle interne du collègue)
        Facture facture = new Facture();
        facture.setReference("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        facture.setMontantTotal(request.getTotalAmount().doubleValue());
        facture.setStatut("PENDING");

        Facture saved = factureRepository.save(facture);
        log.info("Invoice saved: id={}, reference={}", saved.getId(), saved.getReference());

        // Construction de la réponse pour pharmacy-service
        InvoiceResponse response = InvoiceResponse.builder()
                .id(saved.getId())
                .patientId(request.getPatientId())
                .totalAmount(request.getTotalAmount())
                .status(saved.getStatut())
                .build();

        return ResponseEntity.ok(response);
    }
}