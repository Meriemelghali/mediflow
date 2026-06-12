package tn.mediflow.pharmacyservice;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import tn.mediflow.pharmacyservice.entity.Medication;
import tn.mediflow.pharmacyservice.repository.MedicationRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;

@SpringBootApplication
@EnableFeignClients
public class PharmacyServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(PharmacyServiceApplication.class, args);
	}

	@Bean
	CommandLineRunner initDatabase(MedicationRepository medicationRepository) {
		return args -> {
			if (medicationRepository.count() == 0) {
				Medication m1 = Medication.builder()
						.name("Doliprane 1000mg")
						.description("Antalgique et antipyretique pour soulager la douleur et la fievre")
						.category("Antalgique")
						.unitPrice(new BigDecimal("3.50"))
						.currentStock(150)
						.manufacturer("Sanofi")
						.expirationDate(LocalDate.now().plusYears(2))
						.build();

				Medication m2 = Medication.builder()
						.name("Amoxicilline 500mg")
						.description("Antibiotique de la famille des beta-lactamines pour infections bacteriennes")
						.category("Antibiotique")
						.unitPrice(new BigDecimal("6.20"))
						.currentStock(80)
						.manufacturer("Biogaran")
						.expirationDate(LocalDate.now().plusYears(1))
						.build();

				Medication m3 = Medication.builder()
						.name("Ibuprofene 400mg")
						.description("Anti-inflammatoire non steroidien (AINS) pour douleurs et fievre")
						.category("Anti-inflammatoire")
						.unitPrice(new BigDecimal("4.10"))
						.currentStock(120)
						.manufacturer("Mylan")
						.expirationDate(LocalDate.now().plusYears(3))
						.build();

				Medication m4 = Medication.builder()
						.name("Aerius 5mg")
						.description("Antihistaminique de deuxieme generation pour traiter les allergies")
						.category("Antihistaminique")
						.unitPrice(new BigDecimal("8.90"))
						.currentStock(60)
						.manufacturer("MSD")
						.expirationDate(LocalDate.now().plusYears(2))
						.build();

				Medication m5 = Medication.builder()
						.name("Spasfon Lyoc")
						.description("Antispasmodique pour le traitement des douleurs spasmodiques")
						.category("Antispasmodique")
						.unitPrice(new BigDecimal("5.40"))
						.currentStock(90)
						.manufacturer("Teva")
						.expirationDate(LocalDate.now().plusYears(2))
						.build();

				medicationRepository.saveAll(Arrays.asList(m1, m2, m3, m4, m5));
				System.out.println(">>> Pharmacy Database Seeded successfully with 5 medications!");
			}
		};
	}

}
