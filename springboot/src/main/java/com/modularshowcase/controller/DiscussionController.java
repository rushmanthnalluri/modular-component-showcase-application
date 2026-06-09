package com.modularshowcase.controller;

import com.modularshowcase.dto.DiscussionRequest;
import com.modularshowcase.dto.DiscussionResponse;
import com.modularshowcase.service.DiscussionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/spring/discussions")
public class DiscussionController {

    private final DiscussionService discussionService;

    public DiscussionController(DiscussionService discussionService) {
        this.discussionService = discussionService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public List<DiscussionResponse> listDiscussions(@RequestParam(required = false) String componentMongoId) {
        return discussionService.getAll(componentMongoId);
    }

    @GetMapping("/{discussionId}")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public DiscussionResponse getDiscussion(@PathVariable @NonNull Long discussionId) {
        return discussionService.getById(discussionId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public DiscussionResponse createDiscussion(@Valid @RequestBody @NonNull DiscussionRequest request) {
        return discussionService.create(request);
    }

    @PutMapping("/{discussionId}")
    @PreAuthorize("hasAnyRole('USER','DEVELOPER','ADMIN')")
    public DiscussionResponse updateDiscussion(@PathVariable @NonNull Long discussionId,
            @Valid @RequestBody @NonNull DiscussionRequest request) {
        return discussionService.update(discussionId, request);
    }

    @DeleteMapping("/{discussionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteDiscussion(@PathVariable @NonNull Long discussionId) {
        discussionService.delete(discussionId);
    }
}
