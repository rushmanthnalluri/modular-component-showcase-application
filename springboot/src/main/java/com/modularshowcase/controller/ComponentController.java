package com.modularshowcase.controller;

import com.modularshowcase.dto.ComponentRequest;
import com.modularshowcase.dto.ComponentResponse;
import com.modularshowcase.dto.ComponentSearchResponse;
import com.modularshowcase.service.ComponentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/spring/components")
public class ComponentController {

    private final ComponentService componentService;

    public ComponentController(ComponentService componentService) {
        this.componentService = componentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public List<ComponentResponse> listComponents() {
        return componentService.getAll();
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public ComponentSearchResponse searchComponents(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "componentId") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        return componentService.search(name, categoryId, userId, page, size, sortBy, direction);
    }

    @GetMapping("/{componentId}")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public ComponentResponse getComponent(@PathVariable @NonNull Long componentId) {
        return componentService.getById(componentId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DEVELOPER','ADMIN')")
    public ComponentResponse createComponent(@Valid @RequestBody @NonNull ComponentRequest request) {
        return componentService.create(request);
    }

    @PutMapping("/{componentId}")
    @PreAuthorize("hasAnyRole('DEVELOPER','ADMIN')")
    public ComponentResponse updateComponent(@PathVariable @NonNull Long componentId,
            @Valid @RequestBody @NonNull ComponentRequest request) {
        return componentService.update(componentId, request);
    }

    @DeleteMapping("/{componentId}")
    @PreAuthorize("hasAnyRole('DEVELOPER','ADMIN')")
    public void deleteComponent(@PathVariable @NonNull Long componentId) {
        componentService.delete(componentId);
    }
}
