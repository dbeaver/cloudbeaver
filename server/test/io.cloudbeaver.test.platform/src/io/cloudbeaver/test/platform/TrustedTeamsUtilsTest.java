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

import io.cloudbeaver.service.security.TrustedTeamsUtils;
import org.jkiss.dbeaver.model.security.user.SMTeam;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

public class TrustedTeamsUtilsTest {
    private static final SMTeam[] TEAMS = {team("admin"), team("user")};

    @Test
    public void valuesMatchingTeamIdsAreKept() {
        var result = TrustedTeamsUtils.filterExistingTeams(List.of("user", "admin"), TEAMS);

        Assertions.assertEquals(List.of("user", "admin"), result.teamIds());
        Assertions.assertTrue(result.unknownValues().isEmpty());
    }

    @Test
    public void unknownValuesAreReportedInsteadOfFailing() {
        var result = TrustedTeamsUtils.filterExistingTeams(List.of("user", "qsync", ""), TEAMS);

        Assertions.assertEquals(List.of("user"), result.teamIds());
        Assertions.assertEquals(List.of("qsync", ""), result.unknownValues());
    }

    @Test
    public void teamIdIsMatchedExactly() {
        var result = TrustedTeamsUtils.filterExistingTeams(List.of("Admin", " admin"), TEAMS);

        Assertions.assertTrue(result.teamIds().isEmpty());
        Assertions.assertEquals(2, result.unknownValues().size());
    }

    @Test
    public void duplicatedValuesGiveOneTeam() {
        var result = TrustedTeamsUtils.filterExistingTeams(List.of("admin", "admin"), TEAMS);

        Assertions.assertEquals(List.of("admin"), result.teamIds());
    }

    @Test
    public void noValuesGiveNoTeams() {
        var result = TrustedTeamsUtils.filterExistingTeams(List.of(), TEAMS);

        Assertions.assertTrue(result.teamIds().isEmpty());
        Assertions.assertTrue(result.unknownValues().isEmpty());
    }

    private static SMTeam team(String id) {
        return new SMTeam(id, id, id, false);
    }
}
