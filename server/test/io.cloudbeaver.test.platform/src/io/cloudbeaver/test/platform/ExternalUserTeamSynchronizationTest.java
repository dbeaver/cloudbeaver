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

import io.cloudbeaver.CloudbeaverMockTest;
import io.cloudbeaver.app.CEAppStarter;
import io.cloudbeaver.auth.SMAutoAssign;
import io.cloudbeaver.auth.provider.local.LocalAuthProvider;
import io.cloudbeaver.model.app.ServletApplication;
import io.cloudbeaver.model.session.WebSession;
import io.cloudbeaver.registry.WebAuthProviderRegistry;
import io.cloudbeaver.service.auth.ldap.LdapAuthProvider;
import io.cloudbeaver.utils.ServletAppUtils;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.auth.SMAuthInfo;
import org.jkiss.dbeaver.model.auth.SMAuthStatus;
import org.jkiss.dbeaver.model.security.SMAdminController;
import org.jkiss.dbeaver.model.security.SMSubjectType;
import org.jkiss.dbeaver.model.security.SMTeamGrantType;
import org.jkiss.dbeaver.model.websocket.event.WSEventController;
import org.jkiss.dbeaver.model.websocket.event.permissions.WSSubjectPermissionEvent;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class ExternalUserTeamSynchronizationTest extends CloudbeaverMockTest {
    private static final String GROUP_METADATA = "test.group-id";
    private static final String EXTERNAL_GROUP = "test-external-group";
    private static final String TEAM_PERMISSION = "test-external-team-permission";
    private static final String ADMIN = "test";

    private SMAdminController controller;
    private String userId;
    private String teamId;
    private WSEventController events;

    @BeforeEach
    public void createTeam() throws DBException {
        controller = CEAppStarter.getTestApp().getSecurityController();
        userId = "external-user-" + UUID.randomUUID();
        teamId = "external-team-" + UUID.randomUUID();
        events = Mockito.mock(WSEventController.class);
        controller.createTeam(teamId, teamId, null, ADMIN);
        controller.setSubjectMetas(teamId, Map.of(GROUP_METADATA, EXTERNAL_GROUP));
        controller.setSubjectPermissions(teamId, List.of(TEAM_PERMISSION), ADMIN);
    }

    @AfterEach
    public void deleteSubjects() throws DBException {
        if (controller.getUserById(userId) != null) {
            controller.deleteUser(userId);
        }
        controller.deleteTeam(teamId, true);
    }

    @Test
    public void provisioningAssignsTeamWithoutPublishingPermissionsChange() throws DBException {
        var assignment = new SMAutoAssign(null, List.of(EXTERNAL_GROUP));
        authenticate(assignment, true);
        controller.deleteUser(userId);
        Mockito.clearInvocations(events);

        assertTrue(authenticate(assignment, true).getAuthPermissions().getPermissions().contains(TEAM_PERMISSION));
        assertTrue(Arrays.stream(controller.getUserTeams(userId)).anyMatch(team ->
            teamId.equals(team.getTeamId()) && team.getGrantType() == SMTeamGrantType.AUTH_PROVIDER));
        verifyPermissionEvents(0);
    }

    @Test
    public void linkingAndResynchronizingExistingUserPublishesOnlyActualChanges() throws DBException {
        controller.createUser(userId, Map.of(), true, null);
        var assignment = new SMAutoAssign(null, List.of(EXTERNAL_GROUP));
        assertTrue(authenticate(assignment, false).getAuthPermissions().getPermissions().contains(TEAM_PERMISSION));
        verifyPermissionEvents(1);

        Mockito.clearInvocations(events);
        authenticate(assignment, false);
        verifyPermissionEvents(0);

        var noGroups = new SMAutoAssign();
        noGroups.setTeamAssignmentsAuthoritative(true);
        assertFalse(authenticate(noGroups, false).getAuthPermissions().getPermissions().contains(TEAM_PERMISSION));
        verifyPermissionEvents(1);
    }

    @NotNull
    private SMAuthInfo authenticate(@NotNull SMAutoAssign assignment, boolean autoProvision) throws DBException {
        var credentials = Map.<String, Object>of(LocalAuthProvider.CRED_USER, userId);
        var provider = Mockito.mock(LdapAuthProvider.class);
        Mockito.when(provider.authExternalUser(Mockito.any(), Mockito.isNull(), Mockito.eq(credentials))).thenReturn(credentials);
        Mockito.when(provider.validateLocalAuth(
            Mockito.any(), Mockito.any(), Mockito.isNull(), Mockito.eq(credentials), Mockito.nullable(String.class)
        )).thenReturn(userId);
        Mockito.when(provider.isAutoUserProvisioningEnabled(Mockito.isNull())).thenReturn(autoProvision);
        Mockito.when(provider.getExternalTeamIdMetadataFieldName()).thenReturn(GROUP_METADATA);
        Mockito.when(provider.detectAutoAssignments(Mockito.any(), Mockito.isNull(), Mockito.eq(credentials))).thenReturn(assignment);

        // Reuse the enabled local descriptor's credential schema; the test provider supplies the external identity and groups.
        var registry = Mockito.spy(WebAuthProviderRegistry.getInstance());
        var descriptor = Mockito.spy(registry.getAuthProvider(LocalAuthProvider.PROVIDER_ID));
        Mockito.doReturn(provider).when(descriptor).getInstance();
        Mockito.doReturn(descriptor).when(registry).getAuthProvider(LocalAuthProvider.PROVIDER_ID);
        var eventApplication = Mockito.mock(ServletApplication.class);
        Mockito.when(eventApplication.getEventController()).thenReturn(events);

        try (var providers = Mockito.mockStatic(WebAuthProviderRegistry.class, Mockito.withSettings().mockMaker("mock-maker-inline"));
             var application = Mockito.mockStatic(
                 ServletAppUtils.class,
                 Mockito.withSettings().mockMaker("mock-maker-inline").defaultAnswer(Mockito.CALLS_REAL_METHODS)
             )) {
            providers.when(WebAuthProviderRegistry::getInstance).thenReturn(registry);
            application.when(ServletAppUtils::getServletApplication).thenReturn(eventApplication);
            var auth = controller.authenticate(
                UUID.randomUUID().toString(), null, Map.of(), WebSession.CB_SESSION_TYPE,
                LocalAuthProvider.PROVIDER_ID, null, credentials, false
            );
            assertEquals(SMAuthStatus.SUCCESS, auth.getAuthStatus());
            assertEquals(userId, auth.getAuthPermissions().getUserId());
            return auth;
        }
    }

    private void verifyPermissionEvents(int count) {
        Mockito.verify(events, Mockito.times(count)).addEvent(Mockito.argThat(event ->
            event instanceof WSSubjectPermissionEvent permissionsEvent
                && permissionsEvent.getSubjectType() == SMSubjectType.user
                && userId.equals(permissionsEvent.getSubjectId())
        ));
    }
}
