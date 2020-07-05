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
package io.cloudbeaver.service.core;

import io.cloudbeaver.DBWService;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.*;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * Web service API
 */
public interface DBWServiceCore extends DBWService {

    @WebAction(requirePermissions = {})
    WebServerConfig getServerConfig() throws DBWebException;

    @WebAction
    List<WebDatabaseDriverConfig> getDriverList(WebSession webSession, String driverId) throws DBWebException;

    @WebAction
    List<WebDatabaseAuthModel> getAuthModels(WebSession webSession);

    @WebAction
    List<WebDataSourceConfig> getGlobalDataSources() throws DBWebException;

    @WebAction(requirePermissions = {})
    String[] getSessionPermissions(WebSession webSession) throws DBWebException;

    ///////////////////////////////////////////
    // Session

    @WebAction(requirePermissions = {})
    WebSession openSession(WebSession webSession) throws DBWebException;

    @WebAction(requirePermissions = {})
    WebSession getSessionState(WebSession webSession) throws DBWebException;

    @WebAction
    List<WebServerMessage> readSessionLog(WebSession webSession, Integer maxEntries, Boolean clearEntries) throws DBWebException;

    @WebAction(requirePermissions = {})
    boolean closeSession(HttpServletRequest request) throws DBWebException;

    @WebAction(requirePermissions = {})
    boolean touchSession(HttpServletRequest request) throws DBWebException;

    @WebAction
    boolean changeSessionLanguage(WebSession webSession, String locale) throws DBWebException;

    ///////////////////////////////////////////
    // Connections

    @WebAction
    WebConnectionInfo getConnectionState(WebSession webSession, String connectionId) throws DBWebException;

    @WebAction
    WebConnectionInfo openConnection(WebSession webSession, WebConnectionConfig connectionConfig) throws DBWebException;

    @WebAction
    WebConnectionInfo createConnection(WebSession webSession, WebConnectionConfig connectionConfig) throws DBWebException;

    @WebAction
    WebConnectionInfo testConnection(WebSession webSession, WebConnectionConfig connectionConfig) throws DBWebException;

    @WebAction
    boolean closeConnection(WebSession webSession, String connectionId) throws DBWebException;

    ///////////////////////////////////////////
    // Navigator settings

    boolean setConnectionNavigatorSettings(WebSession webSession, String id, DBNBrowseSettings settings) throws DBWebException;

    boolean setDefaultNavigatorSettings(WebSession webSession, DBNBrowseSettings settings);

    ///////////////////////////////////////////
    // Async tasks

    @WebAction
    WebAsyncTaskInfo getAsyncTaskStatus(WebSession webSession, String taskId) throws DBWebException;

    @WebAction
    boolean cancelAsyncTask(WebSession webSession, String taskId) throws DBWebException;

}
