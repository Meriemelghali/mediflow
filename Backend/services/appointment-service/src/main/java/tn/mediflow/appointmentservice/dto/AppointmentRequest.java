package tn.mediflow.appointmentservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import tn.mediflow.appointmentservice.entity.AppointmentStatus;

import java.time.LocalDateTime;

@Data
public class AppointmentRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotNull(message = "Appointment date is required")
    private LocalDateTime appointmentDate;

    @NotBlank(message = "Reason is required")
    private String reason;

    private AppointmentStatus status;

    private String notes;
}
