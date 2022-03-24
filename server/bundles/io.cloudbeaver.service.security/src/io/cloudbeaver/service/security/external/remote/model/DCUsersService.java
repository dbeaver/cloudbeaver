package io.cloudbeaver.service.security.external.remote.model;

import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.security.external.remote.model.role.DCRole;
import io.cloudbeaver.service.security.external.remote.model.user.DCUserByCredentialsSearchRequest;
import io.cloudbeaver.service.security.external.remote.model.user.DCUserUpdateCredentialsRequest;
import io.cloudbeaver.service.security.external.remote.model.user.DCUserUpdateParameterRequest;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.exec.DBCException;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface DCUsersService {
    List<DCRole> getUserRoles(String userId) throws DBException;

    WebUser getUserById(String userId) throws DBException;

    Map<String, Object> getUserParameters(String userId) throws DBException;

    void setUserParameter(String userId, DCUserUpdateParameterRequest request) throws DBException;

    void setUserCredentials(String userId, DCUserUpdateCredentialsRequest request) throws DBException;

    String[] getUserLinkedProviders(String userId) throws DBException;

    @NotNull
    Set<String> getUserPermissions(String userId) throws DBException;

    @Nullable
    String getUserByCredentials(DCUserByCredentialsSearchRequest request) throws DBException;

    Map<String, Object> getUserCredentials(String userId, String authProviderId) throws DBException;
}
