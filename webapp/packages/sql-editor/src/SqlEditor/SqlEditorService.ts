/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { GraphQLService, QuerySqlCompletionProposalsQuery } from '@dbeaver/core/sdk';

import { SqlEditorManagerService } from '../SqlEditorManagerService';

@injectable()
export class SqlEditorService {

  constructor(private sqlEditorManagerService: SqlEditorManagerService,
              private gql: GraphQLService) {
  }

  async getAutocomplete(tabId: string, cursor: number): Promise<QuerySqlCompletionProposalsQuery['sqlCompletionProposals'] | null> {
    const state = this.sqlEditorManagerService.getHandlerState(tabId);
    if (!state) {
      return null;
    }

    const result = await this.gql.gql.querySqlCompletionProposals({
      connectionId: state.connectionId,
      contextId: state.contextId,
      query: state.query,
      position: cursor,
    });

    return result.sqlCompletionProposals;
  }
}
