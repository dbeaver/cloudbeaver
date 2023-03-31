/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { ISqlDataSource } from './SqlDataSource/ISqlDataSource';
import { SqlEditorService } from './SqlEditorService';

export function useDataSource(dataSource?: ISqlDataSource) {
  const sqlEditorService = useService(SqlEditorService);
  const refObj = useObservableRef(() => ({
    async load(refresh?: boolean) {
      if (!this.dataSource || this.dataSource.isLoading()) {
        return;
      }

      if (refresh) {
        this.dataSource.markOutdated();
      }

      await this.dataSource.load();
    },
  }), { }, {
    dataSource,
  });

  // TODO: getComputed skips update somehow ...
  const outdated = dataSource && (
    (dataSource.isOutdated() || !dataSource.isLoaded())
    && !dataSource.isLoading()
  );


  useEffect(() => {
    if (!outdated) {
      return;
    }

    if (!dataSource.exception || (Array.isArray(dataSource.exception) && !dataSource.exception.some(Boolean))) {
      refObj.load();
    }
  });

  const executionContextId = dataSource?.executionContext?.id;

  useEffect(() => () => {
    if (
      executionContextId !== undefined
      && dataSource?.executionContext?.id !== executionContextId
    ) {
      sqlEditorService.destroyContext({ id: executionContextId, connectionId: '', projectId: '' });
    }
  }, [executionContextId, dataSource]);
}