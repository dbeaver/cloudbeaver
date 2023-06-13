/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Button, useObservableRef, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { QuotasService } from '@cloudbeaver/core-root';
import { BASE_TAB_STYLES, TabContainerPanelComponent, TabList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { bytesToSize } from '@cloudbeaver/core-utils';
import { EditorLoader } from '@cloudbeaver/plugin-codemirror6';

import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction';
import { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { QuotaPlaceholder } from '../QuotaPlaceholder';
import { VALUE_PANEL_TOOLS_STYLES } from '../ValuePanelTools/VALUE_PANEL_TOOLS_STYLES';
import { getTypeExtension } from './getTypeExtension';
import { TextValuePresentationService } from './TextValuePresentationService';
import { useAutoFormat } from './useAutoFormat';

const styles = css`
  Tab {
    composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
  }
  container {
    display: flex;
    gap: 16px;
    flex-direction: column;
    overflow: auto;
    flex: 1;
  }
  actions {
    display: flex;
    justify-content: center;
    flex: 0;
  }
  EditorLoader {
    border-radius: var(--theme-group-element-radius);
  }
  EditorLoader {
    flex: 1;
    overflow: auto;
  }
  TabList {
    composes: theme-border-color-background theme-background-background from global;
    overflow: auto;
    border-radius: var(--theme-group-element-radius);

    & Tab {
      border-bottom: 0;

      &:global([aria-selected='false']) {
        border-bottom: 0 !important;
      }
    }
  }
`;

export const TextValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function TextValuePresentation({ model, resultIndex }) {
    const translate = useTranslate();
    const notificationService = useService(NotificationService);
    const quotasService = useService(QuotasService);
    const textValuePresentationService = useService(TextValuePresentationService);
    const style = useStyles(styles, BASE_CONTAINERS_STYLES, UNDERLINE_TAB_STYLES, VALUE_PANEL_TOOLS_STYLES);

    const state = useObservableRef(
      () => ({
        currentContentType: 'text/plain',
        lastContentType: 'text/plain',

        setContentType(type: string) {
          this.currentContentType = type;
        },
        setDefaultContentType(type: string) {
          this.currentContentType = type;
          this.lastContentType = type;
        },
      }),
      {
        currentContentType: observable.ref,
        lastContentType: observable.ref,
      },
      false,
      ['setContentType', 'setDefaultContentType'],
    );

    const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
    const editor = model.source.getAction(resultIndex, ResultSetEditAction);
    const content = model.source.getAction(resultIndex, ResultSetDataContentAction);

    const focusCell = selection.getFocusedElement();

    let stringValue = '';
    let contentType = 'text/plain';
    let firstSelectedCell: IResultSetElementKey | undefined;
    let readonly = true;
    let valueTruncated = false;
    let limit: string | undefined;
    let valueSize: string | undefined;

    if (selection.elements.length > 0 || focusCell) {
      const view = model.source.getAction(resultIndex, ResultSetViewAction);
      const format = model.source.getAction(resultIndex, ResultSetFormatAction);

      firstSelectedCell = selection.elements[0] || focusCell;

      const value = view.getCellValue(firstSelectedCell) ?? '';

      stringValue = format.getText(value) ?? '';
      readonly = format.isReadOnly(firstSelectedCell);

      if (isResultSetContentValue(value)) {
        valueTruncated = content.isContentTruncated(value);

        if (valueTruncated) {
          limit = bytesToSize(quotasService.getQuota('sqlBinaryPreviewMaxLength'));
          valueSize = bytesToSize(value.contentLength ?? 0);
        }

        if (value.contentType) {
          contentType = value.contentType;

          if (contentType === 'text/json') {
            contentType = 'application/json';
          }

          if (!textValuePresentationService.tabs.has(contentType)) {
            contentType = 'text/plain';
          }
        }
      }
    }

    readonly = model.isReadonly(resultIndex) || model.isDisabled(resultIndex) || readonly;

    if (contentType !== state.lastContentType) {
      state.setDefaultContentType(contentType);
    }

    const formatter = useAutoFormat();

    function handleChange(newValue: string) {
      if (firstSelectedCell && !readonly) {
        editor.set(firstSelectedCell, newValue);
      }
    }

    async function save() {
      if (!firstSelectedCell) {
        return;
      }

      try {
        await content.downloadFileData(firstSelectedCell);
      } catch (exception) {
        notificationService.logException(exception as any, 'data_viewer_presentation_value_content_download_error');
      }
    }

    const autoFormat = !!firstSelectedCell && !editor.isElementEdited(firstSelectedCell);
    const canSave = !!firstSelectedCell && content.isDownloadable(firstSelectedCell);
    const typeExtension = useMemo(() => getTypeExtension(state.currentContentType) ?? [], [state.currentContentType]);

    const value = autoFormat ? formatter.format(state.currentContentType, stringValue) : stringValue;

    return styled(style)(
      <container>
        <actions>
          <TabsState
            container={textValuePresentationService.tabs}
            currentTabId={state.currentContentType}
            lazy
            onChange={tab => state.setContentType(tab.tabId)}
          >
            <TabList style={[BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES]} />
          </TabsState>
        </actions>
        <EditorLoader
          key={readonly ? '1' : '0'}
          value={value}
          readonly={readonly}
          extensions={[typeExtension]}
          onChange={value => handleChange(value)}
        />
        {valueTruncated && <QuotaPlaceholder limit={limit} size={valueSize} />}
        {canSave && (
          <tools-container>
            <Button disabled={model.isLoading()} onClick={save}>
              {translate('ui_download')}
            </Button>
          </tools-container>
        )}
      </container>,
    );
  },
);
