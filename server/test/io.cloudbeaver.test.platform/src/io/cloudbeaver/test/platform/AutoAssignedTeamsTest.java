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

import io.cloudbeaver.service.security.AutoAssignedTeams;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AutoAssignedTeamsTest {
    private static final String DEFAULT_TEAM = "user";
    private static final boolean AUTO = true;
    private static final boolean MANUAL = false;

    @Test
    public void missingTeamsAreAdded() {
        var plan = AutoAssignedTeams.plan(teams("user", MANUAL), List.of("admin", "dev"), true, DEFAULT_TEAM);

        Assertions.assertEquals(List.of("admin", "dev"), plan.toAdd());
        Assertions.assertTrue(plan.toRemove().isEmpty());
    }

    @Test
    public void teamAssignedByHandIsNeverRemoved() {
        var plan = AutoAssignedTeams.plan(teams("user", MANUAL, "admin", MANUAL), List.of(), true, DEFAULT_TEAM);

        Assertions.assertTrue(plan.isEmpty());
    }

    @Test
    public void teamAssignedByHandStaysManualWhenTheProviderReportsItToo() {
        var plan = AutoAssignedTeams.plan(teams("user", MANUAL, "admin", MANUAL), List.of("admin"), true, DEFAULT_TEAM);

        Assertions.assertTrue(plan.isEmpty());
    }

    @Test
    public void automaticTeamIsRemovedWhenTheCompleteListDoesNotHaveItAnyMore() {
        var plan = AutoAssignedTeams.plan(
            teams("user", MANUAL, "admin", AUTO, "dev", AUTO),
            List.of("dev"),
            true,
            DEFAULT_TEAM
        );

        Assertions.assertEquals(List.of("admin"), plan.toRemove());
        Assertions.assertTrue(plan.toAdd().isEmpty());
    }

    @Test
    public void emptyCompleteListRemovesAllTheAutomaticTeams() {
        var plan = AutoAssignedTeams.plan(teams("user", MANUAL, "admin", AUTO, "dev", AUTO), List.of(), true, DEFAULT_TEAM);

        Assertions.assertEquals(List.of("admin", "dev"), plan.toRemove());
    }

    @Test
    public void nothingIsRemovedWhenTheListMayBeIncomplete() {
        var plan = AutoAssignedTeams.plan(teams("user", MANUAL, "admin", AUTO), List.of("dev"), false, DEFAULT_TEAM);

        Assertions.assertEquals(List.of("dev"), plan.toAdd());
        Assertions.assertTrue(plan.toRemove().isEmpty());
    }

    @Test
    public void defaultTeamIsLeftAlone() {
        // even if it was somehow marked as automatic, and the provider never adds it
        var plan = AutoAssignedTeams.plan(teams("user", AUTO), List.of("user", "admin"), true, DEFAULT_TEAM);

        Assertions.assertEquals(List.of("admin"), plan.toAdd());
        Assertions.assertTrue(plan.toRemove().isEmpty());
    }

    @Test
    public void nothingToDoWhenTeamsAlreadyMatch() {
        var plan = AutoAssignedTeams.plan(teams("user", MANUAL, "admin", AUTO), List.of("admin", "admin"), true, DEFAULT_TEAM);

        Assertions.assertTrue(plan.isEmpty());
    }

    private static Map<String, Boolean> teams(Object... teamAndOrigin) {
        Map<String, Boolean> result = new LinkedHashMap<>();
        for (int i = 0; i < teamAndOrigin.length; i += 2) {
            result.put((String) teamAndOrigin[i], (Boolean) teamAndOrigin[i + 1]);
        }
        return result;
    }
}
