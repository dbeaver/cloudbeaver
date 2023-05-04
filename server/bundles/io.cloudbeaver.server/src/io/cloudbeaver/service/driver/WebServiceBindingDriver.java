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
package io.cloudbeaver.service.driver;

import graphql.schema.DataFetchingEnvironment;
import io.cloudbeaver.DBWebException;
import io.cloudbeaver.server.CBApplication;
import io.cloudbeaver.service.DBWBindingContext;
import io.cloudbeaver.service.DBWServiceBindingServlet;
import io.cloudbeaver.service.DBWServletContext;
import io.cloudbeaver.service.WebServiceBindingBase;
import io.cloudbeaver.service.driver.impl.WebServiceDriver;
import org.jkiss.dbeaver.DBException;

/**
 * Web service implementation
 */
public class WebServiceBindingDriver extends WebServiceBindingBase<DBWServiceDriver> implements DBWServiceBindingServlet<CBApplication> {

    public WebServiceBindingDriver() {
        super(DBWServiceDriver.class, new WebServiceDriver(), "schema/service.driver.graphqls");
    }

    @Override
    public void bindWiring(DBWBindingContext model) throws DBWebException {
        model.getQueryType()
            .dataFetcher("driverList", env -> getService(env).getDriverList(getWebSession(env), env.getArgument("id")))
            .dataFetcher("driverProviderList", env -> getService(env).getDriverProviderList(getWebSession(env)))
        ;
        model.getMutationType()
            .dataFetcher("createDriver", env -> getService(env).createDriver(getWebSession(env), getDriverConfig(env)))
            .dataFetcher("updateDriver", env -> getService(env).updateDriver(getWebSession(env), getDriverConfig(env)))
            .dataFetcher("deleteDriver", env -> getService(env).deleteDriver(getWebSession(env), env.getArgument("id")))
            .dataFetcher("deleteDriverLibraries", env -> getService(env).deleteDriverLibraries(
                getWebSession(env),
                env.getArgument("driverId"),
                env.getArgument("libraryIds")))
        ;
    }

    private WebDatabaseDriverConfig getDriverConfig(DataFetchingEnvironment env) {
        return new WebDatabaseDriverConfig(env.getArgument("config"));
    }

    @Override
    public void addServlets(CBApplication application, DBWServletContext servletContext) throws DBException {
        servletContext.addServlet(
            "driversLibraryServlet",
            new WebFileLoaderServlet(application, getServiceImpl()),
            application.getServicesURI() + "drivers/library/*"
        );
    }
}
