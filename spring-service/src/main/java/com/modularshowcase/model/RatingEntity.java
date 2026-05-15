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
@Table(name = "ratings")
public class RatingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rating_id")
    private Long ratingId;

    @Column(name = "mongo_rating_id", nullable = false, unique = true)
    private String mongoRatingId;

    @Column(name = "mongo_user_id", nullable = false)
    private String mongoUserId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "component_mongo_id", nullable = false)
    private String componentMongoId;

    @Column(name = "rating", nullable = false)
    private Short rating;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private UserEntity user;

    public Long getRatingId() {
        return ratingId;
    }

    public void setRatingId(Long ratingId) {
        this.ratingId = ratingId;
    }

    public String getMongoRatingId() {
        return mongoRatingId;
    }

    public void setMongoRatingId(String mongoRatingId) {
        this.mongoRatingId = mongoRatingId;
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

    public Short getRating() {
        return rating;
    }

    public void setRating(Short rating) {
        this.rating = rating;
    }

    public UserEntity getUser() {
        return user;
    }
}
