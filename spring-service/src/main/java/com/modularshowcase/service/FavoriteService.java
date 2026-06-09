package com.modularshowcase.service;

import java.util.List;
import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.modularshowcase.dto.FavoriteRequest;
import com.modularshowcase.dto.FavoriteResponse;
import com.modularshowcase.exception.ResourceNotFoundException;
import com.modularshowcase.model.FavoriteEntity;
import com.modularshowcase.repository.FavoriteRepository;

@Service
@SuppressWarnings("null")
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    public FavoriteService(FavoriteRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    public List<FavoriteResponse> getAll() {
        return favoriteRepository.findAll().stream().map(this::toResponse).toList();
    }

    public FavoriteResponse getById(@NonNull Long favoriteId) {
        return toResponse(findEntity(favoriteId));
    }

    public FavoriteResponse create(@NonNull FavoriteRequest request) {
        FavoriteEntity existing = favoriteRepository
                .findByUserIdAndComponentMongoId(request.userId(), request.componentMongoId())
                .orElse(null);
        if (existing != null) {
            return toResponse(existing);
        }

        FavoriteEntity entity = new FavoriteEntity();
        entity.setUserId(request.userId());
        entity.setMongoUserId(request.mongoUserId());
        entity.setComponentMongoId(request.componentMongoId());
        return toResponse(Objects.requireNonNull(favoriteRepository.save(entity), "Saved favorite must not be null"));
    }

    public void delete(@NonNull Long favoriteId) {
        favoriteRepository.delete(findEntity(favoriteId));
    }

    @NonNull
    private FavoriteEntity findEntity(@NonNull Long favoriteId) {
        return favoriteRepository.findById(favoriteId)
                .orElseThrow(() -> new ResourceNotFoundException("Favorite not found with id=" + favoriteId));
    }

    private FavoriteResponse toResponse(@NonNull FavoriteEntity entity) {
        return new FavoriteResponse(
                Objects.requireNonNull(entity.getFavoriteId(), "Favorite id must not be null"),
                Objects.requireNonNull(entity.getUserId(), "User id must not be null"),
                entity.getMongoUserId(),
                entity.getComponentMongoId()
        );
    }
}
