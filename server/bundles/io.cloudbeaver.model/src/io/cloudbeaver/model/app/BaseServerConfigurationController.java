/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp
 *
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */
package io.cloudbeaver.model.app;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public abstract class BaseServerConfigurationController implements WebServerConfigurationController {

    protected Gson getGson() {
        return getGsonBuilder().create();
    }

    protected abstract GsonBuilder getGsonBuilder();
}
