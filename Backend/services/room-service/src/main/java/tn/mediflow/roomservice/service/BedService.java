package tn.mediflow.roomservice.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.mediflow.roomservice.entity.Bed;
import tn.mediflow.roomservice.entity.Room;
import tn.mediflow.roomservice.feign.BedAssignmentResponse;
import tn.mediflow.roomservice.feign.DispensingDto;
import tn.mediflow.roomservice.feign.MedicationDto;
import tn.mediflow.roomservice.feign.PharmacyClient;
import tn.mediflow.roomservice.repository.BedRepository;
import tn.mediflow.roomservice.repository.RoomRepository;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BedService {

    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;
    private final PharmacyClient pharmacyClient; // Communication OpenFeign → pharmacy-service

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
    // ASSIGN BED (simple — sans patient connu)
    // ============================

    public Bed assignBed(Long bedId) {
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new EntityNotFoundException("Lit introuvable - ID: " + bedId));

        if (!bed.isAvailable()) {
            throw new IllegalStateException(
                    "Le lit '" + bed.getBedNumber() + "' n'est pas disponible. Statut: " + bed.getStatus());
        }

        bed.setStatus(Bed.BedStatus.RESERVED);
        Bed saved = bedRepository.save(bed);
        log.info("Lit '{}' reserve", saved.getBedNumber());
        return saved;
    }

    // ============================
    // ASSIGN PATIENT → lit (avec Feign pharmacy-service)
    // ============================

    /**
     * Admet un patient dans un lit ET interroge le pharmacy-service
     * via OpenFeign pour récupérer :
     *   - l'historique des médicaments délivrés à ce patient
     *   - les alertes de stock faible en pharmacie
     *
     * Retourne une réponse enrichie BedAssignmentResponse.
     */
    public BedAssignmentResponse assignPatientWithPharmacyCheck(Long bedId, Long patientId, String patientName) {
        // 1. Assigner le patient au lit
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new EntityNotFoundException("Lit introuvable - ID: " + bedId));

        if (!bed.isAvailable()) {
            throw new IllegalStateException(
                    "Le lit '" + bed.getBedNumber() + "' n'est pas disponible. Statut: " + bed.getStatus());
        }

        bed.assignPatient(patientId, patientName);
        Bed savedBed = bedRepository.save(bed);
        log.info("Patient '{}' (ID: {}) assigne au lit '{}'", patientName, patientId, savedBed.getBedNumber());

        // 2. Appel OpenFeign → pharmacy-service
        List<DispensingDto> dispensings = Collections.emptyList();
        List<MedicationDto> lowStock = Collections.emptyList();
        boolean pharmacyAvailable = false;

        try {
            log.info("[Feign] Appel pharmacy-service — historique médicaments patient ID: {}", patientId);
            dispensings = pharmacyClient.getDispensingsByPatient(patientId);

            log.info("[Feign] Appel pharmacy-service — alertes stock faible");
            lowStock = pharmacyClient.getLowStockMedications(10);

            pharmacyAvailable = true;
            log.info("[Feign] pharmacy-service repond : {} dispensing(s), {} alerte(s) stock",
                    dispensings.size(), lowStock.size());

        } catch (Exception ex) {
            log.warn("[Feign] pharmacy-service indisponible. Mode dégradé. Cause: {}", ex.getMessage());
        }

        // 3. Construire la réponse enrichie
        String message = pharmacyAvailable
                ? String.format("Patient admis. %d médicament(s) dans l'historique, %d alerte(s) de stock.",
                    dispensings.size(), lowStock.size())
                : "Patient admis. Historique pharmacie indisponible (mode dégradé).";

        return BedAssignmentResponse.builder()
                .bed(savedBed)
                .patientDispensings(dispensings)
                .lowStockAlerts(lowStock)
                .pharmacyServiceAvailable(pharmacyAvailable)
                .message(message)
                .build();
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
