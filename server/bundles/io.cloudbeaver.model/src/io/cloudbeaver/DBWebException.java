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
package io.cloudbeaver;

import graphql.ErrorClassification;
import graphql.ErrorType;
import graphql.GraphQLError;
import graphql.language.SourceLocation;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSource;
import org.jkiss.dbeaver.utils.GeneralUtils;
import org.jkiss.utils.CommonUtils;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The activator class controls the plug-in life cycle
 */
public class DBWebException extends DBException implements GraphQLError {

    public static final String ERROR_CODE_SESSION_EXPIRED = "sessionExpired";
    public static final String ERROR_CODE_ACCESS_DENIED = "accessDenied";
    public static final String ERROR_CODE_LICENSE_DENIED = "licenseRequired";
    public static final String ERROR_CODE_IDENT_REQUIRED = "identRequired";
    public static final String ERROR_CODE_AUTH_REQUIRED = "authRequired";
    public static final String ERROR_CODE_QUOTA_EXCEEDED = "quotaExceeded";

    private List<Object> path;
    private List<SourceLocation> locations;
    private String webErrorCode;

    public DBWebException(String message) {
        super(message);
    }

    public DBWebException(String message, String errorCode) {
        super(message);
        this.webErrorCode = errorCode;
    }

    public DBWebException(String message, Throwable cause) {
        super(makeMessage(message, cause), cause);
    }

    public DBWebException(String message, String errorCode, Throwable cause) {
        this(message, cause);
        this.webErrorCode = errorCode;
    }

    public DBWebException(Throwable cause, DBPDataSource dataSource) {
        super(cause, dataSource);
    }

    public DBWebException(String message, Throwable cause, DBPDataSource dataSource) {
        super(makeMessage(message, cause), cause, dataSource);
    }

    public String getWebErrorCode() {
        return webErrorCode;
    }

    @Override
    public List<Object> getPath() {
        return path;
    }

    public void setPath(List<Object> path) {
        this.path = path;
    }

    @Override
    public List<SourceLocation> getLocations() {
        return locations;
    }

    public void setLocations(List<SourceLocation> locations) {
        this.locations = locations;
    }

    @Override
    public ErrorClassification getErrorType() {
        return ErrorType.DataFetchingException;
    }

    @Override
    public Map<String, Object> getExtensions() {
        StringWriter buf = new StringWriter();
        GeneralUtils.getRootCause(this).printStackTrace(new PrintWriter(buf, true));

        Map<String, Object> extensions = new LinkedHashMap<>();
        String stString = buf.toString();
        // Cur redundant stacktrace before CB handlers
        int divPos = stString.indexOf("WebServiceBindingBase");
        if (divPos == -1) {
            divPos = stString.indexOf("GraphQLEndpoint");
        }
        if (divPos != -1) {
            for (int i = divPos; i >= 0; i--) {
                if (stString.charAt(i) == '\n') {
                    divPos = i;
                    break;
                }
            }
            stString = stString.substring(0, divPos);
        }
        divPos = stString.indexOf(':');
        if (divPos != -1) {
            String exceptionClass = stString.substring(0, divPos).trim();
            extensions.put("exceptionClass", exceptionClass);
            //stString = stString.substring(divPos + 1).trim();
        }
        extensions.put("stackTrace", stString.trim());
        int errorCode = getErrorCode();
        if (errorCode != ERROR_CODE_NONE) {
            extensions.put("errorCode", errorCode);
        }
        if (!CommonUtils.isEmpty(webErrorCode)) {
            extensions.put("webErrorCode", webErrorCode);
        }
        String databaseState = getDatabaseState();
        if (databaseState != null) {
            extensions.put("databaseState", databaseState);
        }

        return extensions;
    }

    private static String makeMessage(String message, Throwable cause) {
        if (CommonUtils.isEmpty(message)) {
            if (cause != null) {
                if (cause.getMessage() != null) {
                    return cause.getMessage();
                }
                return cause.getClass().getName();
            }
            return "Unknown internal error";
        }
        if (CommonUtils.equalObjects(message, cause.getMessage())) {
            return message;
        }
        return message + ":\n" + cause.getMessage();
    }

}
