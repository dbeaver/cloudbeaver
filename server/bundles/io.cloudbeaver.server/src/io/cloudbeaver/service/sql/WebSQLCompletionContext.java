/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.service.sql;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.*;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.sql.SQLSyntaxManager;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionContext;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionProposalBase;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionRequest;
import org.jkiss.dbeaver.model.sql.parser.SQLRuleManager;

import java.util.Map;

/**
 * Web SQL dialect.
 */
public class WebSQLCompletionContext implements SQLCompletionContext {

    private static final Log log = Log.getLog(WebSQLCompletionContext.class);

    private final WebSQLContextInfo sqlContext;

    public WebSQLCompletionContext(WebSQLContextInfo context) {
        this.sqlContext = context;
    }

    @Override
    public DBPDataSource getDataSource() {
        return sqlContext.getProcessor().getConnection().getDataSource();
    }

    @Override
    public DBCExecutionContext getExecutionContext() {
        return DBUtils.getDefaultContext(
            sqlContext.getProcessor().getConnection().getDataSource(),
            false);
    }

    @Override
    public SQLSyntaxManager getSyntaxManager() {
        return sqlContext.getProcessor().getSyntaxManager();
    }

    @Override
    public SQLRuleManager getRuleManager() {
        return sqlContext.getProcessor().getRuleManager();
    }

    @Override
    public boolean isUseFQNames() {
        return false;
    }

    @Override
    public boolean isReplaceWords() {
        return false;
    }

    @Override
    public boolean isShowServerHelp() {
        return false;
    }

    @Override
    public boolean isUseShortNames() {
        return false;
    }

    @Override
    public int getInsertCase() {
        return PROPOSAL_CASE_DEFAULT;
    }

    @Override
    public boolean isSearchProcedures() {
        return false;
    }

    @Override
    public boolean isSearchInsideNames() {
        return false;
    }

    @Override
    public boolean isSortAlphabetically() {
        return false;
    }

    @Override
    public boolean isSearchGlobally() {
        return false;
    }

    @Override
    public boolean isHideDuplicates() {
        return false;
    }

    @Override
    public SQLCompletionProposalBase createProposal(@NotNull SQLCompletionRequest request, @NotNull String displayString, @NotNull String replacementString, int cursorPosition, @Nullable DBPImage image, @NotNull DBPKeywordType proposalType, @Nullable String description, @Nullable DBPNamedObject object, @NotNull Map<String, Object> params) {
        return new SQLCompletionProposalBase(this, request.getWordDetector(), displayString, replacementString, cursorPosition, image, proposalType, description, object, params);
    }
}
