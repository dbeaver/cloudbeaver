/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, forwardRef } from 'react';
import styled, { css, use } from 'reshadow';

import { getComputed, Loader, Pane, ResizerControls, Split, splitStyles, TextPlaceholder, useObjectRef, useObservableRef, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import type { IDataContext } from '@cloudbeaver/core-view';

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

      &[|grid] {
        border-radius: var(--theme-group-element-radius);
      }
    }
    table-viewer {
      composes: theme-background-secondary theme-text-on-secondary from global;
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    table-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    table-data {
      gap: 8px;
    }
    table-data, Pane, pane-content {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
    }
    Split {
      gap: 8px;
    }
    Pane {
      &:first-child {
        position: relative;
      }
    }
    TablePresentationBar {
      margin-top: 32px;
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
  simple?: boolean;
  context?: IDataContext;
  className?: string;
  onPresentationChange: (id: string) => void;
  onValuePresentationChange: (id: string | null) => void;
}

export const TableViewer = observer<Props, HTMLDivElement>(forwardRef(function TableViewer({
  tableId,
  resultIndex = 0,
  presentationId,
  valuePresentationId,
  simple = false,
  context,
  className,
  onPresentationChange,
  onValuePresentationChange,
}, ref) {
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

  const needRefresh = getComputed(() => (
    dataModel?.source.error === null
    && dataModel.source.results.length === 0
    && dataModel.source.outdated
    && dataModel.source.isLoadable()
  ));

  useEffect(() => {
    if (needRefresh) {
      dataModel?.request();
    }
  }, [needRefresh]);

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
  const valuePanelDisplayed = (
    valuePresentation
    && (valuePresentation.dataFormat === undefined
    || valuePresentation.dataFormat === dataFormat)
    && overlay
    && resultExist
    && !simple
  );

  return styled(viewerStyles, splitStyles)(
    <table-viewer ref={ref} className={className}>
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
          <TableHeader model={dataModel} resultIndex={resultIndex} simple={simple} />
          <Split
            {...splitState}
            sticky={30}
            mode={valuePanelDisplayed ? splitState.mode : 'minimize'}
            disable={!valuePanelDisplayed}
            keepRatio
          >
            <Pane>
              <pane-content {...use({ grid:true })}>
                <TableGrid
                  model={dataModel}
                  actions={dataTableActions}
                  dataFormat={dataFormat}
                  presentation={presentation}
                  resultIndex={resultIndex}
                  simple={simple}
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
              <Loader suspense>
                <pane-content>
                  {resultExist && (
                    <TableToolsPanel
                      model={dataModel}
                      actions={dataTableActions}
                      dataFormat={dataFormat}
                      presentation={valuePresentation}
                      resultIndex={resultIndex}
                      simple={simple}
                    />
                  )}
                </pane-content>
              </Loader>
            </Pane>
          </Split>
        </table-data>
        {!simple && (
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
        )}
      </table-content>
      <TableFooter model={dataModel} resultIndex={resultIndex} simple={simple} context={context} />
    </table-viewer>
  );
}));
