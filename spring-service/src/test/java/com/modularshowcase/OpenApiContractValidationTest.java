package com.modularshowcase;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.yaml.snakeyaml.Yaml;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class OpenApiContractValidationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void runtimeOpenApiContainsContractPathsAndBearerSecurity() throws IOException {
        ResponseEntity<String> response = restTemplate.getForEntity(url("/v3/api-docs"), String.class);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotBlank();

        Map<String, Object> runtimeDocument = objectMapper.readValue(response.getBody(), new TypeReference<>() {
        });
        Map<String, Object> contractDocument = loadContract();

        Set<String> runtimePaths = mapOf(runtimeDocument, "paths").keySet();
        Set<String> contractPaths = mapOf(contractDocument, "paths").keySet();
        Set<String> normalizedRuntimePaths = runtimePaths.stream()
                .map(this::stripSpringPrefix)
                .collect(Collectors.toSet());

        assertThat(normalizedRuntimePaths).containsAll(contractPaths);
        assertThat(mapOf(mapOf(runtimeDocument, "components"), "securitySchemes")).containsKey("bearerAuth");
        assertThat(runtimePaths).contains("/spring/auth/token", "/spring/components", "/spring/components/search", "/spring/health");
    }

    private Map<String, Object> loadContract() throws IOException {
        try (var inputStream = Files.newInputStream(Path.of("..", "contracts", "openapi-spring.yaml"))) {
            return new Yaml().load(inputStream);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapOf(Map<String, Object> source, String key) {
        return (Map<String, Object>) source.getOrDefault(key, Map.of());
    }

    private String stripSpringPrefix(String path) {
        return path.startsWith("/spring/") ? path.substring("/spring".length()) : path;
    }

    private String url(String path) {
        return "http://127.0.0.1:" + port + path;
    }
}
