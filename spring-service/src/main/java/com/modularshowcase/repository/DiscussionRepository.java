package com.modularshowcase.repository;

import com.modularshowcase.model.DiscussionEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionRepository extends JpaRepository<DiscussionEntity, Long> {
    List<DiscussionEntity> findByComponentMongoIdOrderByDiscussionIdDesc(String componentMongoId);

    Optional<DiscussionEntity> findByMongoDiscussionId(String mongoDiscussionId);
}
