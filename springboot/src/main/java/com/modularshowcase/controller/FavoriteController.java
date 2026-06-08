package com.modularshowcase.controller;

import com.modularshowcase.dto.FavoriteRequest;
import com.modularshowcase.dto.FavoriteResponse;
import com.modularshowcase.service.FavoriteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/spring/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public List<FavoriteResponse> listFavorites() {
        return favoriteService.getAll();
    }

    @GetMapping("/{favoriteId}")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public FavoriteResponse getFavorite(@PathVariable @NonNull Long favoriteId) {
        return favoriteService.getById(favoriteId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public FavoriteResponse createFavorite(@Valid @RequestBody @NonNull FavoriteRequest request) {
        return favoriteService.create(request);
    }

    @DeleteMapping("/{favoriteId}")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public void deleteFavorite(@PathVariable @NonNull Long favoriteId) {
        favoriteService.delete(favoriteId);
    }
}
