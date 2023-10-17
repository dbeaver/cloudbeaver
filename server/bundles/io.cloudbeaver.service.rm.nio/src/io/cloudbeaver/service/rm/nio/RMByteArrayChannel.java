/*
 * Copyright (c) 2018, 2020, Oracle and/or its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.  Oracle designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Oracle in the LICENSE file that accompanied this code.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Oracle, 500 Oracle Parkway, Redwood Shores, CA 94065 USA
 * or visit www.oracle.com if you need additional information or have any
 * questions.
 */

package io.cloudbeaver.service.rm.nio;

import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.nio.ByteArrayChannel;

import java.io.IOException;
import java.nio.file.OpenOption;
import java.util.Set;

// copy of jdk.nio.zipfs.ByteArrayChannel
public class RMByteArrayChannel extends ByteArrayChannel {

    private final RMPath rmPath;

    public RMByteArrayChannel(byte[] buf, RMPath rmPath, Set<? extends OpenOption> options) {
        super(buf, options);
        this.rmPath = rmPath;
    }

    @Override
    protected void createNewFile() throws IOException {
        try {
            rmPath.getFileSystem().getRmController().createResource(
                rmPath.getRmProjectId(), rmPath.getResourcePath(), false
            );
        } catch (DBException e) {
            throw new IOException("Failed to create new file: " + e.getMessage(), e);
        }
    }

    @Override
    protected void writeToFile() throws IOException {
        try {
            rmPath.getFileSystem().getRmController().setResourceContents(
                rmPath.getRmProjectId(), rmPath.getResourcePath(), buf, true
            );
        } catch (DBException e) {
            throw new IOException("Failed to write data to the file: " + e.getMessage(), e);
        }
    }

    @Override
    protected void deleteFile() throws IOException {
        try {
            rmPath.getFileSystem().getRmController().deleteResource(
                rmPath.getRmProjectId(), rmPath.getResourcePath(), true
            );
        } catch (DBException e) {
            throw new IOException("Failed to delete file: " + e.getMessage(), e);
        }
    }
}