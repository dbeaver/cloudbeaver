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
package io.cloudbeaver.model.rm.fs.nio;

import org.jkiss.dbeaver.DBException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;

public class RMOutputStream extends ByteArrayOutputStream {
    private final RMPath rmPath;

    public RMOutputStream(RMPath rmPath) {
        this.rmPath = rmPath;
    }

    @Override
    public void close() throws IOException {
        try {
            rmPath.getFileSystem().getRmController().setResourceContents(
                rmPath.getRmProjectId(),
                rmPath.getResourcePath(),
                Arrays.copyOfRange(buf, 0, count),
                true
            );
        } catch (DBException e) {
            throw new IOException("Failed to write data to the resource: " + e.getMessage(), e);
        }
        super.close();
    }
}
