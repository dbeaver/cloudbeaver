/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { Button, s, useS, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { QuotasService } from '@cloudbeaver/core-root';
import { BASE_TAB_STYLES, TabContainerPanelComponent, TabList, TabsState, UNDERLINE_TAB_STYLES, useTabLocalState } from '@cloudbeaver/core-ui';
import { bytesToSize, isNotNullDefined } from '@cloudbeaver/core-utils';
import { EditorLoader, useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';

import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { useResultActions } from '../../DatabaseDataModel/Actions/ResultSet/useResultActions';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { QuotaPlaceholder } from '../QuotaPlaceholder';
import { VALUE_PANEL_TOOLS_STYLES } from '../ValuePanelTools/VALUE_PANEL_TOOLS_STYLES';
import { getTypeExtension } from './getTypeExtension';
import moduleStyles from './TextValuePresentation.m.css';
import { TextValuePresentationService } from './TextValuePresentationService';
import { useTextValue } from './useTextValue';

const styles = css`
  Tab {
    composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
  }
  container {
    display: flex;
    gap: 8px;
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

const TEXT_PLAIN_TYPE = 'text/plain';
const TEXT_JSON_TYPE = 'text/json';
const APPLICATION_JSON_TYPE = 'application/json';

export const TextValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function TextValuePresentation({ model, resultIndex, dataFormat }) {
    const translate = useTranslate();
    const notificationService = useService(NotificationService);
    const quotasService = useService(QuotasService);
    const textValuePresentationService = useService(TextValuePresentationService);
    const style = useStyles(styles, UNDERLINE_TAB_STYLES, VALUE_PANEL_TOOLS_STYLES);
    const moduleStyle = useS(moduleStyles);
    const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
    const activeElements = selection.getActiveElements();
    const firstSelectedCell = activeElements?.[0];
    const activeTabs = textValuePresentationService.tabs.getDisplayed({
      dataFormat: dataFormat,
      model: model,
      resultIndex: resultIndex,
    });
    const { contentAction, editAction, formatAction } = useResultActions({
      model,
      resultIndex,
    });
    const contentValue = firstSelectedCell ? formatAction.get(firstSelectedCell) : null;
    const state = useTabLocalState(() =>
      observable({
        currentContentType: TEXT_PLAIN_TYPE,

        setContentType(contentType: string) {
          if (contentType === TEXT_JSON_TYPE) {
            contentType = APPLICATION_JSON_TYPE;
          }

          this.currentContentType = contentType;
        },
        handleTabOpen(tabId: string) {
          // currentContentType may be selected automatically we don't want to change state in this case
          if (tabId !== this.currentContentType) {
            this.setContentType(tabId);
          }
        },
      }),
    );
    const { textValue, isTruncated, isTextColumn, pasteFullText } = useTextValue({
      model,
      resultIndex,
      currentContentType: state.currentContentType,
    });
    const isSelectedCellReadonly = firstSelectedCell && (formatAction.isReadOnly(firstSelectedCell) || formatAction.isBinary(firstSelectedCell));
    const isReadonlyByResultIndex = model.isReadonly(resultIndex) || model.isDisabled(resultIndex) || !firstSelectedCell;
    const isReadonly = isSelectedCellReadonly || isReadonlyByResultIndex;
    const valueSize =
      isResultSetContentValue(contentValue) && isNotNullDefined(contentValue.contentLength) ? bytesToSize(contentValue.contentLength) : undefined;
    const limit = bytesToSize(quotasService.getQuota('sqlBinaryPreviewMaxLength'));
    const canSave = firstSelectedCell && contentAction.isDownloadable(firstSelectedCell);
    const shouldShowPasteButton = isTextColumn && isTruncated;
    const typeExtension = useMemo(() => getTypeExtension(state.currentContentType) ?? [], [state.currentContentType]);
    const extensions = useCodemirrorExtensions(undefined, typeExtension);

    function handleChange(newValue: string) {
      if (firstSelectedCell && !isReadonly) {
        editAction.set(firstSelectedCell, newValue);
      }
    }

    async function save() {
      if (!firstSelectedCell) {
        return;
      }

      try {
        await contentAction.downloadFileData(firstSelectedCell);
      } catch (exception) {
        notificationService.logException(exception as any, 'data_viewer_presentation_value_content_download_error');
      }
    }

    if (!activeTabs.some(tab => tab.key === state.currentContentType)) {
      const contentType = activeTabs.length > 0 && activeTabs[0].key ? activeTabs[0].key : TEXT_PLAIN_TYPE;
      state.setContentType(contentType);
    }

    return styled(style)(
      <container>
        <actions>
          <TabsState
            dataFormat={dataFormat}
            resultIndex={resultIndex}
            container={textValuePresentationService.tabs}
            currentTabId={state.currentContentType}
            model={model}
            lazy
            onChange={tab => state.handleTabOpen(tab.tabId)}
          >
            <TabList style={[BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES]} />
          </TabsState>
        </actions>
        <EditorLoader key={isReadonly ? '1' : '0'} value={textValue} readonly={isReadonly} extensions={extensions} onChange={handleChange} />
        {isTruncated && <QuotaPlaceholder limit={limit} size={valueSize} />}
        <div className={s(moduleStyle, { toolsContainer: true })}>
          {canSave && (
            <Button disabled={model.isLoading()} onClick={save}>
              {translate('ui_download')}
            </Button>
          )}
          {shouldShowPasteButton && (
            <Button disabled={model.isLoading()} onClick={pasteFullText}>
              {translate('data_viewer_presentation_value_content_full_text_button')}
            </Button>
          )}
        </div>
      </container>,
    );
  },
);
