/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { Button, IconOrImage, useObservableRef, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { QuotasService } from '@cloudbeaver/core-root';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { bytesToSize, download, getMIME, isImageFormat, isValidUrl } from '@cloudbeaver/core-utils';

import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { isResultSetFileValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetFileValue';
import { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction';
import { ResultSetDataKeysUtils } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataKeysUtils';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { QuotaPlaceholder } from '../QuotaPlaceholder';
import { VALUE_PANEL_TOOLS_STYLES } from '../ValuePanelTools/VALUE_PANEL_TOOLS_STYLES';

const styles = css`
  img {
    margin: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;

    &[|stretch] {
      margin: unset;
    }
  }

  container {
    display: flex;
    gap: 16px;
    flex: 1;
    flex-direction: column;
  }

  image {
    flex: 1;
    display: flex;
    overflow: auto;
  }
`;

interface IToolsProps {
  loading?: boolean;
  stretch?: boolean;
  onToggleStretch?: () => void;
  onSave?: () => void;
}

const Tools = observer<IToolsProps>(function Tools({ loading, stretch, onToggleStretch, onSave }) {
  const translate = useTranslate();

  return styled(VALUE_PANEL_TOOLS_STYLES)(
    <tools-container>
      {onSave && (
        <Button disabled={loading} onClick={onSave}>
          {translate('ui_download')}
        </Button>
      )}
      {onToggleStretch && (
        <tools>
          <tools-action as="button" title={translate('data_viewer_presentation_value_image_fit')} disabled={stretch} onClick={onToggleStretch}>
            <IconOrImage icon="img-fit-size" />
          </tools-action>
          <tools-action
            as="button"
            title={translate('data_viewer_presentation_value_image_original_size')}
            disabled={!stretch}
            onClick={onToggleStretch}
          >
            <IconOrImage icon="img-original-size" />
          </tools-action>
        </tools>
      )}
    </tools-container>,
  );
});

export const ImageValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function ImageValuePresentation({ model, resultIndex }) {
    const translate = useTranslate();
    const notificationService = useService(NotificationService);
    const quotasService = useService(QuotasService);
    const style = useStyles(styles);

    const content = model.source.getAction(resultIndex, ResultSetDataContentAction);

    const state = useObservableRef(
      () => ({
        get selectedCell() {
          const selection = this.model.source.getAction(this.resultIndex, ResultSetSelectAction);
          const focusCell = selection.getFocusedElement();

          return selection.elements[0] || focusCell;
        },
        get cellValue() {
          const format = this.model.source.getAction(this.resultIndex, ResultSetFormatAction);

          return format.get(this.selectedCell);
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
          return content.retrieveFileDataUrlFromCache(this.selectedCell);
        },
        get canSave() {
          if (this.truncated) {
            return content.isDownloadable(this.selectedCell);
          }

          return !!this.src;
        },
        get truncated() {
          if (isResultSetFileValue(this.cellValue)) {
            return false;
          }
          if (isResultSetContentValue(this.cellValue)) {
            if (this.cellValue.binary) {
              return content.isContentTruncated(this.cellValue);
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
              await content.downloadFileData(this.selectedCell);
            } else {
              download(this.src, '', true);
            }
          } catch (exception: any) {
            this.notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
          }
        },
      }),
      {
        selectedCell: computed,
        cellValue: computed,
        src: computed,
        savedSrc: computed,
        canSave: computed,
        truncated: computed,
        stretch: observable.ref,
        model: observable.ref,
        resultIndex: observable.ref,
        toggleStretch: action.bound,
        save: action.bound,
      },
      { model, resultIndex, notificationService },
    );

    const save = state.canSave ? state.save : undefined;
    const loading = model.isLoading();
    const value = state.cellValue;

    if (state.truncated && !state.savedSrc && isResultSetContentValue(value)) {
      const limit = bytesToSize(quotasService.getQuota('sqlBinaryPreviewMaxLength'));
      const valueSize = bytesToSize(value.contentLength ?? 0);

      const load = async () => {
        try {
          await content.resolveFileDataUrl(state.selectedCell);
        } catch (exception: any) {
          notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
        }
      };

      return styled(style)(
        <container>
          <QuotaPlaceholder limit={limit} size={valueSize}>
            {content.isDownloadable(state.selectedCell) && (
              <Button
                disabled={loading}
                loading={!!content.activeElement && ResultSetDataKeysUtils.isElementsKeyEqual(content.activeElement, state.selectedCell)}
                onClick={load}
              >
                {translate('ui_view')}
              </Button>
            )}
          </QuotaPlaceholder>
          <Tools loading={loading} onSave={save} />
        </container>,
      );
    }

    return styled(style)(
      <container>
        <image>
          <img src={state.src} {...use({ stretch: state.stretch })} />
        </image>
        <Tools loading={loading} stretch={state.stretch} onToggleStretch={state.toggleStretch} onSave={save} />
      </container>,
    );
  },
);
