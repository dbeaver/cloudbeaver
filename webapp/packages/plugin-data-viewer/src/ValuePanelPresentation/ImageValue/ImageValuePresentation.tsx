/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { QuotasService } from '@cloudbeaver/core-app';
import { Button, IconOrImage, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { bytesToSize, download, getMIME, isImageFormat, isValidUrl } from '@cloudbeaver/core-utils';

import type { IResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetContentValue';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetDataKeysUtils } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataKeysUtils';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
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
        <tools>
          <tools-action
            as='button'
            title={translate('ui_processing_save')}
            disabled={loading}
            onClick={onSave}
          >
            <IconOrImage icon='/icons/save.svg' />
          </tools-action>
        </tools>
      )}
      {onToggleStretch && (
        <tools>
          <tools-action
            as='button'
            title={translate('data_viewer_presentation_value_image_fit')}
            disabled={stretch}
            onClick={onToggleStretch}
          >
            <IconOrImage icon='img-fit-size' />
          </tools-action>
          <tools-action
            as='button'
            title={translate('data_viewer_presentation_value_image_original_size')}
            disabled={!stretch}
            onClick={onToggleStretch}
          >
            <IconOrImage icon='img-original-size' />
          </tools-action>
        </tools>
      )}
    </tools-container>
  );
});

export const ImageValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(function ImageValuePresentation({
  model,
  resultIndex,
}) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const quotasService = useService(QuotasService);
  const style = useStyles(styles);

  const state = useObservableRef(() => ({
    get selectedCell() {
      const selection = this.model.source.getAction(this.resultIndex, ResultSetSelectAction);
      const focusCell = selection.getFocusedElement();

      return selection.elements[0] || focusCell;
    },
    get cellValue() {
      const view = this.model.source.getAction(this.resultIndex, ResultSetViewAction);
      const cellValue = view.getCellValue(this.selectedCell);

      return cellValue;
    },
    get src() {
      if (this.savedSrc) {
        return this.savedSrc;
      }

      if (isResultSetContentValue(this.cellValue) && this.cellValue.binary) {
        return `data:${getMIME(this.cellValue.binary)};base64,${this.cellValue.binary}`;
      } else if (typeof this.cellValue === 'string' && isValidUrl(this.cellValue) && isImageFormat(this.cellValue)) {
        return this.cellValue;
      }

      return '';
    },
    get savedSrc() {
      return this.model.source.dataManager.retrieveFileDataUrlFromCache(this.selectedCell, this.resultIndex);
    },
    get content() {
      return this.model.source.dataManager.isContent(this.selectedCell, this.resultIndex);
    },
    get canSave() {
      return this.content || !!this.src;
    },
    get truncated() {
      return isResultSetContentValue(this.cellValue)
        && this.model.source.dataManager.isContentTruncated(this.cellValue);
    },
    stretch: false,
    toggleStretch() {
      this.stretch = !this.stretch;
    },
    async save() {
      try {
        if (!this.content) {
          download(this.src, '', true);
        } else {
          await this.model.source.dataManager.downloadFileData(this.selectedCell, this.resultIndex);
        }
      } catch (exception: any) {
        this.notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
      }
    },
  }), {
    selectedCell: computed,
    cellValue: computed,
    src: computed,
    savedSrc: computed,
    canSave: computed,
    truncated: computed,
    stretch: observable.ref,
    toggleStretch: action.bound,
    save: action.bound,
  }, { model, resultIndex, notificationService });

  const save = state.canSave ? state.save : undefined;
  const loading = model.isLoading();

  if (state.truncated && !state.savedSrc) {
    const limit = bytesToSize(quotasService.getQuota('sqlBinaryPreviewMaxLength'));
    const valueSize = bytesToSize((state.cellValue as unknown as IResultSetContentValue).contentLength ?? 0);

    const load = async () => {
      try {
        await model.source.dataManager.resolveFileDataUrl(state.selectedCell, resultIndex);
      } catch (exception: any) {
        notificationService.logException(exception, 'data_viewer_presentation_value_content_download_error');
      }
    };

    return styled(style)(
      <container>
        <QuotaPlaceholder limit={limit} size={valueSize}>
          <Button
            disabled={loading}
            loading={!!model.source.dataManager.activeElement && ResultSetDataKeysUtils.isElementsKeyEqual(
              model.source.dataManager.activeElement, state.selectedCell)}
            onClick={load}
          >
            {translate('ui_download')}
          </Button>
        </QuotaPlaceholder>
        <Tools loading={loading} onSave={save} />
      </container>
    );
  }

  return styled(style)(
    <container>
      <image>
        <img src={state.src} {...use({ stretch: state.stretch })} />
      </image>
      <Tools
        loading={loading}
        stretch={state.stretch}
        onToggleStretch={state.toggleStretch}
        onSave={save}
      />
    </container>
  );
});