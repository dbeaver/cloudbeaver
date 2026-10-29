/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { NavNode } from '@cloudbeaver/core-navigation-tree';
import type { SqlQueryGenerator } from '@cloudbeaver/core-sdk';

import { getDefaultQueryGeneratorOptions, SqlGeneratorsResource } from './SqlGeneratorsResource.js';
import { isSqlGenerationNode } from './sqlGenerationSelection.js';

const GeneratedSqlDialog = importLazyComponent(() => import('./GeneratedSqlDialog.js').then(m => m.GeneratedSqlDialog));
@injectable(() => [SqlGeneratorsResource, CommonDialogService, NotificationService])
export class SqlGenerationService {
  constructor(
    private readonly sqlGeneratorsResource: SqlGeneratorsResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {}

  async open(nodes: readonly NavNode[], generator: SqlQueryGenerator): Promise<void> {
    try {
      let selected = nodes.filter(isSqlGenerationNode);
      if (nodes.length > 1) {
        const generators = await Promise.all(selected.map(node => this.sqlGeneratorsResource.load(node.uri)));
        selected = selected.filter((_, index) => generators[index]!.some(candidate => candidate.id === generator.id));
      }

      const [first, ...rest] = selected;
      if (!first) {
        return;
      }
      await this.commonDialogService.open(GeneratedSqlDialog, {
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
}
