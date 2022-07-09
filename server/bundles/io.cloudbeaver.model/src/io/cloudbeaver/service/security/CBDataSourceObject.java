package io.cloudbeaver.service.security;

import org.jkiss.dbeaver.model.security.SMObjectType;

public class CBDataSourceObject extends SMObjectType {
    public static final CBDataSourceObject INSTANCE = new CBDataSourceObject();

    private CBDataSourceObject() {
        super("datasource");
    }
}
