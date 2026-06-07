package tn.mediflow.pharmacyservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import tn.mediflow.pharmacyservice.dto.UserDTO;

/**
 * Client OpenFeign pour appeler user-service (Node.js + Express + MongoDB).
 * La résolution se fait via Eureka grâce au nom "user-service".
 */
@FeignClient(name = "user-service")
public interface UserClient {

    @GetMapping("/api/user/{id}")
    UserDTO getUserByPatientCode(@PathVariable("id") Long id);
}