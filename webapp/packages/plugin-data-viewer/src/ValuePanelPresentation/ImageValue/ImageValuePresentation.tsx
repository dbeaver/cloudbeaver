/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { ActionIconButton, Button, Container, Fill, s, useObservableRef, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { selectFiles } from '@cloudbeaver/core-browser';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { type TabContainerPanelComponent, useTabLocalState } from '@cloudbeaver/core-ui';
import { bytesToSize, download, getMIME, isImageFormat, isValidUrl } from '@cloudbeaver/core-utils';

import { createResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/createResultSetBlobValue';
import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetBinaryValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryValue';
import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { isResultSetFileValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetFileValue';
import { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction';
import { ResultSetDataKeysUtils } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataKeysUtils';
import { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { QuotaPlaceholder } from '../QuotaPlaceholder';
import styles from './ImageValuePresentation.m.css';

interface IToolsProps {
  loading?: boolean;
  stretch?: boolean;
  onToggleStretch?: () => void;
  onSave?: () => void;
  onUpload?: () => void;
}

const Tools = observer<IToolsProps>(function Tools({ loading, stretch, onToggleStretch, onSave, onUpload }) {
  const translate = useTranslate();

  return (
    <Container gap dense keepSize>
      <Container keepSize flexStart center>
        {onSave && <ActionIconButton title={translate('ui_download')} name="/icons/export.svg" disabled={loading} img onClick={onSave} />}
        {onUpload && <ActionIconButton title={translate('ui_upload')} name="/icons/import.svg" disabled={loading} img onClick={onUpload} />}
      </Container>
      <Fill />
      {onToggleStretch && (
        <Container keepSize flexEnd center>
          <ActionIconButton
            title={translate(stretch ? 'data_viewer_presentation_value_image_original_size' : 'data_viewer_presentation_value_image_fit')}
            name={stretch ? 'img-original-size' : 'img-fit-size'}
            onClick={onToggleStretch}
          />
        </Container>
      )}
    </Container>
  );
});

export const ImageValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function ImageValuePresentation({ model, resultIndex }) {
    const translate = useTranslate();
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
        get src() {
          if (this.savedSrc) {
            return this.savedSrc;
          }

          if (isResultSetBlobValue(this.cellValue)) {
            return URL.createObjectURL(this.cellValue.blob);
          }

          if (isResultSetBinaryValue(this.cellValue)) {
            return `data:${getMIME(this.cellValue.binary)};base64,${this.cellValue.binary}`;
          } else if (typeof this.cellValue === 'string' && isValidUrl(this.cellValue) && isImageFormat(this.cellValue)) {
            return this.cellValue;
          }

          return '';
        },
        get savedSrc() {
          if (!this.selectedCell) {
            return undefined;
          }
          return this.contentAction.retrieveFileDataUrlFromCache(this.selectedCell);
        },
        get canSave() {
          if (this.truncated && this.selectedCell) {
            return this.contentAction.isDownloadable(this.selectedCell);
          }

          return !!this.src;
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
        get shouldShowImage() {
          const isFullImage = !this.truncated && this.savedSrc;
          const isImage = this.src && !this.truncated && !this.savedSrc;

          return isFullImage || isImage;
        },
        async save() {
          try {
            if (this.truncated && this.selectedCell) {
              await this.contentAction.downloadFileData(this.selectedCell);
            } else {
              download(this.src, '', true);
            }
          } catch (exception: any) {
            this.notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
          }
        },
        async upload() {
          selectFiles(files => {
            const file = files?.item(0) ?? undefined;
            if (file && this.selectedCell) {
              this.editAction.set(this.selectedCell, createResultSetBlobValue(file));
            }
          });
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
        savedSrc: computed,
        canSave: computed,
        truncated: computed,
        model: observable.ref,
        resultIndex: observable.ref,
        save: action.bound,
        upload: action.bound,
      },
      { model, resultIndex, notificationService },
    );

    const save = data.canSave ? data.save : undefined;
    const upload = data.canUpload ? data.upload : undefined;
    const loading = model.isLoading();
    const value = data.cellValue;

    const load = async () => {
      if (!data.selectedCell) {
        return;
      }

      try {
        await data.contentAction.resolveFileDataUrl(data.selectedCell);
      } catch (exception: any) {
        notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
      }
    };

    const valueSize = bytesToSize(isResultSetContentValue(value) ? value.contentLength ?? 0 : 0);
    const isDownloadable = data.selectedCell && data.contentAction.isDownloadable(data.selectedCell);

    return (
      <Container vertical>
        <Container fill overflow center>
          {data.shouldShowImage && <img src={data.src} className={s(style, { img: true, stretch: state.stretch })} />}
          {data.truncated ? (
            <QuotaPlaceholder model={data.model} resultIndex={data.resultIndex} elementKey={data.selectedCell}>
              {isDownloadable && (
                <Button
                  disabled={loading}
                  loading={
                    !!data.contentAction.activeElement &&
                    ResultSetDataKeysUtils.isElementsKeyEqual(data.contentAction.activeElement, data.selectedCell)
                  }
                  onClick={load}
                >
                  {`${translate('ui_view')} (${valueSize})`}
                </Button>
              )}
            </QuotaPlaceholder>
          ) : null}
        </Container>
        <Tools loading={loading} stretch={state.stretch} onToggleStretch={state.toggleStretch} onSave={save} onUpload={upload} />
      </Container>
    );
  },
);
