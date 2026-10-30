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

import io.cloudbeaver.DBWUserIdentity;
import io.cloudbeaver.model.session.WebAuthInfo;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.model.user.WebUser;
import io.cloudbeaver.service.auth.ldap.LdapAuthProvider;
import io.cloudbeaver.service.auth.ldap.LdapConstants;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.model.security.SMStandardMeta;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.List;
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

    @Test
    public void firstAndLastNamesAreReadFromTheDirectory() throws Exception {
        Map<String, Object> userData = authenticateWithProfile(
            Map.of(
                "ldap-first-name-field", "givenName",
                "ldap-last-name-field", "sn"
            )
        );

        Assertions.assertEquals("Una", userData.get(SMStandardMeta.META_FIRST_NAME));
        Assertions.assertEquals("One", userData.get(SMStandardMeta.META_LAST_NAME));
        // the login stays what the other parts of the provider rely on
        Assertions.assertEquals("test-user", userData.get(LdapConstants.CRED_DISPLAY_NAME));
        Assertions.assertEquals(
            Map.of(
                SMStandardMeta.META_FIRST_NAME, "Una",
                SMStandardMeta.META_LAST_NAME, "One"
            ),
            userData.get(SMStandardMeta.KEY_META_PARAMS)
        );
    }

    @Test
    public void attributeMappingCanBeChangedOrDisabled() throws Exception {
        Map<String, Object> userData = authenticateWithProfile(
            Map.of(
                LdapConstants.PARAM_FIRST_NAME_FIELD, "cn",
                LdapConstants.PARAM_LAST_NAME_FIELD, ""
            )
        );

        Assertions.assertEquals("Una Maria", userData.get(SMStandardMeta.META_FIRST_NAME));
        Assertions.assertNull(userData.get(SMStandardMeta.META_LAST_NAME));
        Assertions.assertEquals(
            Map.of(SMStandardMeta.META_FIRST_NAME, "Una Maria"),
            userData.get(SMStandardMeta.KEY_META_PARAMS)
        );
    }

    @Test
    public void entryWithoutNamesReportsEmptyProfileValues() throws Exception {
        DirContext userContext = Mockito.mock(DirContext.class);
        NamingEnumeration<SearchResult> userSearchResult = mockUserSearchResult();
        Mockito.when(userContext.search(
            Mockito.eq(USER_DN),
            Mockito.eq("objectClass=*"),
            Mockito.any(SearchControls.class)
        )).thenReturn(userSearchResult);

        Map<String, Object> userData = authenticate(new TestLdapAuthProvider(userContext), "", Map.of(
            LdapConstants.PARAM_FIRST_NAME_FIELD, "givenName",
            LdapConstants.PARAM_LAST_NAME_FIELD, "sn"
        ));

        // Missing directory values supply nothing to fill; they must not clear the stored profile.
        Assertions.assertEquals(
            Map.of(SMStandardMeta.META_FIRST_NAME, "", SMStandardMeta.META_LAST_NAME, ""),
            userData.get(SMStandardMeta.KEY_META_PARAMS)
        );
        Assertions.assertNull(userData.get(SMStandardMeta.META_FIRST_NAME));
    }

    @Test
    public void attributeClearedInTheDirectoryIsReportedAsEmpty() throws Exception {
        BasicAttributes attributes = profileAttributes();
        attributes.remove("givenName");

        Map<String, Object> userData = authenticateWithProfile(
            attributes,
            Map.of(
                LdapConstants.PARAM_FIRST_NAME_FIELD, "givenName",
                LdapConstants.PARAM_LAST_NAME_FIELD, "sn"
            )
        );

        Assertions.assertEquals(
            Map.of(SMStandardMeta.META_FIRST_NAME, "", SMStandardMeta.META_LAST_NAME, "One"),
            userData.get(SMStandardMeta.KEY_META_PARAMS)
        );
        Assertions.assertNull(userData.get(SMStandardMeta.META_FIRST_NAME));
        Assertions.assertEquals("One", userData.get(SMStandardMeta.META_LAST_NAME));
    }

    @Test
    public void absentAndEmptyNameMappingsDoNotSupplyNamesForTheProfile() throws Exception {
        for (Map<String, Object> parameters : List.<Map<String, Object>>of(
            Map.of(),
            Map.of(LdapConstants.PARAM_FIRST_NAME_FIELD, "", LdapConstants.PARAM_LAST_NAME_FIELD, "")
        )) {
            Map<String, Object> userData = authenticateWithProfile(parameters);
            Assertions.assertFalse(userData.containsKey(SMStandardMeta.KEY_META_PARAMS));
            Assertions.assertNull(userData.get(SMStandardMeta.META_FIRST_NAME));
            Assertions.assertNull(userData.get(SMStandardMeta.META_LAST_NAME));
        }
    }

    @Test
    public void unconfiguredMappingsIgnoreTheDirectoryDisplayName() throws Exception {
        Map<String, Object> userData = authenticateWithProfile(Map.of());

        Assertions.assertFalse(userData.containsKey(SMStandardMeta.KEY_META_PARAMS));
        DBWUserIdentity identity = new LdapAuthProvider().getUserIdentity(new VoidProgressMonitor(), null, userData);
        Assertions.assertEquals("test-user", identity.getDisplayName());
        Assertions.assertTrue(identity.getMetaParameters().isEmpty());
    }

    @Test
    public void directoryProfileIsUsedForIdentityWithoutChangingLoginOrId() throws Exception {
        Map<String, Object> userData = authenticateWithProfile(Map.of(
            LdapConstants.PARAM_FIRST_NAME_FIELD, "givenName",
            LdapConstants.PARAM_LAST_NAME_FIELD, "sn"
        ));
        DBWUserIdentity identity = new LdapAuthProvider().getUserIdentity(new VoidProgressMonitor(), null, userData);

        Assertions.assertEquals("test-user-id", identity.getId());
        Assertions.assertEquals("test-user", userData.get(LdapConstants.CRED_DISPLAY_NAME));
        Assertions.assertEquals("Una One", identity.getDisplayName());
        Assertions.assertTrue(identity.getMetaParameters().isEmpty());
        Assertions.assertEquals(
            Map.of(SMStandardMeta.META_FIRST_NAME, "Una", SMStandardMeta.META_LAST_NAME, "One"),
            userData.get(SMStandardMeta.KEY_META_PARAMS)
        );
    }

    @Test
    public void firstAndLastNamesAreTrimmedAndLimitedToStorageLength() throws Exception {
        BasicAttributes attributes = profileAttributes();
        attributes.put("cn", " " + "a".repeat(1025) + " ");
        attributes.put("sn", " " + "b".repeat(1025) + " ");
        Map<String, Object> userData = authenticateWithProfile(attributes, Map.of(
            LdapConstants.PARAM_FIRST_NAME_FIELD, "cn",
            LdapConstants.PARAM_LAST_NAME_FIELD, "sn"
        ));

        Assertions.assertEquals(
            Map.of(SMStandardMeta.META_FIRST_NAME, "a".repeat(1024), SMStandardMeta.META_LAST_NAME, "b".repeat(1024)),
            userData.get(SMStandardMeta.KEY_META_PARAMS)
        );
        Assertions.assertEquals("a".repeat(1024), userData.get(SMStandardMeta.META_FIRST_NAME));
        Assertions.assertEquals("b".repeat(1024), userData.get(SMStandardMeta.META_LAST_NAME));
    }

    @Test
    public void userIdentityBuildsTheNameFromProfileFields() throws Exception {
        DBWUserIdentity identity = new LdapAuthProvider().getUserIdentity(
            new VoidProgressMonitor(),
            null,
            Map.of(
                LdapConstants.CRED_USERNAME, "test-user",
                LdapConstants.CRED_DISPLAY_NAME, "test-user",
                SMStandardMeta.KEY_META_PARAMS, Map.of(
                    SMStandardMeta.META_FIRST_NAME, "Una",
                    SMStandardMeta.META_LAST_NAME, "One"
                )
            )
        );

        Assertions.assertEquals("test-user", identity.getId());
        Assertions.assertEquals("Una One", identity.getDisplayName());
        Assertions.assertTrue(identity.getMetaParameters().isEmpty());
    }

    @Test
    public void userIdentityDoesNotExposeDirectoryProfileAsMetadataOverlay() throws Exception {
        DBWUserIdentity identity = new LdapAuthProvider().getUserIdentity(
            new VoidProgressMonitor(),
            null,
            Map.of(
                LdapConstants.CRED_USERNAME, "test-user",
                SMStandardMeta.KEY_META_PARAMS, Map.of(SMStandardMeta.META_FIRST_NAME, "")
            )
        );

        Assertions.assertTrue(identity.getMetaParameters().isEmpty());
    }

    @Test
    public void additionalLdapAuthenticationDoesNotOverrideTheLocalSessionProfile() throws Exception {
        Map<String, String> localProfile = Map.of(
            SMStandardMeta.META_FIRST_NAME, "Manual",
            SMStandardMeta.META_LAST_NAME, "Name",
            "email", "manual@example.com"
        );
        SMUser user = new SMUser("local-account", true, null);
        user.setMetaParameters(new HashMap<>(localProfile));
        Map<String, Object> ldapCredentials = Map.of(
            LdapConstants.CRED_USERNAME, "ldap-account",
            SMStandardMeta.KEY_META_PARAMS, Map.of(
                SMStandardMeta.META_FIRST_NAME, "Directory",
                SMStandardMeta.META_LAST_NAME, "User"
            )
        );

        // Child authentication does not call validateLocalAuth before building the provider identity.
        DBWUserIdentity identity = new LdapAuthProvider().getUserIdentity(new VoidProgressMonitor(), null, ldapCredentials);
        WebAuthInfo authInfo = Mockito.mock(WebAuthInfo.class);
        Mockito.when(authInfo.getUserIdentity()).thenReturn(identity);
        WebSession session = Mockito.mock(WebSession.class, Mockito.CALLS_REAL_METHODS);
        Mockito.doReturn(new WebUser(user)).when(session).getUser();
        Mockito.doReturn(List.of(authInfo)).when(session).getAllAuthInfo();

        Assertions.assertEquals(localProfile, session.getUserMetaParameters());
        Assertions.assertEquals(localProfile, user.getMetaParameters());
        Assertions.assertTrue(identity.getMetaParameters().isEmpty());
        Assertions.assertEquals("ldap-account", identity.getId());
    }

    @Test
    public void userIdentityUsesASingleAvailableNameWithoutExtraSpaces() throws Exception {
        for (Map<String, String> names : List.of(
            Map.of(SMStandardMeta.META_FIRST_NAME, "Una"),
            Map.of(SMStandardMeta.META_LAST_NAME, "One")
        )) {
            DBWUserIdentity identity = new LdapAuthProvider().getUserIdentity(
                new VoidProgressMonitor(),
                null,
                Map.of(LdapConstants.CRED_USERNAME, "test-user", SMStandardMeta.KEY_META_PARAMS, names)
            );

            Assertions.assertEquals(names.values().iterator().next(), identity.getDisplayName());
            Assertions.assertTrue(identity.getMetaParameters().isEmpty());
        }
    }

    @Test
    public void userIdentityFallsBackToFirstAndLastNameThenToTheLogin() throws Exception {
        LdapAuthProvider provider = new LdapAuthProvider();

        DBWUserIdentity byParts = provider.getUserIdentity(
            new VoidProgressMonitor(),
            null,
            Map.of(
                LdapConstants.CRED_USERNAME, "test-user",
                SMStandardMeta.META_FIRST_NAME, "Una",
                SMStandardMeta.META_LAST_NAME, "One"
            )
        );
        Assertions.assertEquals("Una One", byParts.getDisplayName());

        DBWUserIdentity byLogin = provider.getUserIdentity(
            new VoidProgressMonitor(),
            null,
            Map.of(LdapConstants.CRED_USERNAME, "test-user", LdapConstants.CRED_DISPLAY_NAME, "the-login")
        );
        Assertions.assertEquals("the-login", byLogin.getDisplayName());
        Assertions.assertTrue(byLogin.getMetaParameters().isEmpty());
    }

    @NotNull
    private static BasicAttributes profileAttributes() {
        BasicAttributes attributes = new BasicAttributes(true);
        attributes.put("entryUUID", "test-user-id");
        attributes.put("cn", "Una Maria");
        attributes.put("givenName", "Una");
        attributes.put("sn", "One");
        attributes.put("displayName", "Must not be used as the user's name");
        return attributes;
    }

    @NotNull
    private static Map<String, Object> authenticateWithProfile(
        @NotNull Map<String, Object> additionalParameters
    ) throws Exception {
        return authenticateWithProfile(profileAttributes(), additionalParameters);
    }

    @NotNull
    private static Map<String, Object> authenticateWithProfile(
        @NotNull BasicAttributes attributes,
        @NotNull Map<String, Object> additionalParameters
    ) throws Exception {
        DirContext userContext = Mockito.mock(DirContext.class);
        NamingEnumeration<SearchResult> userSearchResult = mockUserSearchResult(attributes);
        Mockito.when(userContext.search(
            Mockito.eq(USER_DN),
            Mockito.eq("objectClass=*"),
            Mockito.any(SearchControls.class)
        )).thenReturn(userSearchResult);

        return authenticate(new TestLdapAuthProvider(userContext), "", additionalParameters);
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
    private static NamingEnumeration<SearchResult> mockUserSearchResult() throws Exception {
        BasicAttributes attributes = new BasicAttributes();
        attributes.put("entryUUID", "test-user-id");
        return mockUserSearchResult(attributes);
    }

    @NotNull
    @SuppressWarnings("unchecked")
    private static NamingEnumeration<SearchResult> mockUserSearchResult(
        @NotNull BasicAttributes attributes
    ) throws Exception {
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
