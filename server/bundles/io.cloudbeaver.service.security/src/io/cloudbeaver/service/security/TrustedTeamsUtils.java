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
package io.cloudbeaver.service.security;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.security.user.SMTeam;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Helpers for the teams a trusted authentication provider (e.g. a reverse proxy) sends for a user.
 */
public final class TrustedTeamsUtils {

    /**
     * @param teamIds       the values that are the id of an existing team
     * @param unknownValues the values that match no team
     */
    public record TrustedTeams(@NotNull List<String> teamIds, @NotNull List<String> unknownValues) {
    }

    private TrustedTeamsUtils() {
    }

    /**
     * Keeps the values that are the id of an existing team. The others are reported instead of failing the login
     * on a foreign key error when the teams of the user are saved.
     */
    @NotNull
    public static TrustedTeams filterExistingTeams(@NotNull Collection<String> values, @NotNull SMTeam[] allTeams) {
        Set<String> existingTeamIds = new LinkedHashSet<>();
        for (SMTeam team : allTeams) {
            existingTeamIds.add(team.getTeamId());
        }
        Set<String> teamIds = new LinkedHashSet<>();
        List<String> unknownValues = new ArrayList<>();
        for (String value : values) {
            if (existingTeamIds.contains(value)) {
                teamIds.add(value);
            } else {
                unknownValues.add(value);
            }
        }
        return new TrustedTeams(new ArrayList<>(teamIds), unknownValues);
    }
}
