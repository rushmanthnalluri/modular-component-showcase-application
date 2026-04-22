package com.modularshowcase.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

/**
 * OpenApiConfig — JWT Bearer authentication + server/contact/license metadata.
 *
 * <p>Swagger UI: {@code /swagger-ui/index.html} &nbsp;|&nbsp; API docs: {@code /v3/api-docs}
 *
 * <p>Example JWT login flow:
 * <pre>
 * POST /spring/auth/login  { "email": "...", "password": "..." }
 * → { "token": "eyJ..." }
 * → Paste token into Swagger Authorize → Bearer &lt;token&gt;
 * </pre>
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Modular Component Showcase — Spring Service API")
                        .description("""
                                Enterprise-grade Spring Boot 3 microservice. Provides CRUD for users, components,
                                reviews, ratings, and favorites. Secured with JWT Bearer authentication.

                                **Login:** `POST /spring/auth/login` -> copy the returned `token` -> click
                                **Authorize** above and paste as `Bearer <token>`.
                                """)
                        .version("0.1.0")
                        .contact(new Contact()
                                .name("Modular Component Showcase Team")
                                .url("https://github.com/rushmanthnalluri/modular-component-showcase-application"))
                        .license(new License().name("MIT").url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("/").description("Current host"),
                        new Server().url("http://localhost:8081").description("Local dev")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("""
                                                JWT token from POST /spring/auth/login.
                                                Format: Bearer <token>
                                                """)));
    }
}
