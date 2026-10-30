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
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.jkiss.dbeaver.model.security.SMStandardMeta;
import org.jkiss.dbeaver.model.security.user.SMUser;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Exercises filling missing LDAP profile values through local validation without a server or management database.
 */
public class LdapProfileFillTest {
    private static final String USER_ID = "ldap-user";
    private static final String FIRST_NAME = SMStandardMeta.META_FIRST_NAME;
    private static final String LAST_NAME = SMStandardMeta.META_LAST_NAME;
    private static final String CUSTOM_META = "local-preference";

    private final LdapAuthProvider provider = new LdapAuthProvider();
    private final SMAuthProviderCustomConfiguration configuration = new SMAuthProviderCustomConfiguration("test-ldap");
    private SMAdminController controller;
    private Map<String, SMUser> storedUsers;

    @BeforeEach
    public void setUp() throws DBException {
        controller = Mockito.mock(SMAdminController.class);
        storedUsers = new HashMap<>();
        storeUser(USER_ID, Map.of());
        Mockito.when(controller.getUserById(Mockito.anyString())).thenAnswer(
            invocation -> storedUsers.get(invocation.<String>getArgument(0))
        );
        // Model the replace-all persistence contract, keeping previously loaded users unchanged.
        Mockito.doAnswer(invocation -> {
            storeUser(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(controller).setSubjectMetas(Mockito.anyString(), Mockito.anyMap());
    }

    @Test
    public void fillsAbsentValuesAndPreservesUnmappedMetadata() throws DBException {
        storeUser(USER_ID, Map.of(LAST_NAME, "Manual", CUSTOM_META, "keep"));
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "Alice"));

        Assertions.assertEquals(USER_ID, validate(credentials, null));

        Map<String, String> expected = Map.of(FIRST_NAME, "Alice", LAST_NAME, "Manual", CUSTOM_META, "keep");
        Mockito.verify(controller).setSubjectMetas(USER_ID, expected);
        Assertions.assertEquals(expected, storedUsers.get(USER_ID).getMetaParameters());
        Assertions.assertEquals(expected, credentials.get(SMStandardMeta.KEY_META_PARAMS));
    }

    @Test
    public void fillsNullAndEmptyStoredValues() throws DBException {
        Map<String, String> current = new HashMap<>();
        current.put(FIRST_NAME, null);
        current.put(LAST_NAME, "");
        current.put(CUSTOM_META, "keep");
        storeUser(USER_ID, current);
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "Alice", LAST_NAME, "Smith"));

        validate(credentials, null);

        Map<String, String> expected = Map.of(FIRST_NAME, "Alice", LAST_NAME, "Smith", CUSTOM_META, "keep");
        Mockito.verify(controller).setSubjectMetas(USER_ID, expected);
        Assertions.assertEquals(expected, credentials.get(SMStandardMeta.KEY_META_PARAMS));
    }

    @Test
    public void filledLocalNamesRemainInCredentialsAndSessionIdentity() throws DBException {
        Map<String, String> current = Map.of(
            FIRST_NAME, "Manual", LAST_NAME, "Name", CUSTOM_META, "keep"
        );
        storeUser(USER_ID, current);
        Map<String, Object> credentials = credentials(Map.of(
            FIRST_NAME, "Directory", LAST_NAME, "Name"
        ));
        credentials.put(SMStandardMeta.META_FIRST_NAME, "Directory");

        validate(credentials, null);
        DBWUserIdentity identity = provider.getUserIdentity(new VoidProgressMonitor(), configuration, credentials);

        Mockito.verify(controller, Mockito.never()).setSubjectMetas(Mockito.anyString(), Mockito.anyMap());
        Assertions.assertEquals(current, credentials.get(SMStandardMeta.KEY_META_PARAMS));
        Assertions.assertEquals(current, sessionWithIdentity(identity).getUserMetaParameters());
        Assertions.assertTrue(identity.getMetaParameters().isEmpty());
        Assertions.assertEquals("Manual Name", identity.getDisplayName());
    }

    @Test
    public void mainLoginExposesFilledValuesFromTheStoredProfileWithoutAnIdentityOverlay() throws DBException {
        storeUser(USER_ID, Map.of(FIRST_NAME, "Manual", CUSTOM_META, "keep"));
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "Directory", LAST_NAME, "Smith"));

        validate(credentials, null);
        DBWUserIdentity identity = provider.getUserIdentity(new VoidProgressMonitor(), configuration, credentials);

        Assertions.assertEquals(
            Map.of(FIRST_NAME, "Manual", LAST_NAME, "Smith", CUSTOM_META, "keep"),
            sessionWithIdentity(identity).getUserMetaParameters()
        );
        Assertions.assertTrue(identity.getMetaParameters().isEmpty());
        Assertions.assertEquals("Manual Smith", identity.getDisplayName());
    }

    @Test
    public void missingAndEmptyLdapValuesNeverDeleteStoredMetadata() throws DBException {
        Map<String, String> current = new HashMap<>();
        current.put(FIRST_NAME, "Manual");
        current.put(LAST_NAME, "");
        current.put(CUSTOM_META, null);
        storeUser(USER_ID, current);
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "", LAST_NAME, ""));

        validate(credentials, null);

        Mockito.verify(controller).getUserById(USER_ID);
        Mockito.verify(controller, Mockito.never()).setSubjectMetas(Mockito.anyString(), Mockito.anyMap());
        Assertions.assertEquals(current, storedUsers.get(USER_ID).getMetaParameters());
        Assertions.assertEquals(current, credentials.get(SMStandardMeta.KEY_META_PARAMS));
    }

    @Test
    public void repeatedLoginsDoNotOverwriteEvenWhenDirectoryValuesChange() throws DBException {
        storeUser(USER_ID, Map.of(CUSTOM_META, "keep"));

        validate(credentials(Map.of(FIRST_NAME, "Alice")), null);
        validate(credentials(Map.of(FIRST_NAME, "Alice")), null);
        Map<String, Object> changedCredentials = credentials(Map.of(FIRST_NAME, "Changed in LDAP"));
        validate(changedCredentials, null);

        Map<String, String> expected = Map.of(FIRST_NAME, "Alice", CUSTOM_META, "keep");
        Mockito.verify(controller, Mockito.times(1)).setSubjectMetas(Mockito.anyString(), Mockito.anyMap());
        Mockito.verify(controller).setSubjectMetas(USER_ID, expected);
        Assertions.assertEquals(expected, storedUsers.get(USER_ID).getMetaParameters());
        Assertions.assertEquals(expected, changedCredentials.get(SMStandardMeta.KEY_META_PARAMS));
    }

    @Test
    public void absentAndEmptyProfilesDoNotReadOrWriteMetadata() throws DBException {
        Map<String, Object> absent = credentials(null);
        Map<String, Object> empty = credentials(Map.of());

        Assertions.assertEquals(USER_ID, validate(absent, null));
        Assertions.assertEquals(USER_ID, validate(empty, null));

        Assertions.assertFalse(absent.containsKey(SMStandardMeta.KEY_META_PARAMS));
        Assertions.assertEquals(Map.of(), empty.get(SMStandardMeta.KEY_META_PARAMS));
        Mockito.verifyNoInteractions(controller);
    }

    @Test
    public void otherLdapMetadataIsIgnoredWhileStoredNamesRemainAvailable() throws DBException {
        Map<String, String> current = Map.of(FIRST_NAME, "Manual", LAST_NAME, "Name", CUSTOM_META, "keep");
        storeUser(USER_ID, current);
        Map<String, Object> credentials = credentials(Map.of(
            FIRST_NAME, "", LAST_NAME, "", "email", "directory@example.com", "title", "Engineer"
        ));

        validate(credentials, null);

        Mockito.verify(controller).getUserById(USER_ID);
        Mockito.verify(controller, Mockito.never()).setSubjectMetas(Mockito.anyString(), Mockito.anyMap());
        Assertions.assertEquals(current, credentials.get(SMStandardMeta.KEY_META_PARAMS));
        Assertions.assertEquals(current, storedUsers.get(USER_ID).getMetaParameters());
    }

    @Test
    public void newUserCredentialsContainOnlyNonemptyNames() throws DBException {
        storedUsers.clear();
        Map<String, String> profile = Map.of(FIRST_NAME, "Alice", LAST_NAME, "");
        Map<String, Object> credentials = credentials(profile);

        Assertions.assertEquals(USER_ID, validate(credentials, null));

        Assertions.assertEquals(Map.of(FIRST_NAME, "Alice"), credentials.get(SMStandardMeta.KEY_META_PARAMS));
        Assertions.assertEquals(Map.of(FIRST_NAME, "Alice", LAST_NAME, ""), profile);
        Mockito.verify(controller).getUserById(USER_ID);
        Mockito.verifyNoMoreInteractions(controller);
        Assertions.assertTrue(storedUsers.isEmpty());
    }

    @Test
    public void fillingMissingValuesDoesNotMutateTheLoadedUser() throws DBException {
        Map<String, String> current = Map.of(FIRST_NAME, "Manual", CUSTOM_META, "keep");
        SMUser loadedUser = storeUser(USER_ID, current);
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "Directory", LAST_NAME, "Smith"));

        validate(credentials, null);

        Assertions.assertEquals(current, loadedUser.getMetaParameters());
        Assertions.assertNotSame(loadedUser.getMetaParameters(), credentials.get(SMStandardMeta.KEY_META_PARAMS));
        Mockito.verify(controller).setSubjectMetas(USER_ID, Map.of(FIRST_NAME, "Manual", LAST_NAME, "Smith", CUSTOM_META, "keep"));
    }

    @Test
    public void metadataReadFailureDoesNotFailValidationOrChangeStoredValues() throws DBException {
        Map<String, String> current = Map.of(FIRST_NAME, "Manual", CUSTOM_META, "keep");
        SMUser loadedUser = storeUser(USER_ID, current);
        Mockito.when(controller.getUserById(USER_ID)).thenThrow(new DBException("metadata read failed"));
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "Alice", LAST_NAME, ""));

        Assertions.assertEquals(USER_ID, Assertions.assertDoesNotThrow(() -> validate(credentials, null)));

        Assertions.assertEquals(Map.of(FIRST_NAME, "Alice"), credentials.get(SMStandardMeta.KEY_META_PARAMS));
        Assertions.assertEquals(current, loadedUser.getMetaParameters());
        Assertions.assertSame(loadedUser, storedUsers.get(USER_ID));
        Mockito.verify(controller, Mockito.never()).setSubjectMetas(Mockito.anyString(), Mockito.anyMap());
    }

    @Test
    public void metadataWriteFailurePreservesStoredValuesAndEffectiveCredentials() throws DBException {
        Map<String, String> current = Map.of(FIRST_NAME, "Manual", CUSTOM_META, "keep");
        SMUser loadedUser = storeUser(USER_ID, current);
        Mockito.doThrow(new DBException("metadata write failed"))
            .when(controller).setSubjectMetas(Mockito.eq(USER_ID), Mockito.anyMap());
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "Directory", LAST_NAME, "Smith"));

        Assertions.assertEquals(USER_ID, Assertions.assertDoesNotThrow(() -> validate(credentials, null)));

        Map<String, String> expected = Map.of(FIRST_NAME, "Manual", LAST_NAME, "Smith", CUSTOM_META, "keep");
        Mockito.verify(controller).setSubjectMetas(USER_ID, expected);
        Assertions.assertEquals(current, loadedUser.getMetaParameters());
        Assertions.assertSame(loadedUser, storedUsers.get(USER_ID));
        Assertions.assertEquals(expected, credentials.get(SMStandardMeta.KEY_META_PARAMS));
    }

    @Test
    public void usernameLookupIsCaseFoldedWhileReturnedIdIsPreserved() throws DBException {
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "Alice"));
        credentials.put(LdapConstants.CRED_USERNAME, "LDAP-User");

        Assertions.assertEquals("LDAP-User", validate(credentials, null));

        Mockito.verify(controller).getUserById(USER_ID);
        Mockito.verify(controller).setSubjectMetas(USER_ID, Map.of(FIRST_NAME, "Alice"));
        Mockito.verifyNoMoreInteractions(controller);
        Assertions.assertEquals("LDAP-User", credentials.get(LdapConstants.CRED_USERNAME));
    }

    @Test
    public void linkedAccountIdIsUsedWithoutCaseFoldingOrChangingTheSharedUsernameAccount() throws DBException {
        String linkedId = "Linked-Account";
        storeUser(linkedId, Map.of(FIRST_NAME, "Manual", CUSTOM_META, "keep"));
        SMUser unrelatedUser = storeUser(USER_ID, Map.of(FIRST_NAME, "Local", CUSTOM_META, "private"));
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "Directory", LAST_NAME, "Smith"));
        credentials.put(LdapConstants.CRED_USERNAME, "LDAP-User");

        Assertions.assertEquals(linkedId, validate(credentials, linkedId));

        Map<String, String> expected = Map.of(FIRST_NAME, "Manual", LAST_NAME, "Smith", CUSTOM_META, "keep");
        Mockito.verify(controller).getUserById(linkedId);
        Mockito.verify(controller).setSubjectMetas(linkedId, expected);
        Mockito.verifyNoMoreInteractions(controller);
        Assertions.assertEquals(expected, credentials.get(SMStandardMeta.KEY_META_PARAMS));
        Assertions.assertSame(unrelatedUser, storedUsers.get(USER_ID));
        Assertions.assertEquals(Map.of(FIRST_NAME, "Local", CUSTOM_META, "private"), unrelatedUser.getMetaParameters());
    }

    @Test
    public void missingLinkedAccountDoesNotFallBackToTheCredentialUsername() throws DBException {
        storeUser(USER_ID, Map.of(FIRST_NAME, "Local"));
        Map<String, Object> credentials = credentials(Map.of(FIRST_NAME, "Directory", LAST_NAME, ""));

        Assertions.assertEquals("missing-linked-id", validate(credentials, "missing-linked-id"));

        Mockito.verify(controller).getUserById("missing-linked-id");
        Mockito.verifyNoMoreInteractions(controller);
        Assertions.assertEquals(Map.of(FIRST_NAME, "Local"), storedUsers.get(USER_ID).getMetaParameters());
        Assertions.assertEquals(Map.of(FIRST_NAME, "Directory"), credentials.get(SMStandardMeta.KEY_META_PARAMS));
    }

    @Test
    public void nonMapProfilesAreLeftUnchangedWithoutReadingOrWritingMetadata() throws DBException {
        for (Object profile : List.of("not a metadata map", List.of("not", "a", "map"))) {
            Map<String, Object> credentials = credentials(profile);

            Assertions.assertEquals(USER_ID, validate(credentials, null));

            Assertions.assertSame(profile, credentials.get(SMStandardMeta.KEY_META_PARAMS));
        }
        Mockito.verifyNoInteractions(controller);
    }

    @NotNull
    private WebSession sessionWithIdentity(@NotNull DBWUserIdentity identity) {
        WebAuthInfo authInfo = Mockito.mock(WebAuthInfo.class);
        Mockito.when(authInfo.getUserIdentity()).thenReturn(identity);
        WebSession session = Mockito.mock(WebSession.class, Mockito.CALLS_REAL_METHODS);
        Mockito.doReturn(new WebUser(storedUsers.get(USER_ID))).when(session).getUser();
        Mockito.doReturn(List.of(authInfo)).when(session).getAllAuthInfo();
        return session;
    }

    @NotNull
    private String validate(@NotNull Map<String, Object> credentials, @Nullable String activeUserId) throws DBException {
        return provider.validateLocalAuth(new VoidProgressMonitor(), controller, configuration, credentials, activeUserId);
    }

    @NotNull
    private SMUser storeUser(@NotNull String userId, @NotNull Map<String, String> metas) {
        SMUser user = new SMUser(userId, true, null);
        user.setMetaParameters(new LinkedHashMap<>(metas));
        storedUsers.put(userId, user);
        return user;
    }

    @NotNull
    private static Map<String, Object> credentials(@Nullable Object profile) {
        Map<String, Object> credentials = new HashMap<>();
        // Omit the DN so local validation does not enter the unrelated legacy credential migration path.
        credentials.put(LdapConstants.CRED_USERNAME, USER_ID);
        if (profile != null) {
            credentials.put(SMStandardMeta.KEY_META_PARAMS, profile);
        }
        return credentials;
    }
}
