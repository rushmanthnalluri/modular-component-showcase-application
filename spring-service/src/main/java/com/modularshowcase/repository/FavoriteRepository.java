package com.modularshowcase.repository;

import com.modularshowcase.model.FavoriteEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<FavoriteEntity, Long> {
    Optional<FavoriteEntity> findByUserIdAndComponentMongoId(Long userId, String componentMongoId);
}
