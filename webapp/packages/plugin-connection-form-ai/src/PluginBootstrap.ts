/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { ConnectionFormService } from '@cloudbeaver/plugin-connections';
import { getConnectionAiPart } from './connection-form/getConnectionAiPart.js';
import { FEATURE_AI_ID, ServerConfigResource } from '@cloudbeaver/core-root';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { AIChatMessageService } from '@cloudbeaver/plugin-ai-chat';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';

import { ConnectionInfoAiResource } from './ConnectionInfoAiResource.js';

const ConnectionAiForm = importLazyComponent(() => import('./connection-form/ConnectionAiForm.js').then(m => m.ConnectionAiForm));

@injectable(() => [
  ConnectionFormService,
  ServerConfigResource,
  ConnectionInfoAiResource,
  AIChatMessageService,
  ConnectionInfoResource,
  CommonDialogService,
  LocalizationService,
])
export class PluginBootstrap extends Bootstrap {
  private readonly key: string;
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly connectionInfoAiResource: ConnectionInfoAiResource,
    private readonly aiChatMessageService: AIChatMessageService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
    this.key = 'ai';

    this.aiChatMessageService.onMessageSend.addHandler(async (data, contexts) => {
      if (data.stage === 'before' && this.isAiEnabled() && data.data.connectionKey) {
        const connection = await this.connectionInfoResource.load(data.data.connectionKey);

        if (connection.canEdit) {
          const info = await this.connectionInfoAiResource.load(data.data.connectionKey);

          if (!info.metaTransferConfirmed) {
            const { status } = await this.commonDialogService.open(ConfirmationDialog, {
              title: 'plugin_ai_chat_metadata_transfer_confirmation_title',
              message: 'plugin_ai_chat_metadata_transfer_confirmation_message',
              confirmActionText: 'plugin_ai_chat_metadata_transfer_confirmation',
              size: 'medium',
            });

            if (status === DialogueStateResult.Rejected) {
              ExecutorInterrupter.interrupt(contexts);
              return;
            }

            await this.connectionInfoAiResource.save(data.data.connectionKey, {
              metaTransferConfirmed: true,
            });

            const updated = this.connectionInfoAiResource.get(data.data.connectionKey);

            if (updated?.metaTransferConfirmed === false) {
              throw new Error(this.localizationService.translate('plugin_ai_chat_metadata_transfer_rejection'));
            }
          }
        }
      }
    });
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: this.key,
      name: 'plugin_connection_form_ai_name',
      stateGetter: context => () => getConnectionAiPart(context.formState),
      getLoader: () => [getCachedDataResourceLoaderState(this.serverConfigResource, () => undefined)],
      isHidden: (_, context) => !context || !this.isAiEnabled(),
      panel: () => ConnectionAiForm,
    });
  }

  private isAiEnabled(): boolean {
    return this.serverConfigResource.isFeatureEnabled(FEATURE_AI_ID);
  }
}
