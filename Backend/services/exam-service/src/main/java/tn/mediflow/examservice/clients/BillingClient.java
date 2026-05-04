package tn.mediflow.examservice.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import tn.mediflow.examservice.dto.BillDTO;

@FeignClient(name = "billing-service")
public interface BillingClient {
    @PostMapping("/api/factures")
    void createBill(@RequestBody BillDTO billDTO);
}
