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
package io.cloudbeaver.service;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.DBException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * DBWSessionHandler
 */
public interface DBWSessionHandler<SESSION extends WebSession> {

    boolean handleSessionOpen(SESSION webSession, HttpServletRequest request, HttpServletResponse response)
        throws DBException, IOException;

    default boolean handleSessionAuth(SESSION webSession)
        throws DBException, IOException
    {
        return false;
    }

    boolean handleSessionClose(SESSION webSession)
        throws DBException, IOException;

}
