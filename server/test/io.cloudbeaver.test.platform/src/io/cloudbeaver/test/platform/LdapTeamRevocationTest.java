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

import io.cloudbeaver.auth.SMAutoAssign;
import io.cloudbeaver.service.auth.ldap.LdapAuthProvider;
import io.cloudbeaver.service.auth.ldap.LdapConstants;
import io.cloudbeaver.service.auth.ldap.LdapSettings;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.security.SMAuthProviderCustomConfiguration;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.PartialResultException;
import javax.naming.directory.BasicAttribute;
import javax.naming.directory.BasicAttributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;

public class LdapTeamRevocationTest {
    private static final String USER_LOGIN = "test-user";
    private static final String USER_DN = "cn=test-user,dc=example,dc=com";
    private static final String BASE_DN = "dc=example,dc=com";
    private static final String GROUP_DN = "cn=admins,ou=groups,dc=example,dc=com";

    @Test
    public void completeLookupIsReportedAsComplete() throws Exception {
        DirContext context = directory(List.of(GROUP_DN), null);

        SMAutoAssign autoAssign = detectAutoAssignments(new ContextLdapAuthProvider(context));

        Assertions.assertEquals(List.of(USER_DN, GROUP_DN), autoAssign.getExternalTeamIds());
        Assertions.assertTrue(autoAssign.isExternalTeamIdsComplete());
    }

    @Test
    public void referralInTheGroupSearchIsReportedAsIncompleteButKeepsTheGroups() throws Exception {
        DirContext context = directory(List.of(GROUP_DN), new PartialResultException("referral"));

        SMAutoAssign autoAssign = detectAutoAssignments(new ContextLdapAuthProvider(context));

        Assertions.assertEquals(List.of(USER_DN, GROUP_DN), autoAssign.getExternalTeamIds());
        Assertions.assertFalse(autoAssign.isExternalTeamIdsComplete());
    }

    @Test
    public void failedGroupSearchIsReportedAsIncomplete() throws Exception {
        DirContext context = directory(List.of(GROUP_DN), new NamingException("search failed"));

        SMAutoAssign autoAssign = detectAutoAssignments(new ContextLdapAuthProvider(context));

        Assertions.assertEquals(List.of(USER_DN, GROUP_DN), autoAssign.getExternalTeamIds());
        Assertions.assertFalse(autoAssign.isExternalTeamIdsComplete());
    }

    @Test
    public void completeLookupWithoutGroupsIsAnAnswerToo() throws Exception {
        // the user is in no group any more, the teams assigned automatically because of a group can go
        DirContext context = directory(List.of(), null);

        SMAutoAssign autoAssign = detectAutoAssignments(new ContextLdapAuthProvider(context));

        Assertions.assertEquals(List.of(USER_DN), autoAssign.getExternalTeamIds());
        Assertions.assertTrue(autoAssign.isExternalTeamIdsComplete());
    }

    @Test
    public void lookupThatDoesNotReportItsCompletenessIsNotTrusted() throws Exception {
        LdapAuthProvider provider = new LdapAuthProvider() {
            @NotNull
            @Override
            protected List<String> getGroupForMember(
                @NotNull String fullDN,
                @NotNull LdapSettings ldapSettings,
                @NotNull Map<String, Object> authParameters
            ) {
                return List.of(GROUP_DN);
            }
        };

        SMAutoAssign autoAssign = detectAutoAssignments(provider);

        Assertions.assertEquals(List.of(USER_DN, GROUP_DN), autoAssign.getExternalTeamIds());
        Assertions.assertFalse(autoAssign.isExternalTeamIdsComplete());
    }

    @Test
    public void completenessOfOneLookupDoesNotLeakIntoTheNext() throws Exception {
        LdapAuthProvider provider = new ContextLdapAuthProvider(directory(List.of(GROUP_DN), null));
        Assertions.assertTrue(detectAutoAssignments(provider).isExternalTeamIdsComplete());

        LdapAuthProvider notReporting = new LdapAuthProvider() {
            @NotNull
            @Override
            protected List<String> getGroupForMember(
                @NotNull String fullDN,
                @NotNull LdapSettings ldapSettings,
                @NotNull Map<String, Object> authParameters
            ) {
                return List.of(GROUP_DN);
            }
        };
        Assertions.assertFalse(detectAutoAssignments(notReporting).isExternalTeamIdsComplete());
    }

    @NotNull
    private static SMAutoAssign detectAutoAssignments(@NotNull LdapAuthProvider provider) throws DBException {
        SMAuthProviderCustomConfiguration configuration = new SMAuthProviderCustomConfiguration("test-ldap");
        configuration.setParameters(Map.of(LdapConstants.PARAM_HOST, "localhost", LdapConstants.PARAM_DN, BASE_DN));
        Map<String, Object> authParameters = new HashMap<>();
        authParameters.put(LdapConstants.CRED_USERNAME, USER_LOGIN);
        authParameters.put(LdapConstants.CRED_USER_DN, USER_DN);
        authParameters.put(LdapConstants.CRED_PASSWORD, "secret");
        return provider.detectAutoAssignments(new VoidProgressMonitor(), configuration, authParameters);
    }

    /**
     * A directory where the user is a member of the given groups according to the memberOf attribute,
     * and where the search by the member attribute fails with the given exception (or finds nothing).
     */
    @NotNull
    @SuppressWarnings("unchecked")
    private static DirContext directory(@NotNull List<String> memberOf, NamingException memberSearchFailure) throws Exception {
        BasicAttributes userAttributes = new BasicAttributes(true);
        if (!memberOf.isEmpty()) {
            BasicAttribute attribute = new BasicAttribute("memberOf");
            memberOf.forEach(attribute::add);
            userAttributes.put(attribute);
        }
        NamingEnumeration<SearchResult> userRecord = Mockito.mock(NamingEnumeration.class);
        Mockito.when(userRecord.hasMore()).thenReturn(true);
        Mockito.when(userRecord.next()).thenReturn(new SearchResult(USER_DN, null, userAttributes));

        NamingEnumeration<SearchResult> noGroups = Mockito.mock(NamingEnumeration.class);
        Mockito.when(noGroups.hasMore()).thenReturn(false);

        DirContext context = Mockito.mock(DirContext.class);
        Mockito.when(context.search(
            Mockito.eq(USER_DN),
            Mockito.eq("(objectClass=*)"),
            Mockito.any(SearchControls.class)
        )).thenReturn(userRecord);
        if (memberSearchFailure != null) {
            Mockito.when(context.search(
                Mockito.eq(BASE_DN),
                Mockito.eq("(member={0})"),
                Mockito.any(Object[].class),
                Mockito.any(SearchControls.class)
            )).thenThrow(memberSearchFailure);
        } else {
            Mockito.when(context.search(
                Mockito.eq(BASE_DN),
                Mockito.eq("(member={0})"),
                Mockito.any(Object[].class),
                Mockito.any(SearchControls.class)
            )).thenReturn(noGroups);
        }
        return context;
    }

    private static class ContextLdapAuthProvider extends LdapAuthProvider {
        private final DirContext context;

        private ContextLdapAuthProvider(@NotNull DirContext context) {
            this.context = context;
        }

        @NotNull
        @Override
        public DirContext initConnection(@NotNull Map<String, String> environment) {
            return context;
        }
    }
}
