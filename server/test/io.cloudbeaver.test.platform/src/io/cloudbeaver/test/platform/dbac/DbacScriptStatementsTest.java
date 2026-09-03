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
package io.cloudbeaver.test.platform.dbac;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

/**
 * Unit tests of the statement splitter the translation characterization depends on.
 * <p>
 * These exist because the splitter is the instrument the other tests measure with. A splitter that
 * silently kept a leading comment would make a passing characterization test meaningless, so its exact
 * behaviour is pinned here rather than assumed.
 */
public class DbacScriptStatementsTest {

    @Test
    public void blankLineThenCommentThenSql() {
        Assertions.assertEquals(
            "SELECT 1",
            DbacScriptStatements.stripLeading("\n-- a comment\nselect 1\n"));
    }

    @Test
    public void severalBlankLinesAndCommentsInAnyOrder() {
        Assertions.assertEquals(
            "SELECT 1",
            DbacScriptStatements.stripLeading("\n\n-- one\n\n-- two\n\n   \n-- three\nselect 1"));
    }

    /**
     * A semicolon inside a comment has already split the script by the time this runs, so the fragment
     * that reaches the splitter can be comment-only. It must collapse to nothing, not to a fake statement.
     */
    @Test
    public void commentContainingSemicolonLeavesNoStatement() {
        // The piece before the semicolon is comment only and collapses to nothing.
        Assertions.assertEquals("", DbacScriptStatements.stripLeading("-- splits on '"));
        // The piece after it starts mid-comment, so its first line is not recognisable as a comment and
        // the fragment survives as garbage. That is the hazard, stated plainly rather than wished away.
        Assertions.assertEquals(
            "' -- AND CONTINUES", DbacScriptStatements.stripLeading("'\n-- and continues\n"));

        List<String> statements = DbacScriptStatements.split(
            "-- the runner splits on ';', so beware\nSELECT 1;\n");
        Assertions.assertEquals(
            List.of("', SO BEWARE SELECT 1"), statements,
            "A comment semicolon does split the script - this is exactly the hazard the "
                + "characterization test has to rule out for the real create script");
    }

    /** Only the leading run is removed. Anything from the first SQL token on is preserved. */
    @Test
    public void contentAfterTheFirstSqlTokenIsNeverRemoved() {
        Assertions.assertEquals(
            "SELECT 1 -- TRAILING NOTE",
            DbacScriptStatements.stripLeading("-- leading\nselect 1\n-- trailing note"));
        Assertions.assertEquals(
            "CREATE TABLE T ( A INT ) -- NOTE",
            DbacScriptStatements.stripLeading("\n-- head\ncreate table t (\n  a int\n) -- note"));
    }

    @Test
    public void blankPiecesAreDropped() {
        Assertions.assertEquals(
            List.of("SELECT 1", "SELECT 2"),
            DbacScriptStatements.split("select 1;\n\n;   ;\nselect 2;\n"));
    }

    @Test
    public void forbiddenFamiliesAreRecognised() {
        for (String prefix : DbacScriptStatements.FORBIDDEN_STATEMENT_PREFIXES) {
            String statement = DbacScriptStatements.stripLeading(prefix + " something");
            Assertions.assertEquals(
                prefix, DbacScriptStatements.forbiddenFamilyOf(statement),
                "Statement family must be rejected: " + prefix);
        }
        Assertions.assertNull(DbacScriptStatements.forbiddenFamilyOf("SELECT 1"));
        // A column or table whose name merely starts with a forbidden word is not a forbidden statement.
        Assertions.assertNull(DbacScriptStatements.forbiddenFamilyOf("SELECT CREATED_AT FROM T"));
        Assertions.assertNull(DbacScriptStatements.forbiddenFamilyOf("SELECT UPDATER FROM T"));
    }
}
