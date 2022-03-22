package io.cloudbeaver.service.security.internal.remote;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import io.cloudbeaver.model.user.WebRole;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.security.external.remote.model.role.DCRole;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.role.DCRoleUpdateRequest;
import io.cloudbeaver.service.security.external.remote.model.user.DCUserCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.user.DCUserRolesUpdateRequest;
import okhttp3.*;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.utils.CommonUtils;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

public class DCServerClient {
    private static final String ADMIN_ENDPOINTS = "/security/admin";
    private static final String ADMIN_ROLES_ENDPOINTS = ADMIN_ENDPOINTS + "/roles";
    private static final String ADMIN_USERS_ENDPOINTS = ADMIN_ENDPOINTS + "/security/admin/users";
    private static final MediaType JSON = MediaType.parse("application/json");

    private static final Gson gson = new GsonBuilder()
        .serializeNulls()
        .setPrettyPrinting()
        .create();

    private static final OkHttpClient httpClient = new OkHttpClient().newBuilder()
        .build();

    private final String dcServerUrl;

    public DCServerClient(String dcServerUrl) {
        this.dcServerUrl = dcServerUrl;
    }

    // users
    public WebUser[] findUsers(String userNameMask) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_USERS_ENDPOINTS)
            .newBuilder()
            .addQueryParameter("userNameMask", userNameMask)
            .build();
        var request = new Request.Builder()
            .url(url)
            .get()
            .build();

        return executeRequest(request, WebUser[].class);
    }

    public void createUser(DCUserCreateRequest userCreateRequest) throws DBCException {
        var request = new Request.Builder()
            .url(dcServerUrl + ADMIN_USERS_ENDPOINTS)
            .post(RequestBody.create(JSON, gson.toJson(userCreateRequest)))
            .build();

        executeRequest(request, Void.class);
    }

    public void deleteUser(String userId) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_USERS_ENDPOINTS, userId, "roles");
        var request = new Request.Builder()
            .url(url)
            .delete()
            .build();
        executeRequest(request, Void.class);
    }

    public void updateUserRoles(String userId, DCUserRolesUpdateRequest rolesUpdateRequest) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_USERS_ENDPOINTS, userId, "roles");
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(rolesUpdateRequest)))
            .build();
        executeRequest(request, Void.class);
    }

    public List<DCRole> getUserRoles(String userId) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_USERS_ENDPOINTS, userId, "roles");
        var request = new Request.Builder()
            .url(url)
            .build();
        return executeRequest(request, new TypeToken<ArrayList<DCRole>>() {
        });
    }

    public WebUser getUserById(String userId) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_USERS_ENDPOINTS, userId);
        var request = new Request.Builder()
            .url(url)
            .build();
        return executeRequest(request, WebUser.class);
    }

    public void updateUserMeta(String userId, Map<String, Object> metaParameters) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_USERS_ENDPOINTS, userId);
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(metaParameters)))
            .build();
        executeRequest(request, Void.class);
    }

    // roles
    public WebRole[] findAllRoles() throws DBCException {
        var request = new Request.Builder()
            .url(dcServerUrl + ADMIN_ROLES_ENDPOINTS)
            .get()
            .build();

        return executeRequest(request, new TypeToken<ArrayList<DCRole>>() {
        })
            .stream()
            .map(DCRole::toWebRole)
            .toArray(WebRole[]::new);
    }

    public void createRole(DCRoleCreateRequest roleCreateRequest) throws DBCException {
        var request = new Request.Builder()
            .url(dcServerUrl + ADMIN_ROLES_ENDPOINTS)
            .post(RequestBody.create(JSON, gson.toJson(roleCreateRequest)))
            .build();

        executeRequest(request, Void.class);
    }

    public void updateRole(String roleId, DCRoleUpdateRequest roleUpdateRequest) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_ROLES_ENDPOINTS, roleId);
        var request = new Request.Builder()
            .url(url)
            .put(RequestBody.create(JSON, gson.toJson(roleUpdateRequest)))
            .build();

        executeRequest(request, Void.class);
    }

    public String[] getRoleSubjects(String roleId) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_ROLES_ENDPOINTS, roleId, "subjects");
        var request = new Request.Builder()
            .url(url)
            .get()
            .build();
        return executeRequest(request, String[].class);
    }

    public WebRole findRole(String roleId) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_ROLES_ENDPOINTS, roleId);
        var request = new Request.Builder()
            .url(url)
            .get()
            .build();

        return DCRole.toWebRole(executeRequest(request, DCRole.class));
    }

    public void deleteRole(String roleId) throws DBCException {
        var url = buildUrl(dcServerUrl + ADMIN_ROLES_ENDPOINTS, roleId);
        var request = new Request.Builder()
            .url(url)
            .delete()
            .build();
        executeRequest(request, Void.class);
    }

    private HttpUrl buildUrl(String baseUrl, String... pathSegments) {
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
        } catch (IOException e) {
            throw new DBCException("Error during execute dc request", e);
        }
    }

    private <T> T executeRequest(Request request, TypeToken<T> typeToken) throws DBCException {
        var call = httpClient.newCall(request);
        try {
            Response response = call.execute();
            return gson.fromJson(response.body().string(), typeToken.getType());
        } catch (IOException e) {
            throw new DBCException("Error during execute dc request", e);
        }
    }

    public static void main(String[] args) throws DBCException {
        var client = new DCServerClient("http://localhost:8081");
        client.findAllRoles();
        client.createRole(
            new DCRoleCreateRequest(
                new DCRole(
                    "test2",
                    "test2",
                    "test2",
                    Set.of("user")
                ),
                "cbadmin"));
        client.findAllRoles();
        client.updateRole("test2", new DCRoleUpdateRequest("test3", "test3", Set.of("user")));
        client.deleteRole("test2");
        client.findAllRoles();
    }
}
