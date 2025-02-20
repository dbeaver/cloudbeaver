/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.data.DBDDocument;
import org.jkiss.dbeaver.model.exec.DBCException;

import java.io.StringWriter;
import java.util.Collections;
import java.util.Map;

/**
 * Web document wrapper.
 */
public class WebSQLDatabaseDocument {

    @NotNull
    private final WebSession webSession;
    @Nullable
    private DBDDocument document;

    WebSQLDatabaseDocument(@NotNull WebSession webSession, @Nullable DBDDocument document) {
        this.webSession = webSession;
        this.document = document;
    }

    public Object getDocument() {
        return document == null ? null : document.getRootNode();
    }

    public Object getId() {
        return document == null ? null : document.getDocumentId();
    }

    public Map<String, Object> getProperties() {
        return Collections.emptyMap();
    }

    public String getContentType() {
        return document == null ? null : document.getDocumentContentType();
    }

    public String getData() throws DBCException {
        if (document == null) {
            return null;
        }
        try {
            StringWriter writer = new StringWriter();
            document.serializeDocument(webSession.getProgressMonitor(), writer);
            return writer.toString();
        } catch (Exception e) {
            throw new DBCException("Error serializing document", e);
        }
    }

}
