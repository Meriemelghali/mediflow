package tn.mediflow.roomservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.mediflow.roomservice.entity.Room;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomNumber(String roomNumber);

    boolean existsByRoomNumber(String roomNumber);

    List<Room> findByActiveTrue();

    List<Room> findByService(String service);

    List<Room> findByServiceAndActiveTrue(String service);

    List<Room> findByType(Room.RoomType type);

    @Query("SELECT DISTINCT r.service FROM Room r WHERE r.active = true")
    List<String> findAllDistinctServices();

    @Query("SELECT r FROM Room r LEFT JOIN FETCH r.beds WHERE r.id = :id")
    Optional<Room> findByIdWithBeds(Long id);

    @Query("SELECT r FROM Room r JOIN r.beds b WHERE b.status = 'AVAILABLE' AND r.service = :service AND r.active = true")
    List<Room> findRoomsWithAvailableBedsByService(String service);
}