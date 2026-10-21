package com.meetu.backend.upload;

import com.meetu.backend.common.api.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/** 本地图片存储：聊天图片保存到配置目录，通过受登录保护的 GET 路径读取。 */
@RestController
@RequestMapping("/api/uploads")
public class UploadController {
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );
    private static final Set<String> SCOPES = Set.of("chat", "post", "team");
    private static final Pattern FILENAME = Pattern.compile(
            "^[0-9a-fA-F-]{36}\\.(jpg|jpeg|png|webp|gif)$"
    );

    private final Path uploadRoot;

    public UploadController(@Value("${meetu.upload-dir:./uploads}") String uploadDir) throws IOException {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        for (String scope : SCOPES) {
            Files.createDirectories(uploadRoot.resolve(scope));
        }
    }

    @PostMapping(value = "/chat-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UploadDtos.Image> uploadChatImage(@RequestPart("file") MultipartFile file)
            throws IOException {
        return storeImage("chat", file);
    }

    @PostMapping(value = "/post-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UploadDtos.Image> uploadPostImage(@RequestPart("file") MultipartFile file)
            throws IOException {
        return storeImage("post", file);
    }

    @PostMapping(value = "/team-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UploadDtos.Image> uploadTeamImage(@RequestPart("file") MultipartFile file)
            throws IOException {
        return storeImage("team", file);
    }

    private ApiResponse<UploadDtos.Image> storeImage(String scope, MultipartFile file)
            throws IOException {
        if (file == null || file.isEmpty()) {
            throw new InvalidUploadException("Image file is required");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new InvalidUploadException("Image must be smaller than 5MB");
        }

        String contentType = file.getContentType() == null
                ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!IMAGE_TYPES.contains(contentType)) {
            throw new InvalidUploadException("Only JPEG, PNG, WEBP and GIF images are supported");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
        String filename = UUID.randomUUID() + extension;
        Path directory = uploadRoot.resolve(scope).normalize();
        Path target = directory.resolve(filename).normalize();
        if (!directory.startsWith(uploadRoot) || !target.startsWith(directory)) {
            throw new InvalidUploadException("Invalid upload path");
        }
        try (InputStream input = file.getInputStream()) {
            Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
        }

        return ApiResponse.success("Image uploaded", new UploadDtos.Image(
                "/java/uploads/" + scope + "/" + filename,
                file.getOriginalFilename(),
                contentType,
                file.getSize()
        ));
    }

    @GetMapping("/{scope}/{filename:.+}")
    public ResponseEntity<Resource> readImage(@PathVariable String scope,
                                               @PathVariable String filename) {
        if (!SCOPES.contains(scope) || !FILENAME.matcher(filename).matches()) {
            return ResponseEntity.notFound().build();
        }

        Path directory = uploadRoot.resolve(scope).normalize();
        Path file = directory.resolve(filename).normalize();
        if (!directory.startsWith(uploadRoot) || !file.startsWith(directory)
                || !Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(mediaType(filename))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                .body(new FileSystemResource(file));
    }

    private static MediaType mediaType(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        if (lower.endsWith(".gif")) return MediaType.IMAGE_GIF;
        return MediaType.IMAGE_JPEG;
    }
}
