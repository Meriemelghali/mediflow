package tn.mediflow.billingservice.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String reference;

    private Double montantTotal;

    private String statut;

    @OneToMany(mappedBy = "facture")
    @JsonManagedReference
    private List<Paiement> paiements;
}