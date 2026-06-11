package tn.mediflow.pharmacyservice.bootstrap;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tn.mediflow.pharmacyservice.entity.Medication;
import tn.mediflow.pharmacyservice.repository.MedicationRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Seeds a few medication records when the application starts.
 */
@Component
@RequiredArgsConstructor
public class MedicationDataSeeder {

    private final MedicationRepository medicationRepository;

    @PostConstruct
    public void init() {
        // Guard against duplicate inserts on hot‑restarts
        if (medicationRepository.count() > 0) {
            return;
        }

        List<Medication> meds = List.of(
            Medication.builder()
                .name("Paracétamol 500 mg")
                .description("Antalgique et antipyrétique")
                .category("Antalgique")
                .unitPrice(new BigDecimal("3.50"))
                .currentStock(150)
                .manufacturer("Sanofi")
                .expirationDate(LocalDate.now().plusYears(2))
                .build(),

            Medication.builder()
                .name("Ibuprofène 200 mg")
                .description("Anti‑inflammatoire non stéroïdien")
                .category("Anti‑inflammatoire")
                .unitPrice(new BigDecimal("4.20"))
                .currentStock(80)
                .manufacturer("Pfizer")
                .expirationDate(LocalDate.now().plusYears(1))
                .build(),

            Medication.builder()
                .name("Amoxicilline 500 mg")
                .description("Antibiotique à large spectre")
                .category("Antibiotique")
                .unitPrice(new BigDecimal("6.00"))
                .currentStock(30)
                .manufacturer("Novartis")
                .expirationDate(LocalDate.now().plusMonths(18))
                .build(),

            Medication.builder()
                .name("Dextrose 5 % (solution injectable)")
                .description("Solution glucosée pour perfusion")
                .category("Intraveineux")
                .unitPrice(new BigDecimal("12.00"))
                .currentStock(20)
                .manufacturer("Baxter")
                .expirationDate(LocalDate.now().plusMonths(12))
                .build()
        );

        medicationRepository.saveAll(meds);
        System.out.println("🔹 Medication seed data inserted (" + meds.size() + " records).");
    }
}
