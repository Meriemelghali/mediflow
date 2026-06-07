package tn.mediflow.assuranceservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "assurances")
public class Assurance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private String typeAssurance;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal tauxRemboursement;

    @Column(nullable = false)
    private boolean active;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getTypeAssurance() {
        return typeAssurance;
    }

    public void setTypeAssurance(String typeAssurance) {
        this.typeAssurance = typeAssurance;
    }

    public BigDecimal getTauxRemboursement() {
        return tauxRemboursement;
    }

    public void setTauxRemboursement(BigDecimal tauxRemboursement) {
        this.tauxRemboursement = tauxRemboursement;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
