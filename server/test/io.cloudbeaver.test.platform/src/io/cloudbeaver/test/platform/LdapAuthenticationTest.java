/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.test.platform;

import io.cloudbeaver.service.auth.ldap.LdapAuthProvider;
import io.cloudbeaver.service.auth.ldap.LdapConstants;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.directory.BasicAttributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;

public class LdapAuthenticationTest {
    private static final String USER_LOGIN = "test-user";
    private static final String USER_DN = "cn=test-user,dc=example,dc=com";
    private static final String USER_PASSWORD = UUID.randomUUID().toString();
    private static final String BIND_USER_DN = "cn=bind-user,dc=example,dc=com";
    private static final String BIND_USER_PASSWORD = UUID.randomUUID().toString();
    private static final String FILTER = "(memberOf=cn=cloudbeaver-users,dc=example,dc=com)";

    @Test
    public void fullDnLoginWithEmptyFilterDoesNotRequireBindUser() throws Exception {
        DirContext userContext = Mockito.mock(DirContext.class);
        NamingEnumeration<SearchResult> userSearchResult = mockUserSearchResult();
        Mockito.when(userContext.search(
            Mockito.eq(USER_DN),
            Mockito.eq("objectClass=*"),
            Mockito.any(SearchControls.class)
        )).thenReturn(userSearchResult);

        Map<String, Object> userData = authenticate(new TestLdapAuthProvider(userContext), "");

        Assertions.assertEquals(USER_DN, userData.get(LdapConstants.CRED_USER_DN));
        Assertions.assertEquals("test-user-id", userData.get(LdapConstants.CRED_USERNAME));
        Mockito.verify(userContext, Mockito.never()).search(
            Mockito.eq(USER_DN),
            Mockito.eq(FILTER),
            Mockito.any(SearchControls.class)
        );
    }

    @Test
    public void fullDnLoginAppliesFilterWithUserContextWhenBindUserIsMissing() throws Exception {
        DirContext userContext = Mockito.mock(DirContext.class);
        NamingEnumeration<SearchResult> filterSearchResult = mockFilterSearchResult(false);
        Mockito.when(userContext.search(
            Mockito.eq(USER_DN),
            Mockito.eq(FILTER),
            Mockito.any(SearchControls.class)
        )).thenReturn(filterSearchResult);

        DBException exception = Assertions.assertThrows(
            DBException.class,
            () -> authenticate(new TestLdapAuthProvider(userContext), FILTER)
        );

        Assertions.assertEquals("LDAP authentication failed: Access denied", exception.getMessage());
        Mockito.verify(filterSearchResult).close();
    }

    @Test
    public void fullDnLoginChecksFilterBeforeUserBindWhenBindUserIsConfigured() throws Exception {
        DirContext bindUserContext = Mockito.mock(DirContext.class);
        NamingEnumeration<SearchResult> filterSearchResult = mockFilterSearchResult(false);
        Mockito.when(bindUserContext.search(
            Mockito.eq(USER_DN),
            Mockito.eq(FILTER),
            Mockito.any(SearchControls.class)
        )).thenReturn(filterSearchResult);
        BindUserLdapAuthProvider provider = new BindUserLdapAuthProvider(bindUserContext);

        DBException exception = Assertions.assertThrows(
            DBException.class,
            () -> authenticate(
                provider,
                FILTER,
                Map.of(
                    LdapConstants.PARAM_BIND_USER, BIND_USER_DN,
                    LdapConstants.PARAM_BIND_USER_PASSWORD, BIND_USER_PASSWORD
                )
            )
        );

        Assertions.assertEquals("Access denied", exception.getMessage());
        Assertions.assertEquals(1, provider.getConnectionCount());
        Mockito.verify(filterSearchResult).close();
        Mockito.verify(bindUserContext).close();
    }

    @Test
    public void usernameLoginClosesServiceResources() throws Exception {
        DirContext serviceContext = Mockito.mock(DirContext.class);
        NamingEnumeration<SearchResult> userLookupResults = mockFilterSearchResult(true);
        SearchResult foundUser = Mockito.mock(SearchResult.class);
        Mockito.when(foundUser.getNameInNamespace()).thenReturn(USER_DN);
        Mockito.when(userLookupResults.next()).thenReturn(foundUser);
        Mockito.when(serviceContext.search(
            Mockito.eq("dc=example,dc=com"),
            Mockito.anyString(),
            Mockito.any(Object[].class),
            Mockito.any(SearchControls.class)
        )).thenReturn(userLookupResults);

        DirContext userContext = Mockito.mock(DirContext.class);
        NamingEnumeration<SearchResult> userSearchResult = mockUserSearchResult();
        Mockito.when(userContext.search(
            Mockito.eq(USER_DN),
            Mockito.eq("objectClass=*"),
            Mockito.any(SearchControls.class)
        )).thenReturn(userSearchResult);

        LdapAuthProvider provider = Mockito.spy(new LdapAuthProvider());
        Mockito.doReturn(serviceContext, userContext).when(provider).initConnection(Mockito.anyMap());

        Map<String, Object> userData = authenticate(
            provider,
            FILTER,
            USER_LOGIN,
            Map.of(
                LdapConstants.PARAM_LOGIN, "uid",
                LdapConstants.PARAM_BIND_USER, BIND_USER_DN,
                LdapConstants.PARAM_BIND_USER_PASSWORD, BIND_USER_PASSWORD
            )
        );

        Assertions.assertEquals(USER_LOGIN, userData.get(LdapConstants.CRED_USERNAME));
        Mockito.verify(userLookupResults).close();
        Mockito.verify(serviceContext).close();
        Mockito.verify(userContext).close();
    }

    @Test
    public void fullDnLoginSucceedsWhenUserMatchesFilterWithoutBindUser() throws Exception {
        DirContext userContext = Mockito.mock(DirContext.class);
        NamingEnumeration<SearchResult> filterSearchResult = mockFilterSearchResult(true);
        NamingEnumeration<SearchResult> userSearchResult = mockUserSearchResult();
        Mockito.when(userContext.search(
            Mockito.eq(USER_DN),
            Mockito.eq(FILTER),
            Mockito.any(SearchControls.class)
        )).thenReturn(filterSearchResult);
        Mockito.when(userContext.search(
            Mockito.eq(USER_DN),
            Mockito.eq("objectClass=*"),
            Mockito.any(SearchControls.class)
        )).thenReturn(userSearchResult);

        Map<String, Object> userData = authenticate(new TestLdapAuthProvider(userContext), FILTER);

        Assertions.assertEquals(USER_DN, userData.get(LdapConstants.CRED_USER_DN));
        Assertions.assertEquals("test-user-id", userData.get(LdapConstants.CRED_USERNAME));
        Mockito.verify(filterSearchResult).close();
    }

    @Test
    public void fullDnLoginRequiresSuccessfulUserBindEvenWhenFilterIsEmpty() {
        DBException exception = Assertions.assertThrows(
            DBException.class,
            () -> authenticate(new FailingLdapAuthProvider(), "")
        );

        Assertions.assertEquals("LDAP authentication failed: User bind failed", exception.getMessage());
    }

    @NotNull
    private static Map<String, Object> authenticate(
        @NotNull LdapAuthProvider provider,
        @NotNull String filter
    ) throws DBException {
        return authenticate(provider, filter, USER_DN, Map.of());
    }

    @NotNull
    private static Map<String, Object> authenticate(
        @NotNull LdapAuthProvider provider,
        @NotNull String filter,
        @NotNull Map<String, Object> additionalParameters
    ) throws DBException {
        return authenticate(provider, filter, USER_DN, additionalParameters);
    }

    @NotNull
    private static Map<String, Object> authenticate(
        @NotNull LdapAuthProvider provider,
        @NotNull String filter,
        @NotNull String userName,
        @NotNull Map<String, Object> additionalParameters
    ) throws DBException {
        final SMAuthProviderCustomConfiguration configuration = new SMAuthProviderCustomConfiguration("test-ldap");
        Map<String, Object> parameters = new HashMap<>();
        parameters.put(LdapConstants.PARAM_HOST, "localhost");
        parameters.put(LdapConstants.PARAM_DN, "dc=example,dc=com");
        parameters.put(LdapConstants.PARAM_FILTER, filter);
        parameters.put(LdapConstants.LDAP_META_GROUP_NAME, "memberOf");
        parameters.putAll(additionalParameters);
        configuration.setParameters(parameters);

        return provider.authExternalUser(
            new VoidProgressMonitor(),
            configuration,
            Map.of(
                LdapConstants.CRED_USER_DN, userName,
                LdapConstants.CRED_PASSWORD, USER_PASSWORD
            )
        );
    }

    @NotNull
    @SuppressWarnings("unchecked")
    private static NamingEnumeration<SearchResult> mockFilterSearchResult(boolean hasMore) throws Exception {
        NamingEnumeration<SearchResult> searchResult = Mockito.mock(NamingEnumeration.class);
        Mockito.when(searchResult.hasMore()).thenReturn(hasMore);
        return searchResult;
    }

    @NotNull
    @SuppressWarnings("unchecked")
    private static NamingEnumeration<SearchResult> mockUserSearchResult() throws Exception {
        BasicAttributes attributes = new BasicAttributes();
        attributes.put("entryUUID", "test-user-id");
        SearchResult user = new SearchResult("", null, attributes);

        NamingEnumeration<SearchResult> searchResult = Mockito.mock(NamingEnumeration.class);
        Mockito.when(searchResult.hasMore()).thenReturn(true);
        Mockito.when(searchResult.next()).thenReturn(user);
        return searchResult;
    }

    private static class BindUserLdapAuthProvider extends LdapAuthProvider {
        private final DirContext bindUserContext;
        private int connectionCount;

        private BindUserLdapAuthProvider(@NotNull DirContext bindUserContext) {
            this.bindUserContext = bindUserContext;
        }

        @NotNull
        @Override
        public DirContext initConnection(@NotNull Map<String, String> environment) {
            connectionCount++;
            Assertions.assertEquals(BIND_USER_DN, environment.get(Context.SECURITY_PRINCIPAL));
            Assertions.assertEquals(BIND_USER_PASSWORD, environment.get(Context.SECURITY_CREDENTIALS));
            return bindUserContext;
        }

        private int getConnectionCount() {
            return connectionCount;
        }
    }

    private static class FailingLdapAuthProvider extends LdapAuthProvider {
        @NotNull
        @Override
        public DirContext initConnection(@NotNull Map<String, String> environment) throws DBException {
            throw new DBException("User bind failed");
        }
    }

    private static class TestLdapAuthProvider extends LdapAuthProvider {
        private final DirContext userContext;

        private TestLdapAuthProvider(@NotNull DirContext userContext) {
            this.userContext = userContext;
        }

        @NotNull
        @Override
        public DirContext initConnection(@NotNull Map<String, String> environment) {
            Assertions.assertEquals(USER_DN, environment.get(Context.SECURITY_PRINCIPAL));
            Assertions.assertEquals(USER_PASSWORD, environment.get(Context.SECURITY_CREDENTIALS));
            return userContext;
        }
    }
}
