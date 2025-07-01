/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
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
package io.cloudbeaver.service.ldap.auth.ssl;

import org.jkiss.code.NotNull;

import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;

/**
 * This class implementation correspond JNDI api.
 * Intention is creating isolated ssl socket factory for each user, not for general keystore
 */
public class LdapSslSocketFactory extends SSLSocketFactory {
    private static final ThreadLocal<SSLSocketFactory> tlsFactory = new ThreadLocal<>();

    public static void setContextFactory(@NotNull SSLContext ctx) {
        tlsFactory.set(ctx.getSocketFactory());
    }

    public static void removeContextFactory() {
        tlsFactory.remove();
    }

    //this method is called by internal api
    public static SSLSocketFactory getDefault() {
        SSLSocketFactory factory = tlsFactory.get();
        if (factory == null) {
            throw new IllegalStateException("No SSLContext set in current thread");
        }
        return factory;
    }

    public String[] getDefaultCipherSuites() {
        return getDefault().getDefaultCipherSuites();
    }

    public String[] getSupportedCipherSuites() {
        return getDefault().getSupportedCipherSuites();
    }

    public Socket createSocket(Socket s, String h, int p, boolean a) throws IOException {
        return getDefault().createSocket(s, h, p, a);
    }

    public Socket createSocket(String h, int p) throws IOException {
        return getDefault().createSocket(h, p);
    }

    public Socket createSocket(String h, int p, InetAddress l, int lp) throws IOException {
        return getDefault().createSocket(h, p, l, lp);
    }

    public Socket createSocket(InetAddress h, int p) throws IOException {
        return getDefault().createSocket(h, p);
    }

    public Socket createSocket(InetAddress h, int p, InetAddress l, int lp) throws IOException {
        return getDefault().createSocket(h, p, l, lp);
    }
}
