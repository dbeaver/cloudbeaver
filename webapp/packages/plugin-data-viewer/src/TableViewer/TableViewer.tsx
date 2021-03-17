/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { PropsWithChildren, useCallback } from 'react';
import styled, { css, use } from 'reshadow';

import { Button, Loader, Pane, ResizerControls, Split, splitStyles, TextPlaceholder, useErrorDetails, useStateDelay } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { DataPresentationService, DataPresentationType } from '../DataPresentationService';
import { TableFooter } from './TableFooter/TableFooter';
import { TableGrid } from './TableGrid';
import { TableHeader } from './TableHeader/TableHeader';
import { TablePresentationBar } from './TablePresentationBar/TablePresentationBar';
import { TableToolsPanel } from './TableToolsPanel';
import { TableViewerStorageService } from './TableViewerStorageService';

const viewerStyles = composes(
  css`
    error, Split {
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
    table-data, table-box, Pane {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
    }
    Pane:first-child {
      position: relative;
      flex: 1;
    }
    Pane:last-child {
      flex: 0 0 30%;
    }
    error {
      position: absolute;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      white-space: pre-wrap;
      padding: 16px;
      overflow: auto;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }
    error[|animated] {
      opacity: 1;
    }
    Button {
      margin-right: 16px;
    }
  `
);

type TableViewerProps = PropsWithChildren<{
  tableId: string;
  resultIndex: number | undefined;
  presentationId: string | undefined;
  valuePresentationId: string | null | undefined;
  className?: string;
  onPresentationChange: (id: string) => void;
  onValuePresentationChange: (id: string | null) => void;
}>;

export const TableViewer = observer(function TableViewer({
  tableId,
  resultIndex = 0,
  presentationId,
  valuePresentationId,
  className,
  onPresentationChange,
  onValuePresentationChange,
}: TableViewerProps) {
  const styles = useStyles(viewerStyles, splitStyles);
  const dataPresentationService = useService(DataPresentationService);
  const tableViewerStorageService = useService(TableViewerStorageService);
  const dataModel = tableViewerStorageService.get(tableId);
  const result = dataModel?.getResult(resultIndex);
  const translate = useTranslate();
  const error = useErrorDetails(dataModel?.source.error || null);
  const animated = useStateDelay(!!error.details, 1);

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

  if (!dataModel) {
    return <Loader />;
  }

  const dataFormat = result?.dataFormat || ResultDataFormat.Resultset;

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

  const valuePanelDisplayed = valuePresentation
  && (valuePresentation.dataFormat === undefined
    || valuePresentation?.dataFormat === dataFormat);
  const overlay = dataModel.source.results.length > 0 && presentation.dataFormat === dataFormat;
  const loading = dataModel.isLoading();

  return styled(styles)(
    <table-viewer as="div" className={className}>
      <TableHeader model={dataModel} />
      <table-content as='div'>
        <TablePresentationBar
          type={DataPresentationType.main}
          presentationId={presentation.id}
          supportedDataFormat={dataModel.supportedDataFormats}
          model={dataModel}
          resultIndex={resultIndex}
          onPresentationChange={handlePresentationChange}
        />
        <table-data as='div'>
          <table-box as='div'>
            {(overlay || !loading) && (
              <Split sticky={30} mode={valuePanelDisplayed ? undefined : 'minimize'} keepRatio>
                <Pane>
                  {dataModel.source.hasResult(resultIndex) && (
                    <TableGrid
                      model={dataModel}
                      dataFormat={dataFormat}
                      presentation={presentation}
                      resultIndex={resultIndex}
                    />
                  )}
                  <error as="div" hidden={!error.details} {...use({ animated })}>
                    {error.details?.message}
                    <br /><br />
                    <Button type='button' mod={['outlined']} onClick={() => dataModel.source.clearError()}>
                      {translate('ui_error_close')}
                    </Button>
                    {error.details?.hasDetails && (
                      <Button type='button' mod={['unelevated']} onClick={error.open}>
                        {translate('ui_errors_details')}
                      </Button>
                    )}
                  </error>
                </Pane>
                {valuePanelDisplayed && <ResizerControls />}
                <Pane main>
                  <TableToolsPanel
                    model={dataModel}
                    dataFormat={dataFormat}
                    presentation={valuePresentation}
                    resultIndex={resultIndex}
                  />
                </Pane>
              </Split>
            )}
            <Loader
              loading={loading}
              cancelDisabled={!dataModel.source.canCancel}
              overlay={overlay}
              onCancel={() => dataModel.source.cancel()}
            />
          </table-box>
        </table-data>
        <TablePresentationBar
          type={DataPresentationType.toolsPanel}
          presentationId={valuePresentationId ?? null}
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
