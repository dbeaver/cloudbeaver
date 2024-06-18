/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2024 DBeaver Corp and others
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

import io.cloudbeaver.DBWebException;
import org.jkiss.dbeaver.model.sql.DBQuotaException;
import org.jkiss.dbeaver.model.sql.SQLState;

import java.io.PrintWriter;
import java.io.StringWriter;

/**
 * Web driver configuration
 */
public class WebServerError {

    private final String message;
    private final String stackTrace;
    private final String errorType;
    private final String errorCode;

    public WebServerError(Throwable ex) {
        this.message = ex.getMessage();
        StringWriter buf = new StringWriter();
        ex.printStackTrace(new PrintWriter(buf, true));
        this.stackTrace = buf.toString();
        errorCode = String.valueOf(SQLState.getCodeFromException(ex));
        errorType = ex instanceof DBQuotaException ? DBWebException.ERROR_CODE_QUOTA_EXCEEDED : null;
    }

    public String getMessage() {
        return message;
    }

    public String getStackTrace() {
        return stackTrace;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorType() {
        return errorType;
    }

    public WebServerError getCausedBy() {
        return null;
    }

}
