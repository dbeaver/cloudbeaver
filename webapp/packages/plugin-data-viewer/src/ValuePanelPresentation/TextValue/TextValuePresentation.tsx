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
import styled, { css } from 'reshadow';

import { Button, useObservableRef, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
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
import { IResultSetValue, ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
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

        setContentType(contentType: string) {
          if (contentType === 'text/json') {
            contentType = 'application/json';
          }

          if (!data.activeTabs.some(tab => tab.key === contentType)) {
            contentType = 'text/plain';
          }

          this.currentContentType = contentType;
        },
        handleTabOpen(tabId: string) {
          // currentContentType may be selected automatically we don't want to change state in this case
          if (tabId !== state.currentContentType) {
            state.setContentType(tabId);
          }
        },
      }),
    );

    const data = useObservableRef(
      () => ({
        get selectAction(): ResultSetSelectAction {
          return this.model.source.getAction(this.resultIndex, ResultSetSelectAction);
        },
        get firstSelectedCell(): IResultSetElementKey | undefined {
          const activeElements = this.selectAction.getActiveElements();

          if (activeElements.length === 0) {
            return undefined;
          }

          return activeElements[0];
        },
        get editAction(): ResultSetEditAction {
          return this.model.source.getAction(resultIndex, ResultSetEditAction);
        },
        get contentAction(): ResultSetDataContentAction {
          return this.model.source.getAction(resultIndex, ResultSetDataContentAction);
        },
        get formatAction(): ResultSetFormatAction {
          return this.model.source.getAction(resultIndex, ResultSetFormatAction);
        },
        get isValueTruncated(): boolean {
          if (!this.firstSelectedCell) {
            return false;
          }

          const value = this.formatAction.get(this.firstSelectedCell);

          if (isResultSetContentValue(value)) {
            return this.contentAction.isContentTruncated(value);
          }

          return false;
        },
        get isReadonly(): boolean {
          let readonly = true;
          if (this.firstSelectedCell) {
            readonly = this.formatAction.isReadOnly(this.firstSelectedCell) || this.formatAction.isBinary(this.firstSelectedCell);
          }

          return this.model.isReadonly(this.resultIndex) || this.model.isDisabled(resultIndex) || readonly;
        },
        get value(): IResultSetValue | null {
          if (this.firstSelectedCell) {
            return this.formatAction.get(this.firstSelectedCell);
          }

          return null;
        },
        get limit(): string | undefined {
          if (this.firstSelectedCell && isResultSetContentValue(this.value) && this.isValueTruncated) {
            return bytesToSize(quotasService.getQuota('sqlBinaryPreviewMaxLength'));
          }

          return;
        },
        get valueSize(): string | undefined {
          if (this.firstSelectedCell && isResultSetContentValue(this.value) && this.isValueTruncated) {
            return bytesToSize(this.value.contentLength ?? 0);
          }

          return;
        },
        get activeTabs() {
          return textValuePresentationService.tabs.getDisplayed({ dataFormat: this.dataFormat, model: this.model, resultIndex: this.resultIndex });
        },
        handleChange(newValue: string) {
          if (this.firstSelectedCell && !this.isReadonly) {
            this.editAction.set(this.firstSelectedCell, newValue);
          }
        },
        async save() {
          if (!this.firstSelectedCell) {
            return;
          }

          try {
            await this.contentAction.downloadFileData(this.firstSelectedCell);
          } catch (exception) {
            this.notificationService.logException(exception as any, 'data_viewer_presentation_value_content_download_error');
          }
        },
      }),
      {
        limit: computed,
        formatAction: computed,
        selectAction: computed,
        firstSelectedCell: computed,
        editAction: computed,
        isReadonly: computed,
        value: computed,
        activeTabs: computed,
        contentAction: computed,
        isValueTruncated: computed,
        handleChange: action.bound,
        save: action.bound,
      },
      { model, resultIndex, dataFormat, notificationService },
    );

    if (data.activeTabs.length > 0 && !data.activeTabs.some(tab => tab.key === state.currentContentType)) {
      state.setContentType(data.activeTabs[0].key);
    }

    const canSave = !!data.firstSelectedCell && data.contentAction.isDownloadable(data.firstSelectedCell);
    const typeExtension = useMemo(() => getTypeExtension(state.currentContentType) ?? [], [state.currentContentType]);
    const extensions = useCodemirrorExtensions(undefined, typeExtension);
    const textValue = useTextValue({
      model,
      resultIndex,
      currentContentType: state.currentContentType,
    });

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
        <EditorLoader
          key={data.isReadonly ? '1' : '0'}
          value={textValue}
          readonly={data.isReadonly}
          extensions={extensions}
          onChange={data.handleChange}
        />
        {data.isValueTruncated && <QuotaPlaceholder limit={data.limit} size={data.valueSize} />}
        {canSave && (
          <tools-container>
            <Button disabled={model.isLoading()} onClick={data.save}>
              {translate('ui_download')}
            </Button>
          </tools-container>
        )}
      </container>,
    );
  },
);
