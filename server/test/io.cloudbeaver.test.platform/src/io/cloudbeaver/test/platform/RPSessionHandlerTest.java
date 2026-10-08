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

import io.cloudbeaver.service.auth.RPSessionHandler;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

public class RPSessionHandlerTest {

    @Test
    public void defaultDelimiterSplitsTeams() {
        Assertions.assertEquals(
            List.of("user", "admin"),
            RPSessionHandler.splitTeams("user|admin", RPSessionHandler.DEFAULT_TEAM_DELIMITER)
        );
    }

    @Test
    public void singleCharacterDelimiterIsTakenLiterally() {
        // "|" and "." are regular expression operators, they used to split the value into single characters
        Assertions.assertEquals(List.of("user", "admin"), RPSessionHandler.splitTeams("user|admin", "|"));
        Assertions.assertEquals(List.of("user", "admin"), RPSessionHandler.splitTeams("user.admin", "."));
        Assertions.assertEquals(List.of("user", "admin"), RPSessionHandler.splitTeams("user,admin", ","));
    }

    @Test
    public void longerDelimiterStaysARegularExpression() {
        Assertions.assertEquals(List.of("a", "b", "c"), RPSessionHandler.splitTeams("a;b,c", "[;,]"));
    }

    @Test
    public void blankValuesAreDropped() {
        Assertions.assertEquals(List.of(), RPSessionHandler.splitTeams("", "|"));
        Assertions.assertEquals(List.of("user", "admin"), RPSessionHandler.splitTeams(" user || admin |", "|"));
    }
}
