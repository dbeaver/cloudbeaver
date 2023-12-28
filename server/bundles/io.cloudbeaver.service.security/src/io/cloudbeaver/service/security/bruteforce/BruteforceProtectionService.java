package io.cloudbeaver.service.security.bruteforce;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.internal.LinkedTreeMap;
import io.cloudbeaver.auth.BruteforceProtection;
import io.cloudbeaver.registry.WebAuthProviderDescriptor;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.AuthPropertyDescriptor;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.security.exception.SMException;
import org.jkiss.utils.CommonUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BruteforceProtectionService {
    private static final Gson gson = new Gson();
    private static final Map<String, LocalDateTime> consecutiveErrorsMap = new HashMap<>();
    private static final Map<String, BlockedUser> blockEndTimeMap = new HashMap<>();
    private static final Map<String, LocalDateTime> loginAttemptTimes = new HashMap<>();
    private static final int MAX_ERRORS_COUNT = 10;
    private static final int BLOCK_TIME = 5;
    public static final String ERROR = "ERROR";

    public static void checkBruteforce(WebAuthProviderDescriptor webAuthProviderDescriptor,
                                       Map<String, Object> data, List<UserLoginRecord> userLoginRecords,
                                       String authProviderId) throws DBException
    {
        String username;
        if (webAuthProviderDescriptor.getInstance() instanceof BruteforceProtection) {
           username = getUserParamName(webAuthProviderDescriptor, data);
        } else {
            return;
        }
        checkLoginInterval(username);

        int errorsCount = checkErrorsCount(username, userLoginRecords);

        BlockedUser blockEndTime = blockEndTimeMap.get(username + authProviderId);
        if (blockEndTime != null
            && blockEndTime.authProviderId().equals(authProviderId)
            && blockEndTime.time().isAfter(LocalDateTime.now())
        ) {
            throw new SMException("User blocked for 5 minutes");
        }

        if (errorsCount >= MAX_ERRORS_COUNT) {
            blockUser(username, authProviderId);
            throw new SMException("User blocked for 5 minutes");
        } else {
            handleUnblockedUser(username + authProviderId, blockEndTime);
        }
    }

    private static void blockUser(String username, String authProviderId) {
        if (blockEndTimeMap.get(username) == null) {
            blockEndTimeMap.put(username + authProviderId, new BlockedUser(LocalDateTime.now().plusMinutes(BLOCK_TIME), authProviderId));
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

    private static int checkErrorsCount(String username, List<UserLoginRecord> userLoginRecords) {
        int errorsCount = 0;

        consecutiveErrorsMap.putIfAbsent(username, LocalDateTime.now());
        LocalDateTime startTime = consecutiveErrorsMap.get(username);

        for (UserLoginRecord user : userLoginRecords) {
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

    private static int checkErrorsCount(String username) {
        return checkErrorsCount(username, List.of());
    }

    private static boolean isUserError(UserLoginRecord user, String username) {
        return username.equals(getUsernameFromJsonInfo(user.jsonInfo())) &&
            user.status() != null && ERROR.equals(user.status());
    }

    private static String getUsernameFromJsonInfo(String jsonInfo) {
        JsonUser jsonUser = gson.fromJson(jsonInfo, JsonUser.class);
        return jsonUser.user() != null ? jsonUser.user() : null;
    }

    private static String getUserParamName(WebAuthProviderDescriptor authProvider, Map<String, Object> authParameters) throws DBCException {
        String[] propNames = authParameters.keySet().toArray(new String[0]);
        for (AuthPropertyDescriptor prop : authProvider.getCredentialParameters(propNames)) {
            if (prop.isUser()) {
                String propId = CommonUtils.toString(prop.getId());
                Object paramValue = authParameters.get(propId);
                return paramValue.toString();
            }
        }
        throw new DBCException("User not found");
    }

    private static void checkLoginInterval(String username) throws DBException {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastLoginTime = loginAttemptTimes.get(username);

        if (lastLoginTime != null && Duration.between(lastLoginTime, now).getSeconds() < 1) {
            throw new DBException("You are trying to log in too fast");
        }

        loginAttemptTimes.put(username, now);
    }
}
