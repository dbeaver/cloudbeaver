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
package io.cloudbeaver.model;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.meta.Property;

public class WebProjectInfo {
    private final WebSession session;
    private final DBPProject project;

    public WebProjectInfo(WebSession session, DBPProject project) {
        this.session = session;
        this.project = project;
    }

    public WebSession getSession() {
        return session;
    }

    public DBPProject getProject() {
        return project;
    }

    @Property
    public String getId() {
        return project.getId();
    }

    @Property
    public String getName() {
        return project.getName();
    }

    @Property
    public String getDescription() {
        return null;
    }

}
