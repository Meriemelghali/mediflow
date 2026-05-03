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
public class BedService {

    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;

    // ============================
    // CREATE
    // ============================

    public Bed addBed(Long roomId, Bed bed) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("Chambre introuvable - ID: " + roomId));

        if (bedRepository.existsByBedNumberAndRoomId(bed.getBedNumber(), roomId)) {
            throw new IllegalArgumentException("Un lit avec ce numero existe deja dans cette chambre.");
        }

        bed.setRoom(room);
        bed.setStatus(Bed.BedStatus.AVAILABLE);
        bed.setActive(true);

        Bed saved = bedRepository.save(bed);
        log.info("Lit '{}' ajoute dans la chambre '{}'", saved.getBedNumber(), room.getRoomNumber());
        return saved;
    }

    // ============================
    // READ
    // ============================

    @Transactional(readOnly = true)
    public Bed getBedById(Long id) {
        return bedRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lit introuvable - ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Bed> getAllBeds() {
        return bedRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Bed> getBedsByRoom(Long roomId) {
        return bedRepository.findByRoomId(roomId);
    }

    @Transactional(readOnly = true)
    public List<Bed> getAvailableBeds() {
        return bedRepository.findAllAvailable();
    }

    @Transactional(readOnly = true)
    public List<Bed> getAvailableBedsByService(String service) {
        return bedRepository.findAvailableByService(service);
    }

    @Transactional(readOnly = true)
    public List<Bed> getBedsByPatient(Long patientId) {
        return bedRepository.findByPatientId(patientId);
    }

    // ============================
    // ASSIGN BED
    // ============================

    public Bed assignBed(Long bedId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new EntityNotFoundException("Lit introuvable - ID: " + bedId));

        if (!bed.isAvailable()) {
            throw new IllegalStateException(
                    "Le lit '" + bed.getBedNumber() + "' n'est pas disponible. Statut actuel: " + bed.getStatus());
        }

        bed.setStatus(Bed.BedStatus.RESERVED);
        Bed saved = bedRepository.save(bed);
        log.info("Lit '{}' reserve", saved.getBedNumber());
        return saved;
    }

    // ============================
    // RELEASE BED
    // ============================

    public Bed releaseBed(Long bedId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new EntityNotFoundException("Lit introuvable - ID: " + bedId));

        log.info("Liberation du lit '{}' (patient: '{}')", bed.getBedNumber(), bed.getPatientName());
        bed.release();
        return bedRepository.save(bed);
    }

    // ============================
    // UPDATE STATUS
    // ============================

    public Bed updateStatus(Long bedId, Bed.BedStatus newStatus, String notes) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new EntityNotFoundException("Lit introuvable - ID: " + bedId));

        Bed.BedStatus old = bed.getStatus();

        if (newStatus == Bed.BedStatus.AVAILABLE) {
            bed.setPatientId(null);
            bed.setPatientName(null);
            bed.setOccupiedAt(null);
        }

        bed.setStatus(newStatus);
        if (notes != null) bed.setNotes(notes);

        Bed saved = bedRepository.save(bed);
        log.info("Statut du lit '{}' : {} -> {}", saved.getBedNumber(), old, newStatus);
        return saved;
    }

    // ============================
    // DELETE (soft)
    // ============================

    public void deleteBed(Long id) {
        Bed bed = bedRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lit introuvable - ID: " + id));

        if (bed.getStatus() == Bed.BedStatus.OCCUPIED) {
            throw new IllegalStateException("Impossible de supprimer un lit occupe.");
        }

        bed.setActive(false);
        bedRepository.save(bed);
        log.info("Lit '{}' desactive", bed.getBedNumber());
    }
}