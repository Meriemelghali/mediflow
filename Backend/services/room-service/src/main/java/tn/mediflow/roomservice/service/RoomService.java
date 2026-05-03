package tn.mediflow.roomservice.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.mediflow.roomservice.entity.Bed;
import tn.mediflow.roomservice.entity.Room;
import tn.mediflow.roomservice.repository.BedRepository;
import tn.mediflow.roomservice.repository.RoomRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;

    // ============================
    // CREATE
    // ============================

    public Room addRoom(Room room) {
        if (roomRepository.existsByRoomNumber(room.getRoomNumber())) {
            throw new IllegalArgumentException(
                    "Une chambre avec le numero '" + room.getRoomNumber() + "' existe deja.");
        }

        room.setActive(true);
        Room savedRoom = roomRepository.save(room);

        // Generation automatique des lits selon la capacite
        for (int i = 1; i <= savedRoom.getCapacity(); i++) {
            Bed bed = Bed.builder()
                    .bedNumber(savedRoom.getRoomNumber() + "-L" + String.format("%02d", i))
                    .status(Bed.BedStatus.AVAILABLE)
                    .active(true)
                    .room(savedRoom)
                    .build();
            bedRepository.save(bed);
        }

        log.info("Chambre '{}' creee avec {} lit(s) - Service: {}",
                savedRoom.getRoomNumber(), savedRoom.getCapacity(), savedRoom.getService());
        return getRoomById(savedRoom.getId());
    }

    // ============================
    // READ
    // ============================

    @Transactional(readOnly = true)
    public Room getRoomById(Long id) {
        return roomRepository.findByIdWithBeds(id)
                .orElseThrow(() -> new EntityNotFoundException("Chambre introuvable - ID: " + id));
    }

    @Transactional(readOnly = true)
    public Room getRoomByNumber(String roomNumber) {
        return roomRepository.findByRoomNumber(roomNumber)
                .orElseThrow(() -> new EntityNotFoundException("Chambre introuvable - Numero: " + roomNumber));
    }

    @Transactional(readOnly = true)
    public List<Room> getAllRooms() {
        return roomRepository.findByActiveTrue();
    }

    @Transactional(readOnly = true)
    public List<Room> getRoomsByService(String service) {
        return roomRepository.findByServiceAndActiveTrue(service);
    }

    @Transactional(readOnly = true)
    public List<Room> getRoomsByType(Room.RoomType type) {
        return roomRepository.findByType(type);
    }

    @Transactional(readOnly = true)
    public List<String> getAllServices() {
        return roomRepository.findAllDistinctServices();
    }

    // ============================
    // UPDATE
    // ============================

    public Room updateRoom(Long id, Room updated) {
        Room existing = roomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Chambre introuvable - ID: " + id));

        if (!existing.getRoomNumber().equals(updated.getRoomNumber())
                && roomRepository.existsByRoomNumber(updated.getRoomNumber())) {
            throw new IllegalArgumentException("Ce numero de chambre est deja utilise.");
        }

        existing.setRoomNumber(updated.getRoomNumber());
        existing.setService(updated.getService());
        existing.setType(updated.getType());
        existing.setDescription(updated.getDescription());
        if (updated.getActive() != null) {
            existing.setActive(updated.getActive());
        }

        Room saved = roomRepository.save(existing);
        log.info("Chambre {} mise a jour", saved.getRoomNumber());
        return saved;
    }

    // ============================
    // DELETE (soft)
    // ============================

    public void deleteRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Chambre introuvable - ID: " + id));

        long occupiedBeds = bedRepository.countByRoomIdAndStatus(id, Bed.BedStatus.OCCUPIED);
        if (occupiedBeds > 0) {
            throw new IllegalStateException(
                    "Impossible de supprimer une chambre ayant " + occupiedBeds + " lit(s) occupe(s).");
        }

        room.setActive(false);
        roomRepository.save(room);
        log.info("Chambre {} desactivee", room.getRoomNumber());
    }

    // ============================
    // STATS
    // ============================

    @Transactional(readOnly = true)
    public OccupancyStats getOccupancyStats() {
        List<Bed> all = bedRepository.findAll();
        long total       = all.size();
        long available   = all.stream().filter(b -> b.getStatus() == Bed.BedStatus.AVAILABLE).count();
        long occupied    = all.stream().filter(b -> b.getStatus() == Bed.BedStatus.OCCUPIED).count();
        long cleaning    = all.stream().filter(b -> b.getStatus() == Bed.BedStatus.CLEANING).count();
        long maintenance = all.stream().filter(b -> b.getStatus() == Bed.BedStatus.MAINTENANCE).count();
        double rate = total > 0 ? Math.round(((double) occupied / total) * 10000.0) / 100.0 : 0.0;
        return new OccupancyStats(total, available, occupied, cleaning, maintenance, rate);
    }

    public record OccupancyStats(
            long totalBeds,
            long availableBeds,
            long occupiedBeds,
            long cleaningBeds,
            long maintenanceBeds,
            double occupancyRate
    ) {}
}