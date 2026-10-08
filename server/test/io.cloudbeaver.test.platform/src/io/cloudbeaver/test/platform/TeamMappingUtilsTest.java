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

import io.cloudbeaver.service.security.TeamMappingUtils;
import org.jkiss.dbeaver.model.security.user.SMTeam;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

public class TeamMappingUtilsTest {
    private static final String GROUP_META = "reverseProxy.group-name";

    @Test
    public void valuesMatchingTeamIdsAreResolved() {
        SMTeam[] teams = {team("admin", null), team("user", null)};

        var result = TeamMappingUtils.resolveTrustedTeams(List.of("user", "admin"), teams, GROUP_META);

        Assertions.assertEquals(List.of("user", "admin"), result.teamIds());
        Assertions.assertTrue(result.unknownValues().isEmpty());
    }

    @Test
    public void unknownValuesAreReportedInsteadOfFailing() {
        SMTeam[] teams = {team("admin", null), team("user", null)};

        var result = TeamMappingUtils.resolveTrustedTeams(List.of("user", "qsync"), teams, GROUP_META);

        Assertions.assertEquals(List.of("user"), result.teamIds());
        Assertions.assertEquals(List.of("qsync"), result.unknownValues());
    }

    @Test
    public void valueCanStandForATeamThroughItsGroupName() {
        SMTeam[] teams = {team("ops", "cn=ops,ou=groups,dc=example,dc=com"), team("user", null)};

        var result = TeamMappingUtils.resolveTrustedTeams(
            List.of("cn=ops,ou=groups,dc=example,dc=com", "user"),
            teams,
            GROUP_META
        );

        Assertions.assertEquals(List.of("ops", "user"), result.teamIds());
    }

    @Test
    public void teamIdWinsOverGroupNameAndNothingIsDuplicated() {
        SMTeam[] teams = {team("ops", "dev"), team("dev", null)};

        var result = TeamMappingUtils.resolveTrustedTeams(Arrays.asList("dev", " dev ", "", null), teams, GROUP_META);

        Assertions.assertEquals(List.of("dev"), result.teamIds());
        Assertions.assertTrue(result.unknownValues().isEmpty());
    }

    private static SMTeam team(String id, String groupName) {
        SMTeam team = new SMTeam(id, id, id, false);
        if (groupName != null) {
            team.setMetaParameter(GROUP_META, groupName);
        }
        return team;
    }
}
