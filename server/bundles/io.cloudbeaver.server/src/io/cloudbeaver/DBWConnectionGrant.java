/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
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
package io.cloudbeaver;

public class DBWConnectionGrant {
    private String connectionId;
    private String subjectId;
    private DBWSecuritySubjectType subjectType;

    public DBWConnectionGrant(String connectionId, String subjectId, DBWSecuritySubjectType subjectType) {
        this.connectionId = connectionId;
        this.subjectId = subjectId;
        this.subjectType = subjectType;
    }

    public String getConnectionId() {
        return connectionId;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public DBWSecuritySubjectType getSubjectType() {
        return subjectType;
    }
}
