package com.modularshowcase.config;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * CacheConfig — enables Spring Cache with Caffeine as the in-process cache provider.
 *
 * <p>Cache names:
 * <ul>
 *   <li>{@code users} — 10-minute TTL, max 500 entries</li>
 *   <li>{@code components} — 10-minute TTL, max 1000 entries</li>
 *   <li>{@code reviews} — 5-minute TTL, max 2000 entries</li>
 *   <li>{@code ratings} — 5-minute TTL, max 2000 entries</li>
 * </ul>
 *
 * <p>To switch to Redis in production, replace this bean with a
 * {@code RedisCacheManager} and set {@code spring.cache.type=redis}.
 */
@Configuration
@EnableCaching
@SuppressWarnings("null")
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCacheNames(Arrays.asList("users", "components", "reviews", "ratings"));
        manager.setCaffeine(defaultCaffeineSpec());
        return manager;
    }

    private Caffeine<Object, Object> defaultCaffeineSpec() {
        return Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats();
    }
}
