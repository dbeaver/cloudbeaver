/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { ActionIconButton, Container, Group, Loader, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { type TabContainerPanelComponent, useTabLocalState } from '@cloudbeaver/core-ui';

import { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import { DataViewerService } from '../../DataViewerService.js';
import { isResultSetDataModel } from '../../ResultSet/isResultSetDataModel.js';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService.js';
import { getDefaultLineWrapping } from './getDefaultLineWrapping.js';
import { isTextValueReadonly } from './isTextValueReadonly.js';
import { TextValueEditor } from './TextValueEditor.js';
import { TextValueTruncatedMessage } from './TextValueTruncatedMessage.js';
import { useTextValueGetter } from './useTextValueGetter.js';
import { IDatabaseDataSelectAction } from '../../DatabaseDataModel/Actions/IDatabaseDataSelectAction.js';
import { IDatabaseDataFormatAction } from '../../DatabaseDataModel/Actions/IDatabaseDataFormatAction.js';
import { IDatabaseDataEditAction } from '../../DatabaseDataModel/Actions/IDatabaseDataEditAction.js';
import { GridSelectAction } from '../../DatabaseDataModel/Actions/Grid/GridSelectAction.js';
import type { IDatabaseValueHolder } from '../../DatabaseDataModel/Actions/IDatabaseValueHolder.js';
import type { IGridDataKey } from '../../DatabaseDataModel/Actions/Grid/IGridDataKey.js';
import type { IResultSetValue } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';

export const TextValuePresentation: TabContainerPanelComponent<IDataValuePanelProps> = observer(function TextValuePresentation({
  tabId,
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
  const dataViewerService = useService(DataViewerService);
  const selectAction = model.source.getAction(resultIndex, IDatabaseDataSelectAction, GridSelectAction);
  const formatAction = model.source.getAction(resultIndex, IDatabaseDataFormatAction);
  const activeElements = selectAction.getActiveElements();
  const firstSelectedCell = activeElements.length ? activeElements[0] : undefined;
  const contentAction = model.source.getAction(resultIndex, ResultSetDataContentAction);
  const editAction = model.source.getAction(resultIndex, IDatabaseDataEditAction);

  const state = useTabLocalState(() =>
    observable({
      lineWrapping: null as boolean | null,
      setLineWrapping(lineWrapping: boolean | null) {
        this.lineWrapping = lineWrapping;
      },
    }),
  );
  const cellHolder = (firstSelectedCell ? formatAction.get(firstSelectedCell) : undefined) as
    | IDatabaseValueHolder<IGridDataKey, IResultSetValue>
    | undefined;
  const textValueGetter = useTextValueGetter({
    cellHolder,
    contentAction,
    editAction,
    formatAction,
    dataFormat,
    contentType: tabId,
  });
  const autoLineWrapping = getDefaultLineWrapping(tabId);
  const lineWrapping = state.lineWrapping ?? autoLineWrapping;
  const isReadonly = isTextValueReadonly({ model, resultIndex, contentAction, cellHolder, formatAction, editAction });
  const canSave =
    firstSelectedCell &&
    contentAction.isDownloadable(cellHolder as IDatabaseValueHolder<IGridDataKey, IResultSetValue>) &&
    dataViewerService.canExportData;

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

  function toggleLineWrappingHandler() {
    state.setLineWrapping(!lineWrapping);
  }

  return (
    <Container vertical gap dense overflow>
      <Loader suspense>
        <Group overflow maximum box>
          <TextValueEditor
            contentType={tabId}
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
