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
 * Maps values sent by an external system (a reverse proxy header, directory groups) to CloudBeaver teams.
 */
public final class TeamMappingUtils {

    /**
     * Teams found for the values of a trusted header and the values that match no team.
     */
    public record TrustedTeams(@NotNull List<String> teamIds, @NotNull List<String> unknownValues) {
    }

    private TeamMappingUtils() {
    }

    /**
     * Resolves every value to teams. A value is either the id of a team or, if no team has this id, the value of the
     * team meta parameter {@code groupMetaParameter}, which lets a team stand for a group of the external system whose
     * name is not usable as a team id. Values that match nothing are reported, not turned into an error.
     */
    @NotNull
    public static TrustedTeams resolveTrustedTeams(
        @NotNull Collection<String> values,
        @NotNull SMTeam[] allTeams,
        @NotNull String groupMetaParameter
    ) {
        Set<String> teamIds = new LinkedHashSet<>();
        List<String> unknownValues = new ArrayList<>();
        for (String rawValue : values) {
            String value = rawValue == null ? "" : rawValue.trim();
            if (value.isEmpty()) {
                continue;
            }
            boolean found = false;
            for (SMTeam team : allTeams) {
                if (value.equals(team.getTeamId())) {
                    teamIds.add(team.getTeamId());
                    found = true;
                }
            }
            if (!found) {
                for (SMTeam team : allTeams) {
                    if (value.equals(team.getMetaParameters().get(groupMetaParameter))) {
                        teamIds.add(team.getTeamId());
                        found = true;
                    }
                }
            }
            if (!found) {
                unknownValues.add(value);
            }
        }
        return new TrustedTeams(new ArrayList<>(teamIds), unknownValues);
    }
}
