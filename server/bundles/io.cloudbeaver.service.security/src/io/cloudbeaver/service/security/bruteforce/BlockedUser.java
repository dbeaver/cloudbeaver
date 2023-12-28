package io.cloudbeaver.service.security.bruteforce;

import java.time.LocalDateTime;

public record BlockedUser(LocalDateTime time, String authProviderId) {
}
