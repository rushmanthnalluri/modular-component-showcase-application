package com.modularshowcase.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
@Entity
@Table(name = "user_favorites")
public class FavoriteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "favorite_id")
    private Long favoriteId;

    @Column(name = "mongo_user_id", nullable = false)
    private String mongoUserId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "component_mongo_id", nullable = false)
    private String componentMongoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private UserEntity user;

    public Long getFavoriteId() {
        return favoriteId;
    }

    public void setFavoriteId(Long favoriteId) {
        this.favoriteId = favoriteId;
    }

    public String getMongoUserId() {
        return mongoUserId;
    }

    public void setMongoUserId(String mongoUserId) {
        this.mongoUserId = mongoUserId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getComponentMongoId() {
        return componentMongoId;
    }

    public void setComponentMongoId(String componentMongoId) {
        this.componentMongoId = componentMongoId;
    }

    public UserEntity getUser() {
        return user;
    }
}
