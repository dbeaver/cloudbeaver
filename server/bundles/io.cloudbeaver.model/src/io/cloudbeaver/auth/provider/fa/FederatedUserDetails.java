/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp
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

package io.cloudbeaver.auth.provider.fa;

import io.cloudbeaver.model.user.WebUser;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.meta.Property;

public class FederatedUserDetails implements DBPObject {

    @NotNull
    private AbstractSessionFederated session;
    @NotNull
    private WebUser user;

    public FederatedUserDetails(@NotNull AbstractSessionFederated session, @NotNull WebUser user) {
        this.session = session;
        this.user = user;
    }

    @NotNull
    public AbstractSessionFederated getSession() {
        return session;
    }

    @Property
    public String getEmail() {
        return user.getUserId();
    }

}
