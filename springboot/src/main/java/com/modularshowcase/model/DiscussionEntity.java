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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "discussions",
        uniqueConstraints = @UniqueConstraint(name = "discussions_mongo_discussion_id_key", columnNames = "mongo_discussion_id")
)
public class DiscussionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "discussion_id")
    private Long discussionId;

    @Column(name = "mongo_discussion_id", nullable = false, unique = true)
    private String mongoDiscussionId;

    @Column(name = "mongo_user_id", nullable = false)
    private String mongoUserId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "component_mongo_id", nullable = false)
    private String componentMongoId;

    @Column(name = "parent_mongo_id")
    private String parentMongoId;

    @Column(name = "message", nullable = false)
    private String message;

    @Column(name = "likes", nullable = false)
    private Integer likes = 0;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "active";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private UserEntity user;

    public Long getDiscussionId() {
        return discussionId;
    }

    public void setDiscussionId(Long discussionId) {
        this.discussionId = discussionId;
    }

    public String getMongoDiscussionId() {
        return mongoDiscussionId;
    }

    public void setMongoDiscussionId(String mongoDiscussionId) {
        this.mongoDiscussionId = mongoDiscussionId;
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

    public String getParentMongoId() {
        return parentMongoId;
    }

    public void setParentMongoId(String parentMongoId) {
        this.parentMongoId = parentMongoId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getLikes() {
        return likes;
    }

    public void setLikes(Integer likes) {
        this.likes = likes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UserEntity getUser() {
        return user;
    }
}
