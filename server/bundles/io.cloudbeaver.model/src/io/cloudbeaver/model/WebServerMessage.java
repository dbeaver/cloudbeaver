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

import io.cloudbeaver.utils.CBModelConstants;

import java.io.PrintWriter;
import java.io.StringWriter;

/**
 * Web server message
 */
public class WebServerMessage {


    public enum MessageType {
        DEBUG,
        INFO,
        WARNING,
        ERROR
    }

    private final MessageType type;
    private final long time;
    private final String message;
    private final Throwable error;


    public WebServerMessage(MessageType type, String message) {
        this(type, message, null);
    }

    public WebServerMessage(Throwable error) {
        this(MessageType.ERROR, error.getMessage(), error);
    }

    public WebServerMessage(MessageType type, String message, Throwable error) {
        this.type = type;
        this.time = System.currentTimeMillis();
        this.message = message;
        this.error = error;
    }

    public MessageType getType() {
        return type;
    }

    public String getTime() {
        return CBModelConstants.ISO_DATE_FORMAT.format(time);
    }

    public String getMessage() {
        return message;
    }

    public String getStackTrace() {
        if (error != null) {
            StringWriter buf = new StringWriter();
            error.printStackTrace(new PrintWriter(buf, true));
            return buf.toString();
        }
        return null;
    }

}
