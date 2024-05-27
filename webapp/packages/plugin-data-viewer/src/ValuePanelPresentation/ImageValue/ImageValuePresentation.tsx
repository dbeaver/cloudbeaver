/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { ActionIconButton, Button, Container, Fill, Loader, s, useObservableRef, useS, useSuspense, useTranslate } from '@cloudbeaver/core-blocks';
import { selectFiles } from '@cloudbeaver/core-browser';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { type TabContainerPanelComponent, useTabLocalState } from '@cloudbeaver/core-ui';
import { blobToBase64, bytesToSize, download, getMIME, isImageFormat, isValidUrl, throttle } from '@cloudbeaver/core-utils';

import { createResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/createResultSetBlobValue';
import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetBinaryValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryValue';
import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { isResultSetFileValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetFileValue';
import { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction';
import { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { QuotaPlaceholder } from '../QuotaPlaceholder';
import styles from './ImageValuePresentation.m.css';

export const ImageValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function ImageValuePresentation({ model, resultIndex }) {
    const translate = useTranslate();
    const suspense = useSuspense();
    const notificationService = useService(NotificationService);
    const style = useS(styles);

    const state = useTabLocalState(() =>
      observable(
        {
          stretch: false,
          toggleStretch() {
            this.stretch = !this.stretch;
          },
        },
        {
          stretch: observable.ref,
          toggleStretch: action.bound,
        },
      ),
    );

    const data = useObservableRef(
      () => ({
        get editAction(): ResultSetEditAction {
          return this.model.source.getAction(this.resultIndex, ResultSetEditAction);
        },
        get contentAction(): ResultSetDataContentAction {
          return this.model.source.getAction(this.resultIndex, ResultSetDataContentAction);
        },
        get selectAction(): ResultSetSelectAction {
          return this.model.source.getAction(this.resultIndex, ResultSetSelectAction);
        },
        get formatAction(): ResultSetFormatAction {
          return this.model.source.getAction(this.resultIndex, ResultSetFormatAction);
        },
        get selectedCell(): IResultSetElementKey | undefined {
          const activeElements = this.selectAction.getActiveElements();

          if (activeElements.length === 0) {
            return undefined;
          }

          return activeElements[0];
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
            } else if (this.selectedCell) {
              await this.contentAction.downloadFileData(this.selectedCell);
            } else {
              throw new Error("Can't save image");
            }
          } catch (exception: any) {
            this.notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
          }
        },
        async upload() {
          selectFiles(files => {
            const file = files?.[0] ?? undefined;
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
        editAction: computed,
        contentAction: computed,
        selectAction: computed,
        formatAction: computed,
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
      { model, resultIndex, notificationService },
    );

    const loading = model.isLoading();

    const valueSize = bytesToSize(isResultSetContentValue(data.cellValue) ? data.cellValue.contentLength ?? 0 : 0);
    const isTruncatedMessageDisplay = !!data.truncated && !data.src;
    const isDownloadable = isTruncatedMessageDisplay && !!data.selectedCell && data.contentAction.isDownloadable(data.selectedCell);
    const isCacheDownloading = isDownloadable && data.contentAction.isLoading(data.selectedCell);

    const debouncedDownload = useMemo(() => throttle(() => data.download(), 1000, false), []);
    const srcGetter = suspense.observedValue(
      'src',
      () => data.src,
      async src => {
        if (src instanceof Blob) {
          return await blobToBase64(src);
        }
        return src;
      },
    );

    return (
      <Container vertical>
        <Container fill overflow center>
          <Loader suspense>
            {data.src && <ImageRenderer srcGetter={srcGetter} className={s(style, { img: true, stretch: state.stretch })} />}
            {isTruncatedMessageDisplay && (
              <QuotaPlaceholder model={data.model} resultIndex={data.resultIndex} elementKey={data.selectedCell}>
                {isDownloadable && (
                  <Button disabled={loading} loading={isCacheDownloading} loader onClick={data.loadFullImage}>
                    {`${translate('ui_view')} (${valueSize})`}
                  </Button>
                )}
              </QuotaPlaceholder>
            )}
          </Loader>
        </Container>
        <Container gap dense keepSize>
          <Container keepSize flexStart noWrap>
            {data.canSave && (
              <ActionIconButton title={translate('ui_download')} name="/icons/export.svg" disabled={loading} img onClick={debouncedDownload} />
            )}
            {data.canUpload && (
              <ActionIconButton title={translate('ui_upload')} name="/icons/import.svg" disabled={loading} img onClick={data.upload} />
            )}
          </Container>
          <Fill />
          <Container keepSize flexEnd>
            <ActionIconButton
              title={translate(state.stretch ? 'data_viewer_presentation_value_image_original_size' : 'data_viewer_presentation_value_image_fit')}
              name={state.stretch ? 'img-original-size' : 'img-fit-size'}
              onClick={state.toggleStretch}
            />
          </Container>
        </Container>
      </Container>
    );
  },
);

interface ImageRendererProps {
  className?: string;
  srcGetter: () => string | null;
}

export const ImageRenderer = observer<ImageRendererProps>(function ImageRenderer({ srcGetter, className }) {
  const src = srcGetter();

  if (!src) {
    return null;
  }

  return <img src={src} className={className} />;
});
