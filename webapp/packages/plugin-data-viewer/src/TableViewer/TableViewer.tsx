/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { forwardRef, useEffect } from 'react';

import {
  getComputed,
  Loader,
  Pane,
  ResizerControls,
  s,
  Split,
  TextPlaceholder,
  useObjectRef,
  useObservableRef,
  useS,
  useSplitUserState,
} from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { ResultSetConstraintAction } from '../DatabaseDataModel/Actions/ResultSet/ResultSetConstraintAction';
import { DataPresentationService, DataPresentationType } from '../DataPresentationService';
import type { IDataTableActionsPrivate } from './IDataTableActions';
import { TableError } from './TableError';
import { TableFooter } from './TableFooter/TableFooter';
import { TableGrid } from './TableGrid';
import { TableHeader } from './TableHeader/TableHeader';
import { TablePresentationBar } from './TablePresentationBar/TablePresentationBar';
import { TableToolsPanel } from './TableToolsPanel';
import style from './TableViewer.m.css';
import { TableViewerStorageService } from './TableViewerStorageService';

export interface TableViewerProps {
  tableId: string;
  resultIndex: number | undefined;
  presentationId: string | undefined;
  valuePresentationId: string | null | undefined;
  /** Display data in simple mode, some features will be hidden or disabled */
  simple?: boolean;
  context?: IDataContext;
  className?: string;
  onPresentationChange: (id: string) => void;
  onValuePresentationChange: (id: string | null) => void;
}

export const TableViewer = observer<TableViewerProps, HTMLDivElement>(
  forwardRef(function TableViewer(
    {
      tableId,
      resultIndex = 0,
      presentationId,
      valuePresentationId,
      simple = false,
      context,
      className,
      onPresentationChange,
      onValuePresentationChange,
    },
    ref,
  ) {
    const styles = useS(style);
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

    const dataTableActions = useObservableRef<IDataTableActionsPrivate>(
      () => ({
        setPresentation(id: string) {
          const presentation = dataPresentationService.get(id);

          if (presentation) {
            if (presentation.dataFormat !== undefined && presentation.dataFormat !== this.dataModel?.source.dataFormat) {
              localActions.clearConstraints();
              this.dataModel?.setDataFormat(presentation.dataFormat).reload();
            }

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
            presentation =
              dataPresentationService.getSupported(DataPresentationType.toolsPanel, this.dataFormat, undefined, this.dataModel, this.resultIndex) ??
              undefined;
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
      }),
      {
        presentationId: observable,
        valuePresentationId: observable,
        dataFormat: observable,
        resultIndex: observable,
        dataModel: observable.ref,
      },
      {
        presentationId,
        valuePresentationId,
        dataModel,
        resultIndex,
        dataFormat,
        onPresentationChange,
        onValuePresentationChange,
      },
      ['setPresentation', 'setValuePresentation', 'switchValuePresentation', 'closeValuePresentation'],
    );

    const needRefresh = getComputed(
      () => dataModel?.source.error === null && dataModel.source.results.length === 0 && dataModel.source.outdated && dataModel.source.isLoadable(),
    );

    useEffect(() => {
      if (needRefresh) {
        dataModel?.request();
      }
    }, [needRefresh]);

    // TODO: seems this code is not working because of setting dataFormat in presentation change
    // useEffect(() => {
    //   if (!presentationId || !dataModel) {
    //     return;
    //   }

    //   const presentation = dataPresentationService.get(presentationId);

    //   if (presentation?.dataFormat && !dataModel.supportedDataFormats.includes(presentation.dataFormat)) {
    //     // localActions.clearConstraints();
    //     onPresentationChange(dataFormat);
    //   }
    // }, [dataFormat]);

    if (!dataModel) {
      return <Loader />;
    }

    const presentation = dataPresentationService.getSupported(DataPresentationType.main, dataFormat, presentationId, dataModel, resultIndex);

    if (!presentation) {
      return <TextPlaceholder>There are no available presentation for data format: {dataFormat}</TextPlaceholder>;
    }

    const valuePresentation = valuePresentationId
      ? dataPresentationService.getSupported(DataPresentationType.toolsPanel, dataFormat, valuePresentationId, dataModel, resultIndex)
      : null;

    const resultExist = dataModel.source.hasResult(resultIndex);
    const overlay = dataModel.source.results.length > 0 && presentation.dataFormat === dataFormat;
    const valuePanelDisplayed =
      valuePresentation &&
      (valuePresentation.dataFormat === undefined || valuePresentation.dataFormat === dataFormat) &&
      overlay &&
      resultExist &&
      !simple;

    return (
      <div ref={ref} className={s(styles, { tableViewer: true }, className)}>
        <div className={s(styles, { tableContent: true })}>
          <TablePresentationBar
            className={s(styles, { tablePresentationBar: true })}
            type={DataPresentationType.main}
            presentationId={presentation.id}
            dataFormat={dataFormat}
            supportedDataFormat={dataModel.supportedDataFormats}
            model={dataModel}
            resultIndex={resultIndex}
            onPresentationChange={dataTableActions.setPresentation}
          />
          <div className={s(styles, { tableData: true })}>
            <TableHeader model={dataModel} resultIndex={resultIndex} simple={simple} />
            <Split
              className={s(styles, { split: true, disabled: !valuePanelDisplayed })}
              {...splitState}
              sticky={30}
              mode={valuePanelDisplayed ? splitState.mode : 'minimize'}
              disable={!valuePanelDisplayed}
              keepRatio
            >
              <Pane className={s(styles, { pane: true })}>
                <div className={s(styles, { paneContent: true, grid: true })}>
                  <Loader className={s(styles, { loader: true })} suspense>
                    <TableGrid
                      model={dataModel}
                      actions={dataTableActions}
                      dataFormat={dataFormat}
                      presentation={presentation}
                      resultIndex={resultIndex}
                      simple={simple}
                    />
                  </Loader>
                  <TableError model={dataModel} loading={loading} />
                  <Loader
                    loading={loading}
                    cancelDisabled={!dataModel.source.canCancel}
                    overlay={overlay}
                    onCancel={() => dataModel.source.cancel()}
                  />
                </div>
              </Pane>
              <ResizerControls />
              <Pane className={s(styles, { pane: true })} basis="30%" main>
                <Loader className={s(styles, { loader: true })} suspense>
                  <div className={s(styles, { paneContent: true })}>
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
                  </div>
                </Loader>
              </Pane>
            </Split>
          </div>
          {!simple && (
            <TablePresentationBar
              type={DataPresentationType.toolsPanel}
              className={s(styles, { tablePresentationBar: true })}
              presentationId={valuePresentationId ?? null}
              dataFormat={dataFormat}
              supportedDataFormat={[dataFormat]}
              model={dataModel}
              resultIndex={resultIndex}
              onPresentationChange={dataTableActions.setValuePresentation}
              onClose={dataTableActions.closeValuePresentation}
            />
          )}
        </div>
        <TableFooter model={dataModel} resultIndex={resultIndex} simple={simple} context={context} />
      </div>
    );
  }),
);
