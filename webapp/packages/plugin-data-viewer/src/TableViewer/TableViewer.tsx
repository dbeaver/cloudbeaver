/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Loader, Pane, ResizerControls, Split, splitStyles, TextPlaceholder, useObjectRef, useObservableRef, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { ResultSetConstraintAction } from '../DatabaseDataModel/Actions/ResultSet/ResultSetConstraintAction';
import { DataPresentationService, DataPresentationType } from '../DataPresentationService';
import type { IDataTableActionsPrivate } from './IDataTableActions';
import { TableError } from './TableError';
import { TableFooter } from './TableFooter/TableFooter';
import { TableGrid } from './TableGrid';
import { TableHeader } from './TableHeader/TableHeader';
import { TablePresentationBar } from './TablePresentationBar/TablePresentationBar';
import { TableToolsPanel } from './TableToolsPanel';
import { TableViewerStorageService } from './TableViewerStorageService';

const viewerStyles = css`
    pane-content {
      composes: theme-background-surface theme-text-on-surface from global;
    }
    table-viewer {
      composes: theme-background-secondary theme-text-on-secondary from global;
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0 8px;
    }
    table-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    table-data, Pane, pane-content {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
    }
    Pane {
      &:first-child {
        position: relative;
        
        & pane-content {
          margin-right: 4px;
        }
      }
      &:last-child {
        & pane-content {
          margin-left: 4px;
        }
      }
    }
    Pane:global([data-mode='maximize']) pane-content {
      margin: 0;
    }
    TablePresentationBar {
      padding-top: 40px;
      &:first-child {
        margin-right: 4px;
      }
      &:last-child {
        margin-left: 4px;
      }
    }
    Loader {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  `;

interface Props {
  tableId: string;
  resultIndex: number | undefined;
  presentationId: string | undefined;
  valuePresentationId: string | null | undefined;
  className?: string;
  onPresentationChange: (id: string) => void;
  onValuePresentationChange: (id: string | null) => void;
}

export const TableViewer = observer<Props>(function TableViewer({
  tableId,
  resultIndex = 0,
  presentationId,
  valuePresentationId,
  className,
  onPresentationChange,
  onValuePresentationChange,
}) {
  const styles = useStyles(viewerStyles, splitStyles);
  const dataPresentationService = useService(DataPresentationService);
  const tableViewerStorageService = useService(TableViewerStorageService);
  const dataModel = tableViewerStorageService.get(tableId);
  const result = dataModel?.getResult(resultIndex);
  const loading = dataModel?.isLoading() ?? true;
  const dataFormat = result?.dataFormat || ResultDataFormat.Resultset;
  const splitState = useSplitUserState('table-viewer');

  const localActions = useObjectRef({
    clearConstraints() {
      const constraints = dataModel?.source.tryGetAction(resultIndex, ResultSetConstraintAction);

      if (constraints) {
        constraints.deleteAll();
      }
    },
  });

  const dataTableActions = useObservableRef<IDataTableActionsPrivate>(() => ({
    setPresentation(id: string) {
      const presentation = dataPresentationService.get(id);

      if (presentation) {
        if (
          presentation.dataFormat !== undefined
          && presentation.dataFormat !== this.dataModel?.source.dataFormat
        ) {
          this.dataModel?.setDataFormat(presentation.dataFormat).reload();
        }

        localActions.clearConstraints();
        this.onPresentationChange(id);
      }
    },

    setValuePresentation(id: string | null) {
      if (id === this.valuePresentationId) {
        return;
      }

      if (id === null) {
        this.onValuePresentationChange(null);
        return;
      }

      let presentation = dataPresentationService.get(id);

      if (!presentation && this.dataModel) {
        presentation = dataPresentationService.getSupported(
          DataPresentationType.toolsPanel,
          this.dataFormat,
          undefined,
          this.dataModel,
          this.resultIndex
        ) ?? undefined;
      }

      if (presentation) {
        this.onValuePresentationChange(presentation.id);
      }
    },
    switchValuePresentation(id: string | null) {
      if (id === this.valuePresentationId) {
        this.onValuePresentationChange(null);
        return;
      }

      this.setValuePresentation(id);
    },
    closeValuePresentation() {
      this.onValuePresentationChange(null);
    },
  }), {
    presentationId: observable,
    valuePresentationId: observable,
    dataFormat: observable,
    resultIndex: observable,
    dataModel: observable.ref,
  }, {
    presentationId,
    valuePresentationId,
    dataModel,
    resultIndex,
    dataFormat,
    onPresentationChange,
    onValuePresentationChange,
  }, ['setPresentation', 'setValuePresentation', 'switchValuePresentation', 'closeValuePresentation']);

  useEffect(() => {
    if (!presentationId || !dataModel) {
      return;
    }

    const presentation = dataPresentationService.get(presentationId);

    if (presentation?.dataFormat && !dataModel.supportedDataFormats.includes(presentation.dataFormat)) {
      localActions.clearConstraints();
      onPresentationChange(dataFormat);
    }
  }, [dataFormat]);

  if (!dataModel) {
    return <Loader />;
  }

  const presentation = dataPresentationService.getSupported(
    DataPresentationType.main,
    dataFormat,
    presentationId,
    dataModel,
    resultIndex
  );

  if (!presentation) {
    return <TextPlaceholder>There are no available presentation for data format: {dataFormat}</TextPlaceholder>;
  }

  const valuePresentation = valuePresentationId
    ? dataPresentationService.getSupported(
      DataPresentationType.toolsPanel,
      dataFormat,
      valuePresentationId,
      dataModel,
      resultIndex
    )
    : null;

  const resultExist = dataModel.source.hasResult(resultIndex);
  const overlay = dataModel.source.results.length > 0 && presentation.dataFormat === dataFormat;
  const valuePanelDisplayed = valuePresentation
  && (valuePresentation.dataFormat === undefined
    || valuePresentation.dataFormat === dataFormat)
  && overlay
  && resultExist;

  return styled(styles)(
    <table-viewer className={className}>
      <table-content>
        <TablePresentationBar
          type={DataPresentationType.main}
          presentationId={presentation.id}
          dataFormat={dataFormat}
          supportedDataFormat={dataModel.supportedDataFormats}
          model={dataModel}
          resultIndex={resultIndex}
          onPresentationChange={dataTableActions.setPresentation}
        />
        <table-data>
          <TableHeader model={dataModel} resultIndex={resultIndex} />
          <Split
            {...splitState}
            sticky={30}
            mode={valuePanelDisplayed ? splitState.mode : 'minimize'}
            disable={!valuePanelDisplayed}
            keepRatio
          >
            <Pane>
              <pane-content>
                <TableGrid
                  model={dataModel}
                  actions={dataTableActions}
                  dataFormat={dataFormat}
                  presentation={presentation}
                  resultIndex={resultIndex}
                />
                <TableError model={dataModel} loading={loading} />
                <Loader
                  loading={loading}
                  cancelDisabled={!dataModel.source.canCancel}
                  overlay={overlay}
                  onCancel={() => dataModel.source.cancel()}
                />
              </pane-content>
            </Pane>
            <ResizerControls />
            <Pane basis='30%' main>
              <pane-content>
                {resultExist && (
                  <TableToolsPanel
                    model={dataModel}
                    actions={dataTableActions}
                    dataFormat={dataFormat}
                    presentation={valuePresentation}
                    resultIndex={resultIndex}
                  />
                )}
              </pane-content>
            </Pane>
          </Split>

        </table-data>
        <TablePresentationBar
          type={DataPresentationType.toolsPanel}
          presentationId={valuePresentationId ?? null}
          dataFormat={dataFormat}
          supportedDataFormat={[dataFormat]}
          model={dataModel}
          resultIndex={resultIndex}
          onPresentationChange={dataTableActions.setValuePresentation}
          onClose={dataTableActions.closeValuePresentation}
        />
      </table-content>
      <TableFooter model={dataModel} resultIndex={resultIndex} />
    </table-viewer>
  );
});
