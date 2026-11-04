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
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.ai.AIImageAttachment;

import java.util.ArrayList;
import java.util.List;

public record WebAIChatAttachmentInput(@Nullable WebAIImageAttachmentInput image) {

    @NotNull
    public static List<AIImageAttachment> toImages(@Nullable WebAIChatAttachmentInput[] attachments) {
        if (attachments == null || attachments.length == 0) {
            return List.of();
        }
        if (attachments.length > AIImageAttachment.MAX_IMAGES) {
            throw new IllegalArgumentException("Attach no more than 10 images with a total size of 20 MB or less.");
        }
        long totalBytes = 0;
        for (WebAIChatAttachmentInput attachment : attachments) {
            if (attachment == null || attachment.image() == null) {
                throw new IllegalArgumentException("An image attachment must contain an image payload.");
            }
            totalBytes += attachment.image().getByteSize();
            if (totalBytes > AIImageAttachment.MAX_IMAGE_BYTES) {
                throw new IllegalArgumentException("Attach no more than 10 images with a total size of 20 MB or less.");
            }
        }
        List<AIImageAttachment> images = new ArrayList<>(attachments.length);
        for (WebAIChatAttachmentInput attachment : attachments) {
            images.add(attachment.image().toImageAttachment());
        }
        AIImageAttachment.validateImages(images);
        return List.copyOf(images);
    }
}
