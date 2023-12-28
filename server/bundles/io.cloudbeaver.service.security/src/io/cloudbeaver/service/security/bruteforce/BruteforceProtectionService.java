package io.cloudbeaver.service.security.bruteforce;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.jkiss.dbeaver.model.security.exception.SMException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BruteforceProtectionService {
    private static final Map<String, LocalDateTime> consecutiveErrorsMap = new HashMap<>();
    private static final Map<String, BlockedUser> blockEndTimeMap = new HashMap<>();
    private static final int MAX_ERRORS_COUNT = 10;
    private static final int BLOCK_TIME = 5;

    public static void checkBruteforce(String username, List<UserLoginDto> userLoginDtos, String authProviderId) throws SMException {
        if (username == null) {
            return;
        }

        int errorsCount = checkErrorsCount(username, userLoginDtos);

        BlockedUser blockEndTime = blockEndTimeMap.get(username);
        if (blockEndTime != null && blockEndTime.authProviderId().equals(authProviderId) && blockEndTime.time().isAfter(LocalDateTime.now())) {
            throw new SMException("User blocked for 5 minutes");
        }

        if (errorsCount >= MAX_ERRORS_COUNT) {
            blockUser(username, authProviderId);
            throw new SMException("User blocked for 5 minutes");
        } else {
            handleUnblockedUser(username, blockEndTime);
        }
    }

    private static void blockUser(String username, String authProviderId) {
        if (blockEndTimeMap.get(username) == null) {
            blockEndTimeMap.put(username, new BlockedUser(LocalDateTime.now().plusMinutes(BLOCK_TIME), authProviderId));
        }
    }

    private static void handleUnblockedUser(String username, BlockedUser blockEndTime) {
        if (blockEndTime != null && LocalDateTime.now().isAfter(blockEndTime.time().plusMinutes(BLOCK_TIME))) {
            blockEndTimeMap.remove(username);
            int remainingErrorsCount = checkErrorsCount(username);
            if (remainingErrorsCount < MAX_ERRORS_COUNT) {
                consecutiveErrorsMap.put(username, null);
            }
        }
    }

    private static int checkErrorsCount(String username, List<UserLoginDto> userLoginDtos) {
        int errorsCount = 0;

        consecutiveErrorsMap.putIfAbsent(username, LocalDateTime.now());
        LocalDateTime startTime = consecutiveErrorsMap.get(username);

        for (UserLoginDto user : userLoginDtos) {
            int dotIndex = user.time().lastIndexOf('.');
            String dateTimeWithoutMicros = user.time().substring(0, dotIndex);
            LocalDateTime dateTime = LocalDateTime.parse(dateTimeWithoutMicros, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

            if (startTime == null || dateTime.isAfter(startTime)) {
                if (isUserError(user, username)) {
                    errorsCount++;
                }
            }
        }

        if (errorsCount >= MAX_ERRORS_COUNT) {
            consecutiveErrorsMap.put(username, LocalDateTime.now());
        }

        return errorsCount;
    }

    private static boolean isUserError(UserLoginDto user, String username) {
        return username.equals(getUsernameFromJsonInfo(user.jsonInfo())) &&
            user.status() != null && "ERROR".equals(user.status());
    }

    private static int checkErrorsCount(String username) {
        return checkErrorsCount(username, List.of());
    }

    private static String getUsernameFromJsonInfo(String jsonInfo) {
        JsonElement jsonElement = JsonParser.parseString(jsonInfo);
        JsonObject jsonObject = jsonElement.getAsJsonObject();
        JsonElement userElement = jsonObject.get("user") != null ? jsonObject.get("user") : jsonObject.get("access-key");
        return userElement != null ? userElement.getAsString() : null;
    }
}
