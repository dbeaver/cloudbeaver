/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { Button, clsx } from '@dbeaver/ui-kit';
import { CaptureViewScope } from '@cloudbeaver/core-view';
import { IconOrImage, Select, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { NotificationService } from '@cloudbeaver/core-events';
import {
  type DataPresentationComponent,
  IDatabaseDataMetadataAction,
  IDatabaseReferencesAction,
  type ISqlResultAssociation,
  isResultSetDataModel,
  ResultSetReferencesAction,
  TableViewerLoader,
} from '@cloudbeaver/plugin-data-viewer';

import type { IDataViewerReferencesPresentationState } from './IDataViewerReferencesState.js';
import { useReferencesDataModel } from './useReferencesDataModel.js';

export const DataViewerReferencesPresentation: DataPresentationComponent = observer(function DataViewerReferencesPresentation({
  model: unknownModel,
  resultIndex,
}) {
  const originalModel = unknownModel;

  const translate = useTranslate();
  const navNodeManagerService = useService(NavNodeManagerService);
  const notificationService = useService(NotificationService);

  if (!isResultSetDataModel(originalModel)) {
    throw new Error('DataViewerReferencesPresentation can only be used with ResultSetDataSource');
  }

  const metadataAction = originalModel.source.getAction(resultIndex, IDatabaseDataMetadataAction);
  const referencesAction = originalModel.source.getAction(resultIndex, IDatabaseReferencesAction, ResultSetReferencesAction);

  const state = metadataAction.get<IDataViewerReferencesPresentationState>(`references-panel-${originalModel.id}`, () =>
    observable({
      presentationId: '',
      valuePresentationId: null,
      modelId: '',
      associationId: '',
    }),
  );

  const model = useReferencesDataModel(originalModel, resultIndex, state);
  const associations = referencesAction.associations;
  const defaultAssociation = associations[0];

  if (!associations.some(a => a.id === state.associationId)) {
    state.associationId = defaultAssociation?.id ?? '';
  }

  if (!associations.length) {
    return <TextPlaceholder>{translate('plugin_data_viewer_references_no_references')}</TextPlaceholder>;
  }

  const currentAssociation = associations.find(a => a.id === state.associationId);

  if (!currentAssociation) {
    return <TextPlaceholder>{translate('plugin_data_viewer_references_no_reference')}</TextPlaceholder>;
  }

  function openAssociation() {
    if (!currentAssociation?.targetNodePath) {
      notificationService.logError({ title: 'plugin_data_viewer_references_no_target_node' });
      return;
    }

    navNodeManagerService.navToNode(currentAssociation.targetNodePath);
  }

  return (
    <CaptureViewScope>
      <div className="tw:flex tw:flex-col tw:h-full tw:gap-2 tw:bg-(--theme-secondary)">
        <div className="tw:flex tw:gap-2 tw:items-center">
          <Select
            className="tw:flex-1 tw:min-w-18"
            state={state}
            name="associationId"
            items={associations}
            keySelector={association => association.id}
            titleSelector={getValueSelector}
            valueSelector={getValueSelector}
            iconSelector={association => (
              <IconOrImage
                className={clsx(association.reference && 'tw:rotate-180')}
                icon="/icons/plugin_data_viewer_references_panel_arrow_sm.svg"
              />
            )}
          />
          {currentAssociation.targetNodePath && (
            <Button size="small" variant="secondary" onClick={openAssociation}>
              {translate('ui_open')}
            </Button>
          )}
        </div>
        {model.model.source.options ? (
          <TableViewerLoader
            tableId={model.model.id}
            resultIndex={resultIndex}
            presentationId={state.presentationId}
            valuePresentationId={state.valuePresentationId}
            simple
            onPresentationChange={presentationId => {
              state.presentationId = presentationId;
            }}
            onValuePresentationChange={presentationId => {
              state.valuePresentationId = presentationId;
            }}
          />
        ) : (
          //@TODO Find a better way to check whether model is ready to be used
          <TextPlaceholder>{translate('data_viewer_nodata_message')}</TextPlaceholder>
        )}
      </div>
    </CaptureViewScope>
  );
});

function getValueSelector(association: ISqlResultAssociation): string {
  return `${association.targetEntityName ? `${association.targetEntityName} ` : ''}(${association.associationName})`;
}
