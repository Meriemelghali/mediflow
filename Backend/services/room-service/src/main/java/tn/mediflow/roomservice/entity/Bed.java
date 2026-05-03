package tn.mediflow.roomservice.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "beds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String bedNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BedStatus status;

    @Column
    private Long patientId;

    @Column
    private String patientName;

    @Column
    private LocalDateTime occupiedAt;

    @Column
    private String notes;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    @JsonBackReference
    private Room room;

    public enum BedStatus {
        AVAILABLE,
        OCCUPIED,
        CLEANING,
        MAINTENANCE,
        RESERVED
    }

    public boolean isAvailable() {
        return status == BedStatus.AVAILABLE;
    }

    public void assignPatient(Long patientId, String patientName) {
        this.patientId = patientId;
        this.patientName = patientName;
        this.status = BedStatus.OCCUPIED;
        this.occupiedAt = LocalDateTime.now();
    }

    public void release() {
        this.patientId = null;
        this.patientName = null;
        this.status = BedStatus.CLEANING;
        this.occupiedAt = null;
    }
}