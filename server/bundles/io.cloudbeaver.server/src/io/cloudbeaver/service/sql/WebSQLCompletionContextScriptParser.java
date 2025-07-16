/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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


import org.eclipse.jface.text.Document;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.runtime.DBRProgressMonitor;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionRequest;
import org.jkiss.dbeaver.model.sql.parser.SQLParserContext;
import org.jkiss.dbeaver.model.sql.parser.SQLScriptParser;
import org.jkiss.dbeaver.model.sql.semantics.SQLDocumentSyntaxContext;
import org.jkiss.dbeaver.model.sql.semantics.SQLQueryModelRecognizer;
import org.jkiss.dbeaver.model.sql.semantics.SQLQueryRecognitionContext;
import org.jkiss.dbeaver.model.sql.semantics.SQLScriptItemAtOffset;
import org.jkiss.dbeaver.model.sql.semantics.completion.SQLQueryCompletionContext;

public class WebSQLCompletionContextScriptParser {

    @NotNull
    public static SQLQueryCompletionContext obtainCompletionContext(
        DBRProgressMonitor monitor,
        @NotNull String query,
        int position,
        SQLCompletionRequest request
    ) {
        Document document = new Document(query);
        SQLDocumentSyntaxContext syntaxContext = new SQLDocumentSyntaxContext();
        SQLParserContext parserContext = new SQLParserContext(
            request.getContext().getDataSource(),
            request.getContext().getSyntaxManager(),
            request.getContext().getRuleManager(),
            document
        );
        var scriptItems = SQLScriptParser.parseScript(
            parserContext.getDataSource(),
            parserContext.getDialect(),
            parserContext.getPreferenceStore(),
            document.get()
        );
        if (scriptItems != null) {
            for (var item : scriptItems) {
                var model = SQLQueryModelRecognizer.recognizeQuery(
                    new SQLQueryRecognitionContext(
                        monitor,
                        request.getContext().getExecutionContext(),
                        true,
                        false,
                        request.getContext().getSyntaxManager(),
                        request.getContext().getDataSource().getSQLDialect()
                    ),
                    item.getOriginalText()
                );
                syntaxContext.registerScriptItemContext(
                    item.getOriginalText(),
                    model,
                    item.getOffset(),
                    item.getLength(),
                    true
                );
            }
        }

        SQLScriptItemAtOffset scriptItem = syntaxContext.findScriptItem(position);
        if (scriptItem != null) {
            scriptItem.item.setHasContextBoundaryAtLength(false);
            return SQLQueryCompletionContext.prepareCompletionContext(
                scriptItem,
                position,
                request.getContext().getExecutionContext(),
                request.getContext().getDataSource().getSQLDialect()
            );
        } else {
            return SQLQueryCompletionContext.prepareOffquery(0, position);
        }
    }
}
