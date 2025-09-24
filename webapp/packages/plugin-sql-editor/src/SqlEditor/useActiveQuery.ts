/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';
import type { ISQLEditorData } from './ISQLEditorData.js';
import { SqlEditorService, type ISqlEditorActiveQueryUpdateData } from '../SqlEditorService.js';
import { useExecutor } from '@cloudbeaver/core-blocks';
import { useState } from 'react';
import { ExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import { SqlEditorStateContext } from './SqlEditorStateContext.js';

export function useActiveQuery(state: ISQLEditorData): void {
  const [collection] = useState(() => new ExecutorHandlersCollection<ISqlEditorActiveQueryUpdateData>());
  const sqlEditorService = useService(SqlEditorService);

  useExecutor({
    executor: collection,
    handlers: [
      function fillEditorState(data, context) {
        const sqlEditorStateContext = context.getContext(SqlEditorStateContext);
        sqlEditorStateContext.setState(state);
      },
    ],
  });

  useExecutor({
    executor: sqlEditorService.updateActiveQuery,
    before: collection,
    handlers: [
      async function updateActiveQuery(data, context) {
        const sqlEditorStateContext = context.getContext(SqlEditorStateContext);
        const sqlEditorData = sqlEditorStateContext.state;

        if (!sqlEditorData) {
          return;
        }

        const segment = await sqlEditorData.model.getResolvedSegment();
        let query = data.update.query.trim();

        if (segment) {
          query = query.trim();
          // TODO: getResolvedSegment will return segment without end delimiter
          //       we need this to avoid duplicated end delimiter
          const dialectDelimiter = sqlEditorData.dialect?.scriptDelimiter ?? '';
          const endDelimiterLength = dialectDelimiter.length;
          const endDelimiter = sqlEditorData.value.slice(segment.end, segment.end + endDelimiterLength);

          if (endDelimiter === dialectDelimiter && query.endsWith(endDelimiter)) {
            query = query.slice(0, -endDelimiterLength);
          }
        }

        switch (data.update.type) {
          case 'replace':
            if (segment) {
              const firstQueryPart = sqlEditorData.value.slice(0, segment.begin) + query;
              sqlEditorData.setScript(firstQueryPart + sqlEditorData.value.slice(segment.end), undefined, {
                anchor: firstQueryPart.length,
                head: firstQueryPart.length,
              });
            } else {
              sqlEditorData.setScript(query, undefined, sqlEditorData.model.cursor);
            }
            break;
          case 'append':
            {
              const newScript = sqlEditorData.value + query;
              sqlEditorData.setScript(newScript, undefined, { anchor: newScript.length, head: newScript.length });
            }
            break;
          case 'prepend':
            {
              const newScript = query + sqlEditorData.value;
              sqlEditorData.setScript(newScript, undefined, { anchor: 0, head: 0 });
            }
            break;
        }
      },
    ],
  });
}
