package io.cloudbeaver.service.security.internal.remote;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.security.external.remote.model.*;
import io.cloudbeaver.service.security.external.remote.model.role.DCRole;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleUpdateRequest;
import io.cloudbeaver.service.security.external.remote.model.session.DCSessionCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.session.DCSessionUpdateRequest;
import io.cloudbeaver.service.security.external.remote.model.subjects.DCDataSourceSubjectAccessUpdateRequest;
import io.cloudbeaver.service.security.external.remote.model.subjects.DCSubjectUpdateDataSourceAccessRequest;
import io.cloudbeaver.service.security.external.remote.model.subjects.DCSubjectUpdatePermissionsRequest;
import io.cloudbeaver.service.security.external.remote.model.user.*;
import okhttp3.*;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.security.SMDataSourceGrant;

import java.util.*;

public class DCServerClient implements DCAdminUserService, DCUsersService, DCAdminRolesService, DCSessionsService, DCAdminSubjectsService, DCSubjectsService {
    private static final String ADMIN_ENDPOINTS = "/admin";

    private static final String ADMIN_ROLES_ENDPOINTS = ADMIN_ENDPOINTS + "/roles";

    private static final String SESSIONS_ENDPOINTS = "/sessions";

    private static final String USERS_ENDPOINTS = "/users";
    private static final String ADMIN_USERS_ENDPOINTS = ADMIN_ENDPOINTS + USERS_ENDPOINTS;

    private static final String SUBJECTS_ENDPOINTS = "/subjects";
    private static final String ADMIN_SUBJECTS_ENDPOINTS = ADMIN_ENDPOINTS + SUBJECTS_ENDPOINTS;


    private static final MediaType JSON = MediaType.parse("application/json");

    private static final Gson gson = new GsonBuilder()
        .serializeNulls()
        .setPrettyPrinting()
        .create();

    private static final OkHttpClient httpClient = new OkHttpClient().newBuilder()
        .build();

    private final String dcApiUrl;

    public DCServerClient(String dcApiUrl) {
        this.dcApiUrl = dcApiUrl;
    }

    @Override
    public WebUser[] findUsers(String userNameMask) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS)
            .newBuilder()
            .addQueryParameter("userNameMask", userNameMask)
            .build();
        var request = new Request.Builder()
            .url(url)
            .get()
            .build();

        return executeRequest(request, WebUser[].class);
    }

    @Override
    public void createUser(DCUserCreateRequest userCreateRequest) throws DBCException {
        var request = new Request.Builder()
            .url(dcApiUrl + ADMIN_USERS_ENDPOINTS)
            .post(RequestBody.create(JSON, gson.toJson(userCreateRequest)))
            .build();

        executeRequest(request, Void.class);
    }

    @Override
    public void deleteUser(String userId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId, "roles");
        var request = new Request.Builder()
            .url(url)
            .delete()
            .build();
        executeRequest(request, Void.class);
    }

    @Override
    public void updateUserRoles(String userId, DCUserRolesUpdateRequest rolesUpdateRequest) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId, "roles");
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(rolesUpdateRequest)))
            .build();
        executeRequest(request, Void.class);
    }

    @Override
    public List<DCRole> getUserRoles(String userId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId, "roles");
        var request = new Request.Builder()
            .url(url)
            .build();
        return executeRequest(request, new TypeToken<ArrayList<DCRole>>() {
        });
    }

    @Override
    public WebUser getUserById(String userId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId);
        var request = new Request.Builder()
            .url(url)
            .build();
        return executeRequest(request, WebUser.class);
    }

    @Override
    public Map<String, Object> getUserParameters(String userId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId, "parameters");
        var request = new Request.Builder()
            .url(url)
            .build();
        return executeRequest(request, new TypeToken<HashMap<String, Object>>() {
        });
    }

    @Override
    public void setUserParameter(String userId, DCUserUpdateParameterRequest userUpdateParameterRequest) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId);
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(userUpdateParameterRequest)))
            .build();
        executeRequest(request, Void.class);
    }

    @Override
    public void setUserCredentials(String userId, DCUserUpdateCredentialsRequest updateCredentialsRequest) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId, "credentials");
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(updateCredentialsRequest)))
            .build();
        executeRequest(request, Void.class);
    }

    @Nullable
    @Override
    public String getUserByCredentials(DCUserByCredentialsSearchRequest searchRequest) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, "credentials", "search");
        var request = new Request.Builder()
            .url(url)
            .post(RequestBody.create(JSON, gson.toJson(searchRequest)))
            .build();
        return executeRequest(request, String.class);
    }

    @Override
    public Map<String, Object> getUserCredentials(String userId, String authProviderId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId, "credentials")
            .newBuilder()
            .addQueryParameter("authProviderId", authProviderId)
            .build();

        var request = new Request.Builder()
            .url(url)
            .get()
            .build();
        return executeRequest(request, new TypeToken<HashMap<String, Object>>() {
        });
    }

    @Override
    public String[] getUserLinkedProviders(String userId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId, "providers");
        var request = new Request.Builder()
            .url(url)
            .get()
            .build();
        return executeRequest(request, String[].class);
    }

    @NotNull
    @Override
    public Set<String> getUserPermissions(String userId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId, "permissions");
        var request = new Request.Builder()
            .url(url)
            .get()
            .build();
        return executeRequest(request, new TypeToken<HashSet<String>>() {
        });
    }

    @Override
    public void updateUserMeta(String userId, Map<String, Object> metaParameters) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_USERS_ENDPOINTS, userId, "meta");
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(metaParameters)))
            .build();
        executeRequest(request, Void.class);
    }

    // roles
    @Override
    public List<DCRole> getAllRoles() throws DBCException {
        var request = new Request.Builder()
            .url(dcApiUrl + ADMIN_ROLES_ENDPOINTS)
            .get()
            .build();

        return executeRequest(request, new TypeToken<ArrayList<DCRole>>() {
        });
    }

    @Override
    public void createRole(DCRoleCreateRequest roleCreateRequest) throws DBCException {
        var request = new Request.Builder()
            .url(dcApiUrl + ADMIN_ROLES_ENDPOINTS)
            .post(RequestBody.create(JSON, gson.toJson(roleCreateRequest)))
            .build();

        executeRequest(request, Void.class);
    }

    @Override
    public void updateRole(String roleId, DCRoleUpdateRequest roleUpdateRequest) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_ROLES_ENDPOINTS, roleId);
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(roleUpdateRequest)))
            .build();

        executeRequest(request, Void.class);
    }

    @Override
    public String[] getRoleSubjects(String roleId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_ROLES_ENDPOINTS, roleId, "subjects");
        var request = new Request.Builder()
            .url(url)
            .get()
            .build();
        return executeRequest(request, String[].class);
    }

    @Override
    public DCRole findRole(String roleId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_ROLES_ENDPOINTS, roleId);
        var request = new Request.Builder()
            .url(url)
            .get()
            .build();
        return executeRequest(request, DCRole.class);
    }

    @Override
    public void deleteRole(String roleId) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_ROLES_ENDPOINTS, roleId);
        var request = new Request.Builder()
            .url(url)
            .delete()
            .build();
        executeRequest(request, Void.class);
    }

    @Override
    public void createSession(DCSessionCreateRequest sessionCreateRequest) throws DBCException {
        var request = new Request.Builder()
            .url(dcApiUrl + SESSIONS_ENDPOINTS)
            .post(RequestBody.create(JSON, gson.toJson(sessionCreateRequest)))
            .build();
        executeRequest(request, Void.class);
    }

    @Override
    public void updateSession(String sessionId, DCSessionUpdateRequest sessionUpdateRequest) throws DBCException {
        var url = buildUrl(dcApiUrl + SESSIONS_ENDPOINTS, sessionId);
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(sessionUpdateRequest)))
            .build();
        executeRequest(request, Void.class);
    }

    @Override
    public boolean isSessionPersisted(String sessionId) throws DBCException {
        var url = buildUrl(dcApiUrl + SESSIONS_ENDPOINTS, sessionId);
        var request = new Request.Builder()
            .url(url)
            .get()
            .build();
        return executeRequest(request, Boolean.class);
    }

    @Override
    public void setSubjectPermissions(String subjectId, DCSubjectUpdatePermissionsRequest subjectUpdatePermissionsRequest) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_SUBJECTS_ENDPOINTS, subjectId, "permissions");
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(subjectUpdatePermissionsRequest)))
            .build();
        executeRequest(request, Void.class);
    }

    @Override
    public void setSubjectDataSourceAccess(@NotNull String subjectId, DCSubjectUpdateDataSourceAccessRequest subjectUpdateDataSourceAccessRequest) throws DBCException {
        var url = buildUrl(dcApiUrl + ADMIN_SUBJECTS_ENDPOINTS, subjectId, "dataSources");
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(subjectUpdateDataSourceAccessRequest)))
            .build();
        executeRequest(request, Void.class);
    }

    @NotNull
    @Override
    public Set<String> getSubjectPermissions(String subjectId) throws DBCException {
        var url = buildUrl(dcApiUrl + SUBJECTS_ENDPOINTS, subjectId);
        var request = new Request.Builder()
            .url(url)
            .build();
        return executeRequest(request, new TypeToken<HashSet<String>>() {
        });
    }

    @NotNull
    @Override
    public SMDataSourceGrant[] getSubjectDataSourceAccess(@NotNull String[] subjectIds) throws DBCException {
        var urlBuilder = buildUrl(dcApiUrl + SUBJECTS_ENDPOINTS, "dataSources")
            .newBuilder();
        for (var subjectId : subjectIds) {
            urlBuilder.addQueryParameter("subjectId", subjectId);
        }
        var request = new Request.Builder()
            .url(urlBuilder.build())
            .build();
        return executeRequest(request, SMDataSourceGrant[].class);
    }

    @NotNull
    @Override
    public SMDataSourceGrant[] getDataSourceSubjectAccess(String dataSourceId) throws DBCException {
        var url = buildUrl(dcApiUrl + SUBJECTS_ENDPOINTS, "dataSources", dataSourceId);
        var request = new Request.Builder()
            .url(url)
            .build();
        return executeRequest(request, SMDataSourceGrant[].class);
    }

    @Override
    public void setDataSourceSubjectAccess(@NotNull String dataSourceId, DCDataSourceSubjectAccessUpdateRequest dcDataSourceSubjectAccessUpdateRequest) throws DBCException {
        var url = buildUrl(dcApiUrl + SUBJECTS_ENDPOINTS, "dataSources", dataSourceId);
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(dcDataSourceSubjectAccessUpdateRequest)))
            .build();
        executeRequest(request, Void.class);
    }

    private static HttpUrl buildUrl(String baseUrl, String... pathSegments) {
        var urlBuilder = HttpUrl.parse(baseUrl)
            .newBuilder();
        for (var pathSegment : pathSegments) {
            urlBuilder.addPathSegment(pathSegment);
        }
        return urlBuilder.build();
    }

    private <T> T executeRequest(Request request, Class<T> type) throws DBCException {
        var call = httpClient.newCall(request);
        try {
            Response response = call.execute();
            return gson.fromJson(response.body().string(), type);
        } catch (Exception e) {
            throw new DBCException("Error during execute dc request", e);
        }
    }

    private <T> T executeRequest(Request request, TypeToken<T> typeToken) throws DBCException {
        var call = httpClient.newCall(request);
        try {
            Response response = call.execute();
            return gson.fromJson(response.body().string(), typeToken.getType());
        } catch (Exception e) {
            throw new DBCException("Error during execute dc request", e);
        }
    }

    public static void main(String[] args) throws DBCException {
        var map = Map.of(
            "test", "test",
            "test1", 1
        );
        var client = new DCServerClient("http://localhost:8081");
        client.getAllRoles();
        client.createRole(
            new DCRoleCreateRequest(
                new DCRole(
                    "test2",
                    "test2",
                    "test2",
                    Set.of("user")
                ),
                "cbadmin"));
        client.getAllRoles();
        client.updateRole("test2", new DCRoleUpdateRequest("test3", "test3", Set.of("user")));
        client.deleteRole("test2");
        client.getAllRoles();
    }
}
