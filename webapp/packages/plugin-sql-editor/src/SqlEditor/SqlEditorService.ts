/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, QuerySqlCompletionProposalsQuery } from '@cloudbeaver/core-sdk';

@injectable()
export class SqlEditorService {

  constructor(private gql: GraphQLService) {
  }

  async getAutocomplete(
    connectionId: string,
    contextId: string,
    query: string,
    cursor: number
  ): Promise<QuerySqlCompletionProposalsQuery['sqlCompletionProposals'] | null> {

    const result = await this.gql.sdk.querySqlCompletionProposals({
      connectionId,
      contextId,
      query,
      position: cursor,
    });

    return result.sqlCompletionProposals;
  }
}
