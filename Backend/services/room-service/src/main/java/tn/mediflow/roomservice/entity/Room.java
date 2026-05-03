package tn.mediflow.roomservice.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String roomNumber;

    @Column(nullable = false)
    private String service;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomType type;

    @Column(nullable = false)
    private Integer capacity;

    @Column(length = 500)
    private String description;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Builder.Default
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Bed> beds = new ArrayList<>();

    public enum RoomType {
        SIMPLE,
        DOUBLE,
        VIP,
        ICU,
        PEDIATRIC,
        MATERNITY
    }

    public long getAvailableBeds() {
        return beds.stream()
                .filter(b -> b.getStatus() == Bed.BedStatus.AVAILABLE)
                .count();
    }

    public long getOccupiedBeds() {
        return beds.stream()
                .filter(b -> b.getStatus() == Bed.BedStatus.OCCUPIED)
                .count();
    }

    public boolean hasAvailableBed() {
        return getAvailableBeds() > 0;
    }
}