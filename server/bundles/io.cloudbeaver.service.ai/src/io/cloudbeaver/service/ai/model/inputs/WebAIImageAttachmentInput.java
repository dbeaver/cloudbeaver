/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
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
package io.cloudbeaver.service.ai.model.inputs;

import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.ai.AIImageAttachment;

import java.util.Base64;

public record WebAIImageAttachmentInput(@NotNull String name, @NotNull String mediaType, @NotNull String data) {

    public long getByteSize() {
        int padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
        return data.length() * 3L / 4 - padding;
    }

    @NotNull
    public AIImageAttachment toImageAttachment() {
        if (data.isEmpty() || data.length() > (AIImageAttachment.MAX_IMAGE_BYTES + 2) / 3 * 4) {
            throw new IllegalArgumentException("Image must contain data and be no larger than 20 MB.");
        }
        AIImageAttachment image = AIImageAttachment.fromBytes(name, Base64.getDecoder().decode(data));
        if (!image.mediaType().equals(mediaType)) {
            throw new IllegalArgumentException("Image media type does not match its content.");
        }
        return image;
    }
}
