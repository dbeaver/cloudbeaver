/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, type DialogResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { NavNode } from '@cloudbeaver/core-navigation-tree';
import type { SqlQueryGenerator } from '@cloudbeaver/core-sdk';

import type { GeneratedSqlPayload } from './GeneratedSqlDialog.js';
import { getDefaultQueryGeneratorOptions } from './SqlGeneratorsResource.js';
import { isSqlGenerationNode } from './sqlGenerationSelection.js';

const GeneratedSqlDialog = importLazyComponent(() => import('./GeneratedSqlDialog.js').then(m => m.GeneratedSqlDialog));

export class SqlGenerationServiceImpl {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {}

  async open(nodes: readonly NavNode[], generator: SqlQueryGenerator): Promise<void> {
    try {
      // The server generator checks applicability for each object in the batch.
      const selected = nodes.filter(isSqlGenerationNode);

      const [first, ...rest] = selected;

      if (!first) {
        return;
      }

      await this.openDialog({
        nodeIds: [first.uri, ...rest.map(node => node.uri)],
        nodeName: first.name,
        generatorId: generator.id,
        generatorName: generator.label,
        options: getDefaultQueryGeneratorOptions(),
      });
    } catch (error: any) {
      this.notificationService.logException(error, 'app_shared_sql_generators_error_title');
    }
  }

  openDialog(payload: GeneratedSqlPayload): Promise<DialogResult> {
    const dialog = this.commonDialogService.open(
      GeneratedSqlDialog,
      { ...payload, onClose: () => this.commonDialogService.rejectDialog(dialog) },
      { persistent: true },
    );

    return dialog;
  }
}

export type SqlGenerationService = SqlGenerationServiceImpl;

export class SqlGenerationServiceDI extends Context.Service<SqlGenerationServiceDI, SqlGenerationServiceImpl>()(
  '@cloudbeaver/plugin-sql-generator/SqlGenerators/SqlGenerationService#SqlGenerationService',
) {
  static readonly implementation = SqlGenerationServiceImpl;

  static readonly dependencies = () => [CommonDialogService, NotificationService] as const;
  static readonly make: Effect.Effect<
    SqlGenerationServiceImpl,
    never,
    Context.Service.Identifier<typeof CommonDialogService> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeSqlGenerationService() {
    const commonDialogService = yield* CommonDialogService;
    const notificationService = yield* NotificationService;

    return new SqlGenerationServiceImpl(commonDialogService, notificationService);
  });
  static readonly layer: Layer.Layer<
    SqlGenerationServiceDI,
    never,
    Context.Service.Identifier<typeof CommonDialogService> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlGenerationService = SqlGenerationServiceDI;
