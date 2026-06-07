package tn.mediflow.assuranceservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class AssuranceServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AssuranceServiceApplication.class, args);
    }

}
