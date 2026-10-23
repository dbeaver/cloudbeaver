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
package io.cloudbeaver.test.platform.admin;

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.service.auth.ldap.LdapAuthProvider;
import io.cloudbeaver.service.auth.ldap.LdapConstants;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMTeamGrantType;
import org.jkiss.dbeaver.model.security.exception.SMException;
import org.jkiss.dbeaver.model.security.user.SMUserTeam;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

public class AdminUserTeamGrantTest extends CloudbeaverMockTest {
    private static final String PROVIDER_A = "test-provider-a";
    private static final String PROVIDER_B = "test-provider-b";
    private static final String ADMIN_USER = "test";

    private SMAdminController securityController;
    private String userId;
    private String providerTeamOne;
    private String providerTeamTwo;
    private String manualTeam;

    @BeforeEach
    public void createSubjects() throws Exception {
        securityController = CEAppStarter.getTestApp().getSecurityController();
        String suffix = UUID.randomUUID().toString();
        userId = "grant-user-" + suffix;
        providerTeamOne = "provider-team-one-" + suffix;
        providerTeamTwo = "provider-team-two-" + suffix;
        manualTeam = "manual-team-" + suffix;

        securityController.createTeam(providerTeamOne, providerTeamOne, null, ADMIN_USER);
        securityController.createTeam(providerTeamTwo, providerTeamTwo, null, ADMIN_USER);
        securityController.createTeam(manualTeam, manualTeam, null, ADMIN_USER);
        securityController.createUser(userId, Map.of(), true, null);
    }

    @AfterEach
    public void deleteSubjects() throws Exception {
        securityController.deleteUser(userId);
        securityController.deleteTeam(providerTeamOne, true);
        securityController.deleteTeam(providerTeamTwo, true);
        securityController.deleteTeam(manualTeam, true);
    }

    @Test
    public void testProviderSynchronizationHasPriorityAndPreservesUnmappedGrants() throws Exception {
        securityController.setUserTeams(
            userId,
            new String[]{providerTeamOne, providerTeamTwo},
            PROVIDER_A,
            SMTeamGrantType.AUTH_PROVIDER
        );
        securityController.addUserTeams(userId, new String[]{manualTeam}, ADMIN_USER);

        securityController.setUserTeams(userId, new String[]{manualTeam}, ADMIN_USER);

        Map<String, SMUserTeam> grants = getGrants();
        assertGrant(grants, providerTeamOne, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_A);
        assertGrant(grants, providerTeamTwo, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_A);
        assertGrant(grants, manualTeam, SMTeamGrantType.MANUAL, ADMIN_USER);
        assertGrant(
            grants,
            CEAppStarter.getTestApp().getAppConfiguration().getDefaultUserTeam(),
            SMTeamGrantType.DEFAULT,
            userId
        );

        securityController.setUserTeams(
            userId,
            new String[]{providerTeamTwo},
            PROVIDER_A,
            SMTeamGrantType.AUTH_PROVIDER
        );

        grants = getGrants();
        Assertions.assertFalse(grants.containsKey(providerTeamOne));
        assertGrant(grants, providerTeamTwo, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_A);
        assertGrant(grants, manualTeam, SMTeamGrantType.MANUAL, ADMIN_USER);

        securityController.addUserTeams(userId, new String[]{providerTeamTwo}, ADMIN_USER);
        assertGrant(getGrants(), providerTeamTwo, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_A);
        securityController.setUserTeams(userId, new String[0], PROVIDER_A, SMTeamGrantType.AUTH_PROVIDER);

        grants = getGrants();
        Assertions.assertFalse(grants.containsKey(providerTeamTwo));
        assertGrant(grants, manualTeam, SMTeamGrantType.MANUAL, ADMIN_USER);

        securityController.setUserTeams(userId, new String[]{providerTeamOne}, ADMIN_USER);
        assertGrant(getGrants(), providerTeamOne, SMTeamGrantType.MANUAL, ADMIN_USER);
        securityController.setUserTeams(
            userId,
            new String[]{providerTeamOne},
            PROVIDER_A,
            SMTeamGrantType.AUTH_PROVIDER
        );
        assertGrant(getGrants(), providerTeamOne, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_A);
    }

    @Test
    public void testProviderGrantCannotBeDeletedManually() throws Exception {
        securityController.setUserTeams(
            userId,
            new String[]{providerTeamOne},
            PROVIDER_A,
            SMTeamGrantType.AUTH_PROVIDER
        );

        Assertions.assertThrows(
            SMException.class,
            () -> securityController.deleteUserTeams(userId, new String[]{providerTeamOne})
        );
        assertGrant(getGrants(), providerTeamOne, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_A);
    }

    @Test
    public void testAuthoritativeMappingRemovesManualGrant() throws Exception {
        securityController.setSubjectMetas(
            providerTeamOne,
            Map.of(LdapConstants.LDAP_META_GROUP_NAME, "mapped-group")
        );
        securityController.setUserTeams(userId, new String[]{providerTeamOne}, ADMIN_USER);

        securityController.setUserTeams(
            userId,
            new String[0],
            LdapAuthProvider.LDAP_AUTH_PROVIDER_ID,
            SMTeamGrantType.AUTH_PROVIDER
        );

        Assertions.assertFalse(getGrants().containsKey(providerTeamOne));
    }

    @Test
    public void testPositiveProviderMappingTakesOwnership() throws Exception {
        securityController.setUserTeams(
            userId,
            new String[]{providerTeamOne},
            PROVIDER_A,
            SMTeamGrantType.AUTH_PROVIDER
        );
        securityController.setUserTeams(
            userId,
            new String[]{providerTeamOne},
            PROVIDER_B,
            SMTeamGrantType.AUTH_PROVIDER
        );

        assertGrant(getGrants(), providerTeamOne, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_B);

        securityController.setUserTeams(userId, new String[0], PROVIDER_A, SMTeamGrantType.AUTH_PROVIDER);
        assertGrant(getGrants(), providerTeamOne, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_B);

        securityController.setUserTeams(
            userId,
            new String[]{providerTeamOne},
            PROVIDER_A,
            SMTeamGrantType.AUTH_PROVIDER
        );
        assertGrant(getGrants(), providerTeamOne, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_A);

        securityController.setUserTeams(userId, new String[0], PROVIDER_B, SMTeamGrantType.AUTH_PROVIDER);

        assertGrant(getGrants(), providerTeamOne, SMTeamGrantType.AUTH_PROVIDER, PROVIDER_A);
    }

    private Map<String, SMUserTeam> getGrants() throws Exception {
        return Arrays.stream(securityController.getUserTeams(userId))
            .collect(Collectors.toMap(SMUserTeam::getTeamId, Function.identity()));
    }

    private static void assertGrant(
        Map<String, SMUserTeam> grants,
        String teamId,
        SMTeamGrantType grantType,
        String grantedBy
    ) {
        SMUserTeam grant = grants.get(teamId);
        Assertions.assertNotNull(grant, "Team grant not found: " + teamId);
        Assertions.assertEquals(grantType, grant.getGrantType());
        Assertions.assertEquals(grantedBy, grant.getGrantedBy());
    }
}
