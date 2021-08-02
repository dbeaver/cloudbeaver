/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, TabContainerPanelComponent, TabList, TabsState, TextareaNew, UNDERLINE_TAB_STYLES, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';
import { CodeEditorLoader } from '@cloudbeaver/plugin-codemirror';

import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetElementKey';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { TextValuePresentationService } from './TextValuePresentationService';

const styles = composes(
  css`
    TabList {
      composes: theme-border-color-background theme-background-background from global;
    }
    Tab {
      composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
    }
  `,
  css`
    container {
      display: flex;
      flex-direction: column;
      overflow: auto;
      flex: 1;
    }
    content-type {
      display: flex;
      justify-content: center;
      flex: 0;
      padding: 0 8px;
      padding-bottom: 16px;
    }
    TextareaNew {
      flex: 1;
    }
    CodeEditorLoader {
      flex: 1;
      overflow: auto;
    }
    TabList {
      overflow: auto;
      border-radius: 16px;

      & Tab {
        border-bottom: 0;

        &:global([aria-selected="false"]) {
          border-bottom: 0 !important;
        }
      }
    }
  `
);

export const TextValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(function TextValuePresentation({
  model,
  resultIndex,
}) {
  const textValuePresentationService = useService(TextValuePresentationService);
  const style = useStyles(styles, BASE_CONTAINERS_STYLES, UNDERLINE_TAB_STYLES);
  const state = useObjectRef({
    currentContentType: 'text/plain',
    lastContentType: 'text/plain',

    setContentType(type: string) {
      this.currentContentType = type;
    },
    setDefaultContentType(type: string) {
      this.currentContentType = type;
      this.lastContentType = type;
    },
  }, {}, {
    currentContentType: observable,
    lastContentType: observable,
  }, ['setContentType', 'setDefaultContentType']);

  const result = model.getResult(resultIndex);
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);

  const selectedCells = selection.getSelectedElements();
  const focusCell = selection.getFocusedElement();

  let stringValue = '';
  let contentType = 'text/plain';
  let firstSelectedCell: Required<IResultSetElementKey> | undefined;
  let readonly = true;

  if (result?.data?.rows && (selectedCells.length > 0 || focusCell)) {
    const format = model.source.getAction(resultIndex, ResultSetFormatAction);

    firstSelectedCell = selectedCells[0] || focusCell;

    const value = model.source
      .getEditor(resultIndex)
      .getCell(firstSelectedCell.row, firstSelectedCell.column);

    stringValue = format.getText(value) ?? '';
    readonly = format.isReadOnly(firstSelectedCell);

    if (isResultSetContentValue(value)) {
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

  readonly = model.isReadonly() || model.isDisabled(resultIndex) || readonly;

  if (contentType !== state.lastContentType) {
    state.setDefaultContentType(contentType);
  }

  const handleChange = (newValue: string) => {
    if (firstSelectedCell && !readonly) {
      model.source
        .getEditor(resultIndex)
        .setCell(firstSelectedCell.row, firstSelectedCell.column, newValue);
    }
  };

  const useCodeEditor = state.currentContentType !== 'text/plain';

  return styled(style)(
    <container>
      <content-type>
        <TabsState
          container={textValuePresentationService.tabs}
          currentTabId={state.currentContentType}
          lazy
          onChange={tab => state.setContentType(tab.tabId)}
        >
          <TabList style={[styles, UNDERLINE_TAB_STYLES]} />
        </TabsState>
      </content-type>
      {useCodeEditor ? (
        <CodeEditorLoader
          readonly={readonly}
          value={stringValue}
          options={{
            mode: state.currentContentType,
            theme: 'material',
            lineNumbers: true,
            indentWithTabs: true,
            smartIndent: true,
            lineWrapping: false,
          }}
          onBeforeChange={(editor, data, value) => handleChange(value)}
        />
      ) : (
        <TextareaNew
          name="value"
          rows={3}
          value={stringValue}
          readOnly={readonly}
          embedded
          onChange={handleChange}
        />
      )}
    </container>
  );
});
