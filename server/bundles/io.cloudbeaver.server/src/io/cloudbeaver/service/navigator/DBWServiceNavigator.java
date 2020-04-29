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
package io.cloudbeaver.service.navigator;

import io.cloudbeaver.DBWService;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebAction;
import io.cloudbeaver.model.WebConnectionInfo;
import io.cloudbeaver.model.session.WebSession;

import java.util.List;

/**
 * Web service API
 */
public interface DBWServiceNavigator extends DBWService {

    @WebAction
    List<WebNavigatorNodeInfo> getNavigatorNodeChildren(WebSession session, String parentPath, Integer offset, Integer limit, Boolean onlyFolders) throws DBWebException;

    @WebAction
    WebNavigatorNodeInfo getNavigatorNodeInfo(WebSession session, String nodePath) throws DBWebException;

    @WebAction
    boolean refreshNavigatorNode(WebSession session, String nodePath) throws DBWebException;

    @WebAction
    WebStructContainers getStructContainers(WebConnectionInfo connectionInfo, String catalog) throws DBWebException;
}
