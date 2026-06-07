package tn.mediflow.billingservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.mediflow.billingservice.entity.Facture;
import tn.mediflow.billingservice.service.FactureService;

import java.util.List;

@RestController
@RequestMapping("/api/factures")
@RequiredArgsConstructor
public class FactureController {

    private final FactureService factureService;

    @PostMapping
    public Facture ajouterFacture(@RequestBody Facture facture) {
        return factureService.ajouterFacture(facture);
    }

    @GetMapping
    public List<Facture> getAllFactures() {
        return factureService.getAllFactures();
    }

    @GetMapping("/{id}")
    public Facture getFactureById(@PathVariable Long id) {
        return factureService.getFactureById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteFacture(@PathVariable Long id) {
        factureService.deleteFacture(id);
    }
    @PutMapping("/{id}")
    public Facture updateFacture(@PathVariable Long id,
                                 @RequestBody Facture facture) {

        return factureService.updateFacture(id, facture);
    }
}