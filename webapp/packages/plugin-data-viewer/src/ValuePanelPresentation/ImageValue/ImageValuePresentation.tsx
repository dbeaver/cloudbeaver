/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { ActionIconButtonStyles, Button, Container, Fill, IconButton, s, useObservableRef, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { selectFiles } from '@cloudbeaver/core-browser';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { QuotasService } from '@cloudbeaver/core-root';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { bytesToSize, download, getMIME, isImageFormat, isValidUrl } from '@cloudbeaver/core-utils';

import { createResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/createResultSetBlobValue';
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
        {onSave && (
          <IconButton
            title={translate('ui_download')}
            className={ActionIconButtonStyles.actionIconButton}
            name="/icons/export.svg"
            disabled={loading}
            img
            onClick={onSave}
          />
        )}
        {onUpload && (
          <IconButton
            title={translate('ui_upload')}
            className={ActionIconButtonStyles.actionIconButton}
            name="/icons/import.svg"
            disabled={loading}
            img
            onClick={onUpload}
          />
        )}
      </Container>
      <Fill />
      {onToggleStretch && (
        <Container keepSize flexEnd center>
          <IconButton
            title={translate(stretch ? 'data_viewer_presentation_value_image_original_size' : 'data_viewer_presentation_value_image_fit')}
            className={ActionIconButtonStyles.actionIconButton}
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
    const quotasService = useService(QuotasService);
    const style = useS(styles);

    const state = useObservableRef(
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
        get selectedCell() {
          const focusCell = this.selectAction.getFocusedElement();

          return this.selectAction.elements[0] || focusCell;
        },
        get cellValue() {
          return this.formatAction.get(this.selectedCell);
        },
        get src() {
          if (this.savedSrc) {
            return this.savedSrc;
          }

          if (isResultSetBlobValue(this.cellValue)) {
            return URL.createObjectURL(this.cellValue.blob);
          }

          if (isResultSetContentValue(this.cellValue) && this.cellValue.binary) {
            return `data:${getMIME(this.cellValue.binary)};base64,${this.cellValue.binary}`;
          } else if (typeof this.cellValue === 'string' && isValidUrl(this.cellValue) && isImageFormat(this.cellValue)) {
            return this.cellValue;
          }

          return '';
        },
        get savedSrc() {
          return this.contentAction.retrieveFileDataUrlFromCache(this.selectedCell);
        },
        get canSave() {
          if (this.truncated) {
            return this.contentAction.isDownloadable(this.selectedCell);
          }

          return !!this.src;
        },
        get canUpload() {
          return this.formatAction.isBinary(this.selectedCell);
        },
        get truncated() {
          if (isResultSetFileValue(this.cellValue)) {
            return false;
          }
          if (isResultSetContentValue(this.cellValue)) {
            if (this.cellValue.binary) {
              return this.contentAction.isContentTruncated(this.cellValue);
            }
          }
          return false;
        },
        stretch: false,
        toggleStretch() {
          this.stretch = !this.stretch;
        },
        async save() {
          try {
            if (this.truncated) {
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
            if (file) {
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
        stretch: observable.ref,
        model: observable.ref,
        resultIndex: observable.ref,
        toggleStretch: action.bound,
        save: action.bound,
        upload: action.bound,
      },
      { model, resultIndex, notificationService },
    );

    const save = state.canSave ? state.save : undefined;
    const upload = state.canUpload ? state.upload : undefined;
    const loading = model.isLoading();
    const value = state.cellValue;

    if (state.truncated && !state.savedSrc && isResultSetContentValue(value)) {
      const limit = bytesToSize(quotasService.getQuota('sqlBinaryPreviewMaxLength'));
      const valueSize = bytesToSize(value.contentLength ?? 0);

      const load = async () => {
        try {
          await state.contentAction.resolveFileDataUrl(state.selectedCell);
        } catch (exception: any) {
          notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
        }
      };

      return (
        <Container vertical>
          <Container fill overflow center>
            <QuotaPlaceholder limit={limit} size={valueSize}>
              {state.contentAction.isDownloadable(state.selectedCell) && (
                <Button
                  disabled={loading}
                  loading={
                    !!state.contentAction.activeElement &&
                    ResultSetDataKeysUtils.isElementsKeyEqual(state.contentAction.activeElement, state.selectedCell)
                  }
                  onClick={load}
                >
                  {translate('ui_view')}
                </Button>
              )}
            </QuotaPlaceholder>
          </Container>
          <Tools loading={loading} onSave={save} onUpload={upload} />
        </Container>
      );
    }

    return (
      <Container vertical>
        <Container fill overflow center>
          <img src={state.src} className={s(style, { img: true, stretch: state.stretch })} />
        </Container>
        <Tools loading={loading} stretch={state.stretch} onToggleStretch={state.toggleStretch} onSave={save} onUpload={upload} />
      </Container>
    );
  },
);
