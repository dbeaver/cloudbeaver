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
import org.jkiss.code.Nullable;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Decides how the teams of a user follow what an external provider says (e.g. the LDAP groups).
 * Only the teams assigned automatically are managed, the ones assigned by hand are never removed.
 */
public final class AutoAssignedTeams {

    /**
     * @param toAdd    teams to assign automatically
     * @param toRemove teams assigned automatically that the user is not entitled to any more
     */
    public record Plan(@NotNull List<String> toAdd, @NotNull List<String> toRemove) {
        public boolean isEmpty() {
            return toAdd.isEmpty() && toRemove.isEmpty();
        }
    }

    private AutoAssignedTeams() {
    }

    /**
     * @param currentTeams  teams of the user with the flag if the membership was assigned automatically
     * @param desiredTeams  teams the provider says the user belongs to
     * @param desiredIsComplete true if the provider is sure that the list is complete. Teams are removed only then,
     *                      a failed or partial lookup must not take anything away
     * @param defaultTeam   team every user has, always left as it is
     */
    @NotNull
    public static Plan plan(
        @NotNull Map<String, Boolean> currentTeams,
        @NotNull Collection<String> desiredTeams,
        boolean desiredIsComplete,
        @Nullable String defaultTeam
    ) {
        Set<String> desired = new LinkedHashSet<>(desiredTeams);
        desired.remove(defaultTeam);

        // A team the user already has stays as it is, a manual membership doesn't become an automatic one
        List<String> toAdd = new ArrayList<>();
        for (String teamId : desired) {
            if (!currentTeams.containsKey(teamId)) {
                toAdd.add(teamId);
            }
        }
        List<String> toRemove = new ArrayList<>();
        if (desiredIsComplete) {
            for (Map.Entry<String, Boolean> team : currentTeams.entrySet()) {
                if (Boolean.TRUE.equals(team.getValue()) && !desired.contains(team.getKey()) && !team.getKey().equals(defaultTeam)) {
                    toRemove.add(team.getKey());
                }
            }
        }
        return new Plan(toAdd, toRemove);
    }
}
