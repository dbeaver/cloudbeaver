/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.meta.Property;

/**
 * WebSQLExecuteInfo.
 */
public class WebSQLExecuteInfo {

    private static final Log log = Log.getLog(WebSQLExecuteInfo.class);

    private String statusMessage;
    private long duration;
    private String filterText;
    private String fullQuery;
    private WebSQLQueryResults[] results;

    @Property
    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }

    @Property
    public long getDuration() {
        return duration;
    }

    public void setDuration(long duration) {
        this.duration = duration;
    }

    @Property
    public String getFilterText() {
        return filterText;
    }

    public void setFilterText(String filterText) {
        this.filterText = filterText;
    }

    public void setFullQuery(String fullQuery) {
        this.fullQuery = fullQuery;
    }

    @Property
    public String getFullQuery() {
        return fullQuery;
    }

    @Property
    public String getOriginalQuery() {
        //TODO implement
        return null;
    }

    @Property
    public WebSQLQueryResults[] getResults() {
        return results;
    }

    public void setResults(WebSQLQueryResults[] results) {
        this.results = results;
    }
}
