package tn.mediflow.appointmentservice.dto;

import lombok.Builder;
import lombok.Data;
import tn.mediflow.appointmentservice.entity.AppointmentStatus;

import java.time.LocalDateTime;

@Data
@Builder
public class AppointmentResponse {

    private Long id;
    private Long patientId;
    private Long doctorId;
    private LocalDateTime appointmentDate;
    private String reason;
    private AppointmentStatus status;
    private String notes;
    private LocalDateTime createdAt;
}
