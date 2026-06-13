package tn.mediflow.roomservice.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import tn.mediflow.roomservice.config.RabbitMQConfig;
import tn.mediflow.roomservice.entity.Bed;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class RoomEventProducer {

    private final RabbitTemplate rabbitTemplate;

    public RoomEventProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishRoomAssigned(Bed bed) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("bedId", bed.getId());
        payload.put("bedNumber", bed.getBedNumber());
        payload.put("patientId", bed.getPatientId());
        payload.put("patientName", bed.getPatientName());
        payload.put("roomId", bed.getRoom() != null ? bed.getRoom().getId() : null);
        payload.put("roomNumber", bed.getRoom() != null ? bed.getRoom().getRoomNumber() : "");
        payload.put("department", bed.getRoom() != null ? bed.getRoom().getService() : "");

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.RK_ROOM_ASSIGNED,
                payload
        );

        log.info("📤 [RabbitMQ Room Producer] Admission de lit publiée sur '{}' : Patient #{} / Lit '{}'",
                RabbitMQConfig.RK_ROOM_ASSIGNED, bed.getPatientId(), bed.getBedNumber());
    }
}
