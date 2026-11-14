/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import { Button, ConfirmationDialog, Loader, TextPlaceholder, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';

import { DBAdminTable } from '../components/DBAdminTable.js';
import { useDBAdminLoader } from '../components/useDBAdminLoader.js';
import { type DBAdminLockList, DBAdminService } from '../DBAdminService.js';
import { LockItemsTable } from './LockItemsTable.js';

const NO_COLUMNS: DBAdminLockList['columns'] = [];
const NO_LOCKS: DBAdminLockList['locks'] = [];

interface Props {
  /** Connected connection, or null if the connection is closed */
  connection: IConnectionInfoParams | null;
}

export const LockManager = observer<Props>(function LockManager({ connection }) {
  const translate = useTranslate();
  const dbAdminService = useService(DBAdminService);
  const notificationService = useService(NotificationService);
  const commonDialogService = useService(CommonDialogService);
  const [focusedLockId, setFocusedLockId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const connectionKey = connection ? `${connection.projectId}:${connection.connectionId}` : null;
  const locksLoader = useDBAdminLoader(connectionKey ? `${connectionKey}:${version}` : null, () => dbAdminService.listLocks(connection!));

  const locks = locksLoader.data?.locks ?? NO_LOCKS;
  const focusedLock = locks.find(lock => lock.lockId === focusedLockId);

  const detailsLoader = useDBAdminLoader(connectionKey && focusedLock ? `${connectionKey}:${focusedLock.lockId}:${version}` : null, () =>
    dbAdminService.getLockDetails(connection!, focusedLock!.lockId),
  );

  useAutoLoad(LockManager, [locksLoader, detailsLoader]);

  const columns = locksLoader.data?.columns ?? NO_COLUMNS;
  const rows = useMemo(() => locks.map(lock => ({ id: lock.lockId, values: lock.values })), [locks]);

  async function terminateWaitingSession() {
    if (!connection || !focusedLock) {
      return;
    }

    const { status } = await commonDialogService.open(ConfirmationDialog, {
      title: 'plugin_dbadmin_terminate_waiting_session',
      message: translate('plugin_dbadmin_terminate_waiting_session_confirm', undefined, { sessionId: focusedLock.lockId }),
      confirmActionText: 'plugin_dbadmin_terminate_waiting_session',
    });

    if (status !== DialogueStateResult.Resolved) {
      return;
    }

    try {
      await dbAdminService.terminateLock(connection, focusedLock.lockId);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_dbadmin_terminate_session_error');
    }

    setVersion(value => value + 1);
  }

  if (!connection) {
    return <TextPlaceholder>{translate('plugin_dbadmin_not_connected')}</TextPlaceholder>;
  }

  return (
    <div className="tw:flex tw:h-full tw:flex-col tw:gap-2 tw:overflow-hidden tw:p-2">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        <Button variant="secondary" size="small" loading={locksLoader.isLoading()} onClick={() => setVersion(value => value + 1)}>
          {translate('ui_refresh')}
        </Button>
        <span className="tw:flex-1" />
        <Button variant="danger" size="small" disabled={!focusedLock} onClick={terminateWaitingSession}>
          {translate('plugin_dbadmin_terminate_waiting_session')}
        </Button>
      </div>
      <div className="tw:relative tw:flex tw:min-h-0 tw:flex-1 tw:flex-col">
        <Loader state={locksLoader} overlay>
          {rows.length > 0 ? (
            <DBAdminTable columns={columns} rows={rows} focusedRowId={focusedLockId} className="tw:h-full" onRowFocus={setFocusedLockId} />
          ) : (
            <TextPlaceholder>{translate('plugin_dbadmin_no_locks')}</TextPlaceholder>
          )}
        </Loader>
      </div>
      {focusedLock && (
        <div className="tw:relative tw:flex tw:h-60 tw:shrink-0 tw:gap-2">
          <Loader state={detailsLoader} overlay>
            <LockItemsTable title={translate('plugin_dbadmin_waiting_session_locks')} list={detailsLoader.data?.waiting} />
            <LockItemsTable title={translate('plugin_dbadmin_blocking_session_locks')} list={detailsLoader.data?.holding} />
          </Loader>
        </div>
      )}
    </div>
  );
});
