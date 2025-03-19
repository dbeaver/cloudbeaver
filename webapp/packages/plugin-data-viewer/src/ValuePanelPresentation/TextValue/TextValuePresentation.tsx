/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { ActionIconButton, Container, Group, Loader, s, SContext, type StyleRegistry, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { type TabContainerPanelComponent, TabList, TabsState, TabStyles, useTabLocalState } from '@cloudbeaver/core-ui';

import { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction.js';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction.js';
import { DataViewerService } from '../../DataViewerService.js';
import { isResultSetDataModel } from '../../ResultSet/isResultSetDataModel.js';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService.js';
import { getDefaultLineWrapping } from './getDefaultLineWrapping.js';
import { isTextValueReadonly } from './isTextValueReadonly.js';
import styles from './shared/TextValuePresentation.module.css';
import TextValuePresentationTab from './shared/TextValuePresentationTab.module.css';
import { TextValueEditor } from './TextValueEditor.js';
import { TextValuePresentationService } from './TextValuePresentationService.js';
import { TextValueTruncatedMessage } from './TextValueTruncatedMessage.js';
import { useAutoContentType } from './useAutoContentType.js';
import { useTextValueGetter } from './useTextValueGetter.js';

const tabRegistry: StyleRegistry = [[TabStyles, { mode: 'append', styles: [TextValuePresentationTab] }]];

export const TextValuePresentation: TabContainerPanelComponent<IDataValuePanelProps> = observer(function TextValuePresentation({
  model: unknownModel,
  resultIndex,
  dataFormat,
}) {
  const model = unknownModel as any;
  if (!isResultSetDataModel(model)) {
    throw new Error('TextValuePresentation can be used only with ResultSetDataSource');
  }
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const textValuePresentationService = useService(TextValuePresentationService);
  const dataViewerService = useService(DataViewerService);
  const style = useS(styles, TextValuePresentationTab);
  const selectAction = model.source.getAction(resultIndex, ResultSetSelectAction);
  const formatAction = model.source.getAction(resultIndex, ResultSetFormatAction);
  const activeElements = selectAction.getActiveElements();
  const firstSelectedCell = activeElements.length ? activeElements[0] : undefined;
  const contentAction = model.source.getAction(resultIndex, ResultSetDataContentAction);
  const editAction = model.source.getAction(resultIndex, ResultSetEditAction);

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
  const contentType = useAutoContentType({
    dataFormat,
    model,
    resultIndex,
    currentContentType: state.currentContentType,
    elementKey: firstSelectedCell,
    formatAction,
  });
  const textValueGetter = useTextValueGetter({
    contentAction,
    editAction,
    formatAction,
    dataFormat,
    contentType,
    elementKey: firstSelectedCell,
  });
  const autoLineWrapping = getDefaultLineWrapping(contentType);
  const lineWrapping = state.lineWrapping ?? autoLineWrapping;
  const isReadonly = isTextValueReadonly({ model, resultIndex, contentAction, cell: firstSelectedCell, formatAction, editAction });
  const canSave = firstSelectedCell && contentAction.isDownloadable(firstSelectedCell) && dataViewerService.canExportData;

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
    if (tabId !== contentType) {
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
            currentTabId={contentType}
            model={model}
            lazy
            onChange={tab => selectTabHandler(tab.tabId)}
          >
            <SContext registry={tabRegistry}>
              <TabList className={s(style, { tabList: true, textValuePresentationTab: true, underline: true })} underline />
            </SContext>
          </TabsState>
        </Container>
      </Container>
      <Loader suspense>
        <Group overflow maximum box>
          <TextValueEditor
            contentType={contentType}
            lineWrapping={lineWrapping}
            readonly={isReadonly}
            valueGetter={textValueGetter}
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
});
