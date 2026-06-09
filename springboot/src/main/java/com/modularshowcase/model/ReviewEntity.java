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
@Table(name = "reviews")
public class ReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @Column(name = "mongo_review_id", nullable = false, unique = true)
    private String mongoReviewId;

    @Column(name = "mongo_user_id", nullable = false)
    private String mongoUserId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "component_mongo_id", nullable = false)
    private String componentMongoId;

    @Column(name = "rating", nullable = false)
    private Short rating;

    @Column(name = "title", nullable = false)
    private String title = "";

    @Column(name = "comment", nullable = false)
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private UserEntity user;

    public Long getReviewId() {
        return reviewId;
    }

    public void setReviewId(Long reviewId) {
        this.reviewId = reviewId;
    }

    public String getMongoReviewId() {
        return mongoReviewId;
    }

    public void setMongoReviewId(String mongoReviewId) {
        this.mongoReviewId = mongoReviewId;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public UserEntity getUser() {
        return user;
    }
}
