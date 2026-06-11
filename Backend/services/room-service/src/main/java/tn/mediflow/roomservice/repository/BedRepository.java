package tn.mediflow.roomservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.mediflow.roomservice.entity.Bed;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {

    List<Bed> findByRoomId(Long roomId);

    List<Bed> findByStatus(Bed.BedStatus status);

    Optional<Bed> findByPatientIdAndStatus(Long patientId, Bed.BedStatus status);

    boolean existsByBedNumberAndRoomId(String bedNumber, Long roomId);

    @Query("SELECT b FROM Bed b WHERE b.status = 'AVAILABLE' AND b.active = true")
    List<Bed> findAllAvailable();

    @Query("SELECT b FROM Bed b JOIN b.room r WHERE r.service = :service AND b.status = 'AVAILABLE' AND b.active = true")
    List<Bed> findAvailableByService(String service);

    @Query("SELECT COUNT(b) FROM Bed b WHERE b.room.id = :roomId AND b.status = :status")
    long countByRoomIdAndStatus(Long roomId, Bed.BedStatus status);

    List<Bed> findByPatientId(Long patientId);
}