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

import { Button, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { QuotasService } from '@cloudbeaver/core-root';
import { BASE_TAB_STYLES, TabContainerPanelComponent, TabList, TabsState, UNDERLINE_TAB_STYLES, useTabLocalState } from '@cloudbeaver/core-ui';
import { bytesToSize } from '@cloudbeaver/core-utils';
import { EditorLoader, useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';

import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction';
import { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { QuotaPlaceholder } from '../QuotaPlaceholder';
import { VALUE_PANEL_TOOLS_STYLES } from '../ValuePanelTools/VALUE_PANEL_TOOLS_STYLES';
import { getTypeExtension } from './getTypeExtension';
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

export const TextValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function TextValuePresentation({ model, resultIndex, dataFormat }) {
    const translate = useTranslate();
    const notificationService = useService(NotificationService);
    const quotasService = useService(QuotasService);
    const textValuePresentationService = useService(TextValuePresentationService);
    const style = useStyles(styles, UNDERLINE_TAB_STYLES, VALUE_PANEL_TOOLS_STYLES);

    const state = useTabLocalState(() =>
      observable({
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
    );

    const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
    const editor = model.source.getAction(resultIndex, ResultSetEditAction);
    const content = model.source.getAction(resultIndex, ResultSetDataContentAction);

    const activeElements = selection.getActiveElements();
    const activeTabs = textValuePresentationService.tabs.getDisplayed({ dataFormat, model, resultIndex });

    let contentType = 'text/plain';
    let firstSelectedCell: IResultSetElementKey | undefined;
    let readonly = true;
    let valueTruncated = false;
    let limit: string | undefined;
    let valueSize: string | undefined;

    if (activeElements.length > 0) {
      const format = model.source.getAction(resultIndex, ResultSetFormatAction);

      firstSelectedCell = activeElements[0];

      const value = format.get(firstSelectedCell);
      readonly = format.isReadOnly(firstSelectedCell) || format.isBinary(firstSelectedCell);

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

          if (!activeTabs.some(tab => tab.key === contentType)) {
            contentType = 'text/plain';
          }
        }
      }
    }

    readonly = model.isReadonly(resultIndex) || model.isDisabled(resultIndex) || readonly;

    if (contentType !== state.lastContentType) {
      state.setDefaultContentType(contentType);
    }

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

    let currentContentType = state.currentContentType;

    if (activeTabs.length > 0 && !activeTabs.some(tab => tab.key === currentContentType)) {
      currentContentType = activeTabs[0].key;
    }

    const canSave = !!firstSelectedCell && content.isDownloadable(firstSelectedCell);
    const typeExtension = useMemo(() => getTypeExtension(currentContentType) ?? [], [currentContentType]);
    const extensions = useCodemirrorExtensions(undefined, typeExtension);

    const value = useTextValue({
      model,
      resultIndex,
      currentContentType,
    });

    function handleTabOpen(tabId: string) {
      // currentContentType may be selected automatically we don't want to change state in this case
      if (tabId !== currentContentType) {
        state.setContentType(tabId);
      }
    }

    return styled(style)(
      <container>
        <actions>
          <TabsState
            dataFormat={dataFormat}
            resultIndex={resultIndex}
            container={textValuePresentationService.tabs}
            currentTabId={currentContentType}
            model={model}
            lazy
            onChange={tab => handleTabOpen(tab.tabId)}
          >
            <TabList style={[BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES]} />
          </TabsState>
        </actions>
        <EditorLoader key={readonly ? '1' : '0'} value={value} readonly={readonly} extensions={extensions} onChange={value => handleChange(value)} />
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
