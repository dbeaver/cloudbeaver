/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { ActionIconButton, Container, Fill, Group, Loader, s, SContext, StyleRegistry, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { TabContainerPanelComponent, TabList, TabsState, TabStyles, TabUnderlineStyleRegistry, useTabLocalState } from '@cloudbeaver/core-ui';

import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { useResultSetActions } from '../../DatabaseDataModel/Actions/ResultSet/useResultSetActions';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { getDefaultLineWrapping } from './getDefaultLineWrapping';
import styles from './shared/TextValuePresentation.m.css';
import TextValuePresentationTab from './shared/TextValuePresentationTab.m.css';
import { TextValueEditor } from './TextValueEditor';
import { TextValuePresentationService } from './TextValuePresentationService';
import { TextValueTruncatedMessage } from './TextValueTruncatedMessage';
import { useTextValue } from './useTextValue';

const tabRegistry: StyleRegistry = [...TabUnderlineStyleRegistry, [TabStyles, { mode: 'append', styles: [TextValuePresentationTab] }]];

export const TextValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function TextValuePresentation({ model, resultIndex, dataFormat }) {
    const translate = useTranslate();
    const notificationService = useService(NotificationService);
    const textValuePresentationService = useService(TextValuePresentationService);
    const style = useS(styles);
    const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
    const activeElements = selection.getActiveElements();
    const firstSelectedCell = activeElements.length ? activeElements[0] : undefined;
    const { contentAction, editAction, formatAction } = useResultSetActions({
      model,
      resultIndex,
    });
    const state = useTabLocalState(() =>
      observable({
        lineWrapping: null as boolean | null,
        currentContentType: null as string | null,

        setContentType(contentType: string | null) {
          this.currentContentType = contentType;
        },
        setLineWrapping(lineWrapping: boolean | null) {
          this.lineWrapping = lineWrapping;
        },
      }),
    );

    const textValueInfo = useTextValue({
      model,
      resultIndex,
      dataFormat,
      currentContentType: state.currentContentType,
      elementKey: firstSelectedCell,
    });
    const autoLineWrapping = getDefaultLineWrapping(textValueInfo.contentType);
    const lineWrapping = state.lineWrapping ?? autoLineWrapping;

    const isSelectedCellReadonly =
      firstSelectedCell &&
      (formatAction.isReadOnly(firstSelectedCell) ||
        formatAction.isBinary(firstSelectedCell) ||
        formatAction.isGeometry(firstSelectedCell) ||
        contentAction.isTextTruncated(firstSelectedCell));
    const isReadonlyByResultIndex = model.isReadonly(resultIndex) || model.isDisabled(resultIndex) || !firstSelectedCell;
    const isReadonly = isSelectedCellReadonly || isReadonlyByResultIndex;
    const canSave = firstSelectedCell && contentAction.isDownloadable(firstSelectedCell);

    function valueChangeHandler(newValue: string) {
      if (firstSelectedCell && !isReadonly) {
        editAction.set(firstSelectedCell, newValue);
      }
    }

    async function saveHandler() {
      if (!firstSelectedCell) {
        return;
      }

      try {
        await contentAction.downloadFileData(firstSelectedCell);
      } catch (exception) {
        notificationService.logException(exception as any, 'data_viewer_presentation_value_content_download_error');
      }
    }

    async function selectTabHandler(tabId: string) {
      // currentContentType may be selected automatically we don't want to change state in this case
      if (tabId !== textValueInfo.contentType) {
        state.setContentType(tabId);
      }
    }

    function toggleLineWrappingHandler() {
      state.setLineWrapping(!lineWrapping);
    }

    return (
      <Container vertical gap dense overflow>
        <Container keepSize center overflow>
          <Container keepSize>
            <TabsState
              dataFormat={dataFormat}
              resultIndex={resultIndex}
              container={textValuePresentationService.tabs}
              currentTabId={textValueInfo.contentType}
              model={model}
              lazy
              onChange={tab => selectTabHandler(tab.tabId)}
            >
              <SContext registry={tabRegistry}>
                <TabList className={s(style, { tabList: true })} />
              </SContext>
            </TabsState>
          </Container>
        </Container>
        <Loader suspense>
          <Group overflow maximum box>
            <TextValueEditor
              contentType={textValueInfo.contentType}
              lineWrapping={lineWrapping}
              readonly={isReadonly}
              valueGetter={textValueInfo.valueGetter}
              onChange={valueChangeHandler}
            />
          </Group>
        </Loader>
        {firstSelectedCell && <TextValueTruncatedMessage model={model} resultIndex={resultIndex} elementKey={firstSelectedCell} />}
        <Container keepSize overflow>
          <Container keepSize noWrap>
            {canSave && (
              <ActionIconButton title={translate('ui_download')} name="/icons/export.svg" disabled={model.isLoading()} img onClick={saveHandler} />
            )}
            <ActionIconButton
              title={translate(
                lineWrapping ? 'data_viewer_presentation_value_text_line_wrapping_no_wrap' : 'data_viewer_presentation_value_text_line_wrapping_wrap',
              )}
              name={`/icons/plugin_data_viewer_${lineWrapping ? 'no_wrap' : 'wrap'}_lines.svg`}
              img
              onClick={toggleLineWrappingHandler}
            />
          </Container>
        </Container>
      </Container>
    );
  },
);
