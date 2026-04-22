package com.modularshowcase.repository;

import com.modularshowcase.model.ComponentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ComponentRepository extends JpaRepository<ComponentEntity, Long>, JpaSpecificationExecutor<ComponentEntity> {
}
