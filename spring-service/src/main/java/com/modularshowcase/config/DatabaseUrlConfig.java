package com.modularshowcase.config;

import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.net.URISyntaxException;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class DatabaseUrlConfig {

    @Bean
    public DataSource dataSource(
            @Value("${DATABASE_URL:}") String databaseUrl,
            @Value("${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/modular_component_showcase_application}") String fallbackUrl,
            @Value("${SPRING_DATASOURCE_USERNAME:postgres}") String fallbackUser,
            @Value("${SPRING_DATASOURCE_PASSWORD:postgres}") String fallbackPassword
    ) {
        HikariDataSource dataSource = new HikariDataSource();
        if (databaseUrl != null && !databaseUrl.isBlank()) {
            applyDatabaseUrl(databaseUrl, dataSource);
            return dataSource;
        }

        dataSource.setJdbcUrl(fallbackUrl);
        dataSource.setUsername(fallbackUser);
        dataSource.setPassword(fallbackPassword);
        return dataSource;
    }

    private void applyDatabaseUrl(String databaseUrl, HikariDataSource dataSource) {
        try {
            URI uri = new URI(databaseUrl);
            String[] userInfo = uri.getUserInfo() == null ? new String[] {"postgres", "postgres"} : uri.getUserInfo().split(":", 2);
            String username = userInfo[0];
            String password = userInfo.length > 1 ? userInfo[1] : "";
            String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + uri.getPort() + uri.getPath();
            if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
                jdbcUrl += "?" + uri.getQuery();
            }
            dataSource.setJdbcUrl(jdbcUrl);
            dataSource.setUsername(username);
            dataSource.setPassword(password);
        } catch (URISyntaxException ex) {
            throw new IllegalArgumentException("Invalid DATABASE_URL format", ex);
        }
    }
}
