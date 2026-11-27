/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel.js';
import { DataPresentationService, DataPresentationType } from './DataPresentationService.js';

const dataFormat = ResultDataFormat.Resultset;
const model = {} as IDatabaseDataModel;
const getPresentationComponent = () => () => null;

describe('DataPresentationService', () => {
  it('shows the grid when the selected graph becomes unavailable', () => {
    const service = new DataPresentationService();
    let graphAvailable = true;
    service.add({ id: 'grid', dataFormat, getPresentationComponent });
    service.add({ id: 'graph', dataFormat, order: 2, hidden: () => !graphAvailable, getPresentationComponent });

    expect(service.getSupported(DataPresentationType.main, dataFormat, 'graph', model, 0)?.id).toBe('graph');

    graphAvailable = false;
    expect(service.getSupported(DataPresentationType.main, dataFormat, 'graph', model, 0)?.id).toBe('grid');
  });

  it('keeps the tools panel closed when the selected tool becomes unavailable', () => {
    const service = new DataPresentationService();
    const type = DataPresentationType.toolsPanel;
    service.add({ id: 'tool', type, hidden: () => true, getPresentationComponent });
    service.add({ id: 'other-tool', type, getPresentationComponent });

    expect(service.getSupported(type, dataFormat, 'tool', model, 0)).toBeNull();
  });
});
