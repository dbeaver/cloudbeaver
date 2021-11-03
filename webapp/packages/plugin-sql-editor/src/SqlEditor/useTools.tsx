/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action } from 'mobx';

import type { ITab } from '@cloudbeaver/core-app';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { download, generateFileName, uploadTextFiles } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlEditorSettingsService } from '../SqlEditorSettingsService';
import type { SqlEditorController } from './SqlEditorController';

interface State {
  uploadScript: (files: FileList | null) => Promise<void>;
  downloadScript: () => void;
}

export function useTools(controller: SqlEditorController, tab: ITab<ISqlEditorTabState>): Readonly<State> {
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const sqlEditorSettingsService = useService(SqlEditorSettingsService);

  return useObservableRef(() => ({
    async uploadScript(fileList: FileList | null) {
      if (!fileList) {
        throw new Error('No files found');
      }

      if (!fileList.length) {
        return;
      }

      if (this.controller.value.trim()) {
        const state = await this.commonDialogService.open(ConfirmationDialog, {
          title: 'ui_changes_might_be_lost',
          message: 'sql_editor_upload_script_unsaved_changes_dialog_message',
          confirmActionText: 'ui_yes',
          cancelActionText: 'ui_no',
        });

        if (state !== DialogueStateResult.Rejected) {
          this.downloadScript();
        }
      }

      const maxSize = this.sqlEditorSettingsService.settings.getValue('maxFileSize');
      const aboveMaxSize: File[] = [];

      const files = Array.from(fileList).filter(file => {
        const size = Math.round(file.size / 1000); // kilobyte
        const above = size > maxSize;

        if (above) {
          aboveMaxSize.push(file);
        }

        return !above;
      });

      if (aboveMaxSize.length > 0) {
        const nameList = aboveMaxSize.map(file => `${file.name} (${Math.round(file.size / 1000)}KB)`);
        const message = `Max size: ${maxSize}KB\nFollowing files exceed max size: "${nameList.join(', ')}"`;

        this.notificationService.logInfo({
          title: 'sql_editor_upload_script_max_size_title',
          message,
          persistent: true,
        });
      }

      if (!files.length) {
        return;
      }

      const data = uploadTextFiles(files);
      const process = Array.from(data.values())[0];

      try {
        const script = await process.promise;
        controller.setQuery(script);
      } catch (exception) {
        this.notificationService.logException(exception, 'Uploading file error');
      }
    },

    downloadScript() {
      const script = this.controller.value;

      if (!script.trim()) {
        return;
      }

      const blob = new Blob([script], {
        type: 'application/sql',
      });

      let name = 'script';
      const connectionId = this.tab.handlerState.executionContext?.connectionId;

      if (connectionId) {
        const connection = this.connectionInfoResource.get(connectionId);
        name = connection ? `${connection.name}-script` : name;
      }

      download(blob, generateFileName(name, '.sql'));
    },
  }),
  { uploadScript: action.bound, downloadScript: action.bound },
  { controller, commonDialogService, connectionInfoResource, notificationService, sqlEditorSettingsService, tab });
}
