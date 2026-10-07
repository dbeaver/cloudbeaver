/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { renderInApp } from '@cloudbeaver/tests-runner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as useTranslateModule from '../localization/useTranslate.js';
import { SlideDialog } from './SlideDialog.js';

describe('SlideDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('_ROOT_URI_', '/');
    vi.spyOn(useTranslateModule, 'useTranslate').mockReturnValue(token => token);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps descendants mounted later interactive when their container is persistent', async () => {
    const { rerender } = renderInApp(
      <>
        <div data-testid="panel-container" data-dialog-persistent-element />
        <SlideDialog open onClose={vi.fn()}>
          Dialog content
        </SlideDialog>
      </>,
    );

    rerender(
      <>
        <div data-testid="panel-container" data-dialog-persistent-element>
          <button type="button" data-testid="panel-action">
            Panel action
          </button>
        </div>
        <SlideDialog open onClose={vi.fn()}>
          Dialog content
        </SlideDialog>
      </>,
    );

    await vi.waitFor(() => expect(document.querySelector('[data-testid="panel-action"]')).not.toBeNull());
    const panelAction = document.querySelector('[data-testid="panel-action"]');
    await expect.poll(() => panelAction?.closest('[inert]')).toBeNull();
  });
});
