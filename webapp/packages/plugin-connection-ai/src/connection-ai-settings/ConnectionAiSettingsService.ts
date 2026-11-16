/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { FEATURE_AI_ID, ServerConfigResource } from '@cloudbeaver/core-root';
import { AIChatMessageService } from '@cloudbeaver/plugin-ai-chat';
import { ConnectionFormService } from '@cloudbeaver/plugin-connections';
import { getConnectionAiPart } from './getConnectionAiPart.js';

import { ConnectionInfoAiResource } from '../ConnectionInfoAiResource.js';

const ConnectionAiForm = importLazyComponent(() => import('./ConnectionAiForm.js').then(m => m.ConnectionAiForm));

export class ConnectionAiSettingsServiceImpl {
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
    this.key = 'ai';
  }

  register(): void {
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

    this.connectionFormService.parts.add({
      key: this.key,
      name: 'plugin_connection_form_ai_name',
      title: 'plugin_connection_form_ai_name',
      icon: '/icons/core_blocks_sparkles.svg',
      order: 7,
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

export type ConnectionAiSettingsService = ConnectionAiSettingsServiceImpl;

export class ConnectionAiSettingsServiceDI extends Context.Service<ConnectionAiSettingsServiceDI, ConnectionAiSettingsServiceImpl>()(
  '@cloudbeaver/plugin-connection-ai/connection-ai-settings/ConnectionAiSettingsService#ConnectionAiSettingsService',
) {
  static readonly implementation = ConnectionAiSettingsServiceImpl;

  static readonly dependencies = () =>
    [
      ConnectionFormService,
      ServerConfigResource,
      ConnectionInfoAiResource,
      AIChatMessageService,
      ConnectionInfoResource,
      CommonDialogService,
      LocalizationService,
    ] as const;
  static readonly make: Effect.Effect<
    ConnectionAiSettingsServiceImpl,
    never,
    | Context.Service.Identifier<typeof ConnectionFormService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof ConnectionInfoAiResource>
    | Context.Service.Identifier<typeof AIChatMessageService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof LocalizationService>
  > = Effect.gen(function* makeConnectionAiSettingsService() {
    const connectionFormService = yield* ConnectionFormService;
    const serverConfigResource = yield* ServerConfigResource;
    const connectionInfoAiResource = yield* ConnectionInfoAiResource;
    const aiChatMessageService = yield* AIChatMessageService;
    const connectionInfoResource = yield* ConnectionInfoResource;
    const commonDialogService = yield* CommonDialogService;
    const localizationService = yield* LocalizationService;

    return new ConnectionAiSettingsServiceImpl(
      connectionFormService,
      serverConfigResource,
      connectionInfoAiResource,
      aiChatMessageService,
      connectionInfoResource,
      commonDialogService,
      localizationService,
    );
  });
  static readonly layer: Layer.Layer<
    ConnectionAiSettingsServiceDI,
    never,
    | Context.Service.Identifier<typeof ConnectionFormService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof ConnectionInfoAiResource>
    | Context.Service.Identifier<typeof AIChatMessageService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof LocalizationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionAiSettingsService = ConnectionAiSettingsServiceDI;
