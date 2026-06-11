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
package io.cloudbeaver.model.lsp;

import org.eclipse.lsp4j.*;
import org.jkiss.dbeaver.ext.h2.model.H2SQLDialect;
import org.jkiss.dbeaver.model.lsp.context.ContextAwareDocument;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public class DBLTextDocumentServiceContextTest extends H2DataSourceTest {

    @Test
    public void shouldInitH2Context() {
        TextDocumentItem document = DocumentServiceTestUtils.createAndSaveDocument(
            service, "select * from table", project.getId(), DocumentServiceTestUtils.BASIC_RESOURCE_PATH
        );

        ContextAwareDocument contextedDocument = DocumentServiceTestUtils.getDocument(service, document.getUri());
        Assertions.assertNotNull(contextedDocument);
        Assertions.assertEquals(dataSourceDescriptor.getDataSource(), contextedDocument.getDataSource());
        Assertions.assertNotNull(contextedDocument.getExecutionContext());
        Assertions.assertEquals(dataSourceDescriptor.getDataSource(), contextedDocument.getExecutionContext().getDataSource());
        Assertions.assertTrue(contextedDocument.getSyntaxManager().getDialect() instanceof H2SQLDialect);
        Assertions.assertNotNull(contextedDocument.getRuleManager());
    }

    @Test
    public void shouldFormatQuery() throws ExecutionException, InterruptedException {
        String query = """
            INSERT INTO users (id, profile) VALUES (1,'{"name": "JohnDoe"}'::jsonb) ON CONFLICT (id)
            DO UPDATE SET profile = users.profile || EXCLUDED.profile RETURNING id, profile->>'name' AS name;
            """.trim();
        DocumentFormattingParams formattingParams = DocumentServiceTestUtils.setupDocumentAndBuildFormattingParams(service, query);

        CompletableFuture<List<? extends TextEdit>> future = service.formatting(formattingParams);

        TextEdit edit = future.get().getFirst();
        String expectedQuery = """
            INSERT
                INTO
                users (id,
                profile)
            VALUES (1,
            '{"name": "JohnDoe"}'::jsonb) ON
            CONFLICT (id)
            DO
            UPDATE
            SET
                profile = users.profile || EXCLUDED.profile RETURNING id,
                profile->>'name' AS name;
            """.trim();

        Assertions.assertEquals(expectedQuery.trim(), edit.getNewText());
        Position start = edit.getRange().getStart();
        Assertions.assertEquals(0, start.getLine());
        Assertions.assertEquals(0, start.getCharacter());

        Position end = edit.getRange().getEnd();
        Assertions.assertEquals(1, end.getLine());
        Assertions.assertEquals(97, end.getCharacter());
    }

    @Test
    public void shouldReturnEmptyCompletionsForInvalidPosition() throws ExecutionException, InterruptedException {
        String query = "SEL";
        ContextAwareDocument document = DocumentServiceTestUtils.createAndSaveDocument(
            service, query, project.getId(), DocumentServiceTestUtils.BASIC_RESOURCE_PATH
        );
        TextDocumentIdentifier documentId = new TextDocumentIdentifier(document.getUri());
        CompletionParams completionParams = new CompletionParams(documentId, new Position(1, 42));

        CompletionList completions = service.completion(completionParams).get().getRight();

        Assertions.assertNotNull(completions);
        Assertions.assertTrue(completions.getItems().isEmpty());
    }

    @Test
    public void shouldSuggestKeywordCompletion() throws ExecutionException, InterruptedException {
        String query = "SEL";
        ContextAwareDocument document = DocumentServiceTestUtils.createAndSaveDocument(
            service, query, project.getId(), DocumentServiceTestUtils.BASIC_RESOURCE_PATH
        );
        TextDocumentIdentifier documentId = new TextDocumentIdentifier(document.getUri());
        CompletionParams completionParams = new CompletionParams(documentId, new Position(0, 3));

        CompletionList completions = service.completion(completionParams).get().getRight();

        Assertions.assertNotNull(completions);
        Assertions.assertFalse(completions.getItems().isEmpty());
        Assertions.assertEquals("SELECT", completions.getItems().getFirst().getLabel());
    }

    @Test
    public void shouldSuggestMultilineKeywordCompletion() throws ExecutionException, InterruptedException {
        String query = """
            SELECT *
                FR
            """;
        ContextAwareDocument document = DocumentServiceTestUtils.createAndSaveDocument(
            service, query, project.getId(), DocumentServiceTestUtils.BASIC_RESOURCE_PATH
        );
        TextDocumentIdentifier documentId = new TextDocumentIdentifier(document.getUri());
        CompletionParams completionParams = new CompletionParams(documentId, new Position(1, 6));

        CompletionList completions = service.completion(completionParams).get().getRight();

        Assertions.assertNotNull(completions);
        Assertions.assertEquals(1, completions.getItems().size());
        Assertions.assertEquals("FROM", completions.getItems().getFirst().getLabel());
    }
}
