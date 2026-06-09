package com.modularshowcase.specification;

import com.modularshowcase.model.ComponentEntity;
import org.springframework.data.jpa.domain.Specification;

public final class ComponentSpecifications {

    private ComponentSpecifications() {
    }

    public static Specification<ComponentEntity> nameContains(String value) {
        return (root, query, builder) -> {
            if (value == null || value.isBlank()) {
                return builder.conjunction();
            }
            return builder.like(builder.lower(root.get("name")), "%" + value.trim().toLowerCase() + "%");
        };
    }

    public static Specification<ComponentEntity> categoryEquals(Long categoryId) {
        return (root, query, builder) -> categoryId == null
                ? builder.conjunction()
                : builder.equal(root.get("categoryId"), categoryId);
    }

    public static Specification<ComponentEntity> userEquals(Long userId) {
        return (root, query, builder) -> userId == null
                ? builder.conjunction()
                : builder.equal(root.get("userId"), userId);
    }
}
