/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { selectFiles } from '@cloudbeaver/core-browser';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { download, getMIME, isImageFormat, isValidUrl } from '@cloudbeaver/core-utils';

import { createResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/createResultSetBlobValue';
import { getResultSetActions } from '../../DatabaseDataModel/Actions/ResultSet/getResulеSetActions';
import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetBinaryValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryValue';
import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue';
import { isResultSetFileValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetFileValue';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';

interface Props {
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  resultIndex: number;
}

export function useValuePanelImageValue({ model, resultIndex }: Props) {
  const notificationService = useService(NotificationService);
  const resultSetActions = getResultSetActions({ model, resultIndex });

  return useObservableRef(
    () => ({
      get selectedCell(): IResultSetElementKey | undefined {
        return this.selectAction.getActiveElements()?.[0];
      },
      get cellValue() {
        if (this.selectedCell === undefined) {
          return null;
        }

        return this.formatAction.get(this.selectedCell);
      },
      get src(): string | Blob | null {
        if (isResultSetBlobValue(this.cellValue)) {
          // uploaded file preview
          return this.cellValue.blob;
        }

        if (this.staticSrc) {
          return this.staticSrc;
        }

        if (this.cacheBlob) {
          // uploaded file preview
          return this.cacheBlob;
        }

        return null;
      },
      get staticSrc(): string | null {
        if (this.truncated) {
          return null;
        }

        if (isResultSetBinaryValue(this.cellValue)) {
          return `data:${getMIME(this.cellValue.binary)};base64,${this.cellValue.binary}`;
        }

        if (typeof this.cellValue === 'string' && isValidUrl(this.cellValue) && isImageFormat(this.cellValue)) {
          return this.cellValue;
        }

        return null;
      },
      get cacheBlob() {
        if (!this.selectedCell) {
          return null;
        }
        return this.contentAction.retrieveBlobFromCache(this.selectedCell);
      },
      get canSave() {
        if (this.truncated && this.selectedCell) {
          return this.contentAction.isDownloadable(this.selectedCell);
        }

        return this.staticSrc && !this.truncated;
      },
      get canUpload() {
        if (!this.selectedCell) {
          return false;
        }
        return this.formatAction.isBinary(this.selectedCell);
      },
      get truncated() {
        if (isResultSetFileValue(this.cellValue)) {
          return false;
        }

        return this.selectedCell && this.contentAction.isBlobTruncated(this.selectedCell);
      },
      async download() {
        try {
          if (this.src) {
            download(this.src, '', true);
            return;
          }

          if (this.selectedCell) {
            await this.contentAction.downloadFileData(this.selectedCell);
            return;
          }

          throw new Error("Can't save image");
        } catch (exception: any) {
          this.notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
        }
      },
      async upload() {
        selectFiles(files => {
          const file = files?.[0];
          if (file && this.selectedCell) {
            this.editAction.set(this.selectedCell, createResultSetBlobValue(file));
          }
        });
      },
      async loadFullImage() {
        if (!this.selectedCell) {
          return;
        }

        try {
          await this.contentAction.resolveFileDataUrl(this.selectedCell);
        } catch (exception: any) {
          this.notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
        }
      },
    }),
    {
      selectedCell: computed,
      cellValue: computed,
      canUpload: computed,
      src: computed,
      cacheBlob: computed,
      canSave: computed,
      truncated: computed,
      model: observable.ref,
      resultIndex: observable.ref,
      download: action.bound,
      upload: action.bound,
      loadFullImage: action.bound,
    },
    { model, resultIndex, notificationService, ...resultSetActions },
  );
}
