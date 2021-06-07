/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Loader, Pane, ResizerControls, Split, splitStyles, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { DataPresentationService, DataPresentationType } from '../DataPresentationService';
import { TableError } from './TableError';
import { TableFooter } from './TableFooter/TableFooter';
import { TableGrid } from './TableGrid';
import { TableHeader } from './TableHeader/TableHeader';
import { TablePresentationBar } from './TablePresentationBar/TablePresentationBar';
import { TableToolsPanel } from './TableToolsPanel';
import { TableViewerStorageService } from './TableViewerStorageService';

const viewerStyles = composes(
  css`
    pane-content {
      composes: theme-background-surface theme-text-on-surface from global;
    }
    table-viewer {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    table-viewer {
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
        flex: 1;

        & pane-content {
          margin-right: 4px;
        }
      }
      &:last-child {
        flex: 0 0 30%;

        & pane-content {
          margin-left: 4px;
        }
      }
    }
    Pane:global([data-mode='maximize']) pane-content {
      margin: 0;
    }
    TablePresentationBar {
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
  `
);

interface Props {
  tableId: string;
  resultIndex: number | undefined;
  presentationId: string | undefined;
  valuePresentationId: string | null | undefined;
  className?: string;
  onPresentationChange: (id: string) => void;
  onValuePresentationChange: (id: string | null) => void;
}

export const TableViewer: React.FC<Props> = observer(function TableViewer({
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

  const handlePresentationChange = useCallback((id: string) => {
    const presentation = dataPresentationService.get(id);
    if (presentation) {
      if (
        presentation.dataFormat !== undefined
        && presentation.dataFormat !== dataModel?.source.dataFormat
      ) {
        dataModel?.setDataFormat(presentation.dataFormat)
          .reload();
      }
      onPresentationChange(id);
    }
  }, [onPresentationChange, dataModel]);

  function handleValuePresentationChange(id: string) {
    if (id === valuePresentationId) {
      onValuePresentationChange(null);
      return;
    }
    const presentation = dataPresentationService.get(id);
    if (presentation) {
      onValuePresentationChange(id);
    }
  }

  useEffect(() => {
    if (!presentationId || !dataModel) {
      return;
    }

    const presentation = dataPresentationService.get(presentationId);

    if (presentation?.dataFormat && !dataModel.supportedDataFormats.includes(presentation.dataFormat)) {
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
    || valuePresentation?.dataFormat === dataFormat)
  && overlay
  && resultExist;

  return styled(styles)(
    <table-viewer as="div" className={className}>
      <TableHeader model={dataModel} resultIndex={resultIndex} />
      <table-content as='div'>
        <TablePresentationBar
          type={DataPresentationType.main}
          presentationId={presentation.id}
          dataFormat={dataFormat}
          supportedDataFormat={dataModel.supportedDataFormats}
          model={dataModel}
          resultIndex={resultIndex}
          onPresentationChange={handlePresentationChange}
        />
        <table-data>
          <Split sticky={30} mode={valuePanelDisplayed ? undefined : 'minimize'} keepRatio>
            <Pane>
              <pane-content>
                <TableGrid
                  model={dataModel}
                  dataFormat={dataFormat}
                  presentation={presentation}
                  resultIndex={resultIndex}
                />
              </pane-content>
            </Pane>
            {valuePanelDisplayed && <ResizerControls />}
            <Pane main>
              <pane-content>
                {resultExist && (
                  <TableToolsPanel
                    model={dataModel}
                    dataFormat={dataFormat}
                    presentation={valuePresentation}
                    resultIndex={resultIndex}
                  />
                )}
              </pane-content>
            </Pane>
          </Split>
          <TableError model={dataModel} loading={loading} />
          <Loader
            loading={loading}
            cancelDisabled={!dataModel.source.canCancel}
            overlay={overlay}
            onCancel={() => dataModel.source.cancel()}
          />
        </table-data>
        <TablePresentationBar
          type={DataPresentationType.toolsPanel}
          presentationId={valuePresentationId ?? null}
          dataFormat={dataFormat}
          supportedDataFormat={[dataFormat]}
          model={dataModel}
          resultIndex={resultIndex}
          onPresentationChange={handleValuePresentationChange}
        />
      </table-content>
      <TableFooter model={dataModel} resultIndex={resultIndex} />
    </table-viewer>
  );
});
