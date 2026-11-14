/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import { Button, ConfirmationDialog, Loader, Switch, TextPlaceholder, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { useTableSelection } from '@cloudbeaver/plugin-data-grid';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';

import { DBAdminQueryText } from '../components/DBAdminQueryText.js';
import { DBAdminTable } from '../components/DBAdminTable.js';
import { useDBAdminLoader } from '../components/useDBAdminLoader.js';
import { type DBAdminSessionList, DBAdminService } from '../DBAdminService.js';

const NO_COLUMNS: DBAdminSessionList['columns'] = [];
const NO_SESSIONS: DBAdminSessionList['sessions'] = [];

interface Props {
  /** Connected connection, or null if the connection is closed */
  connection: IConnectionInfoParams | null;
}

export const SessionManager = observer<Props>(function SessionManager({ connection }) {
  const translate = useTranslate();
  const dbAdminService = useService(DBAdminService);
  const notificationService = useService(NotificationService);
  const commonDialogService = useService(CommonDialogService);
  const [showIdle, setShowIdle] = useState(false);
  const [focusedSessionId, setFocusedSessionId] = useState<string | null>(null);

  const loader = useDBAdminLoader(connection ? `${connection.projectId}:${connection.connectionId}:${showIdle}` : null, () =>
    dbAdminService.listSessions(connection!, showIdle),
  );

  useAutoLoad(SessionManager, loader);

  const columns = loader.data?.columns ?? NO_COLUMNS;
  const sessions = loader.data?.sessions ?? NO_SESSIONS;
  // Keep row arrays stable between renders: useTableSelection stores keys in an observable,
  // so a new array on every render makes the panel re-render endlessly once a row is selected
  const rows = useMemo(() => sessions.map(session => ({ id: session.sessionId, values: session.values })), [sessions]);
  const rowIds = useMemo(() => rows.map(row => row.id), [rows]);
  const selection = useTableSelection(rowIds);
  const focusedSession = sessions.find(session => session.sessionId === focusedSessionId);
  const selectedCount = selection.selected.length;

  async function alterSessions(cancelQueryOnly: boolean) {
    const sessionIds = selection.selected;

    if (!connection || sessionIds.length === 0) {
      return;
    }

    const { status } = await commonDialogService.open(ConfirmationDialog, {
      title: cancelQueryOnly ? 'plugin_dbadmin_cancel_query' : 'plugin_dbadmin_terminate_session',
      message: translate(cancelQueryOnly ? 'plugin_dbadmin_cancel_query_confirm' : 'plugin_dbadmin_terminate_session_confirm', undefined, {
        count: sessionIds.length,
      }),
      confirmActionText: cancelQueryOnly ? 'plugin_dbadmin_cancel_query' : 'plugin_dbadmin_terminate_session',
    });

    if (status !== DialogueStateResult.Resolved) {
      return;
    }

    try {
      await dbAdminService.terminateSessions(connection, sessionIds, cancelQueryOnly);
      selection.clear();
    } catch (exception: any) {
      notificationService.logException(exception, cancelQueryOnly ? 'plugin_dbadmin_cancel_query_error' : 'plugin_dbadmin_terminate_session_error');
    }

    await loader.reload();
  }

  if (!connection) {
    return <TextPlaceholder>{translate('plugin_dbadmin_not_connected')}</TextPlaceholder>;
  }

  return (
    <div className="tw:flex tw:h-full tw:flex-col tw:gap-2 tw:overflow-hidden tw:p-2">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        <Button variant="secondary" size="small" loading={loader.isLoading()} onClick={() => loader.reload()}>
          {translate('ui_refresh')}
        </Button>
        <Switch checked={showIdle} mod={['primary', 'dense']} onChange={value => setShowIdle(value)}>
          {translate('plugin_dbadmin_show_idle_sessions')}
        </Switch>
        <span className="tw:flex-1" />
        <Button variant="secondary" size="small" disabled={selectedCount === 0} onClick={() => alterSessions(true)}>
          {translate('plugin_dbadmin_cancel_query')}
        </Button>
        <Button variant="danger" size="small" disabled={selectedCount === 0} onClick={() => alterSessions(false)}>
          {translate('plugin_dbadmin_terminate_session')}
        </Button>
      </div>
      <div className="tw:relative tw:flex tw:min-h-0 tw:flex-1 tw:flex-col">
        <Loader state={loader} overlay>
          {rows.length > 0 ? (
            <DBAdminTable
              columns={columns}
              rows={rows}
              selection={selection}
              focusedRowId={focusedSessionId}
              className="tw:h-full"
              onRowFocus={setFocusedSessionId}
            />
          ) : (
            <TextPlaceholder>{translate('plugin_dbadmin_no_sessions')}</TextPlaceholder>
          )}
        </Loader>
      </div>
      <DBAdminQueryText title={translate('plugin_dbadmin_query')} query={focusedSession?.activeQuery} />
    </div>
  );
});
