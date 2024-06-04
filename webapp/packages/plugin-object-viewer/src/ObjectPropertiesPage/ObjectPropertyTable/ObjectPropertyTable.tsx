/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { s, TextPlaceholder, useExecutor, useObservableRef, useOffsetPagination, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { type DBObject, DBObjectParentKey, DBObjectResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { isDefined } from '@cloudbeaver/core-utils';
import { AuthenticationService, type AuthEventType } from '@cloudbeaver/plugin-authentication';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import styles from './ObjectPropertyTable.m.css';
import { TableLoader } from './Table/TableLoader';

interface ObjectPropertyTableProps {
  objectId: string;
  parentId?: string;
  className?: string;
}

export const ObjectPropertyTable = observer<ObjectPropertyTableProps>(function ObjectPropertyTable({ objectId, parentId, className }) {
  const translate = useTranslate();
  const authenticationService = useService(AuthenticationService);
  const navNodeViewService = useService(NavNodeViewService);
  const navTreeResource = useResource(ObjectPropertyTable, NavTreeResource, objectId, { forceSuspense: true });
  const [loggingOut, setLoggingOut] = useState(false);

  const pagination = useOffsetPagination(DBObjectResource, {
    key: DBObjectParentKey(objectId),
    pageSize: navTreeResource.resource.childrenLimit,
  });

  const dbObjectLoader = useResource(ObjectPropertyTable, DBObjectResource, pagination.key, { active: !loggingOut });

  const { nodes, duplicates } = navNodeViewService.filterDuplicates(dbObjectLoader.data.filter(isDefined).map(node => node?.id) || []);

  const objects = dbObjectLoader.data.filter(node => nodes.includes(node?.id || '')) as DBObject[];

  useEffect(() => {
    navNodeViewService.logDuplicates(objectId, duplicates);
  });

  function onLogoutHandler(data: AuthEventType, contexts: IExecutionContextProvider<AuthEventType>) {
    if (data === 'before') {
      setLoggingOut(true);
      return;
    }

    setLoggingOut(false);
  }

  useExecutor({
    executor: authenticationService.onLogout,
    handlers: [onLogoutHandler],
  });

  return (
    <>
      {nodes.length === 0 ? (
        <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
      ) : (
        <div className={s(styles, { box: true }, className)}>
          <TableLoader objects={objects} hasNextPage={pagination.hasNextPage} loadMore={pagination.loadMore} />
        </div>
      )}
    </>
  );
});
