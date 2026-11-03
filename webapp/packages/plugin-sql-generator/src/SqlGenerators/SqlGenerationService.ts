/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { NavNode } from '@cloudbeaver/core-navigation-tree';
import type { SqlQueryGenerator } from '@cloudbeaver/core-sdk';

import { getDefaultQueryGeneratorOptions } from './SqlGeneratorsResource.js';
import { isSqlGenerationNode } from './sqlGenerationSelection.js';
import { openGeneratedSqlDialog } from './openGeneratedSqlDialog.js';

@injectable(() => [CommonDialogService, NotificationService])
export class SqlGenerationService {
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

      await openGeneratedSqlDialog(this.commonDialogService, {
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
