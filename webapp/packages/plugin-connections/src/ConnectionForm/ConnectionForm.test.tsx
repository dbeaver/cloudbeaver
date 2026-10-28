/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ComponentProps, PropsWithChildren } from 'react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/dom';
import { cleanup, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

import * as CoreBlocks from '@cloudbeaver/core-blocks';
import * as CoreDi from '@cloudbeaver/core-di';
import * as CoreUI from '@cloudbeaver/core-ui';

import { ConnectionForm } from './ConnectionForm.js';
import { ConnectionFormService } from './ConnectionFormService.js';
import type { ConnectionFormState } from './ConnectionFormState.js';
import * as ConnectionFormOptions from './Options/getConnectionFormOptionsPart.js';
import type { ConnectionFormOptionsPart } from './Options/ConnectionFormOptionsPart.js';

const authenticationMessage = 'You need to sign in with "Azure" credentials to work with this connection.';

// Keep the real status renderer and container; replace the surrounding tab and action infrastructure.
vi.mock('@cloudbeaver/core-ui', async importOriginal => ({
  ...(await importOriginal<typeof CoreUI>()),
  TabsState: ({ children }: PropsWithChildren) => <>{children}</>,
  TabList: () => null,
  TabPanelList: () => null,
}));

vi.mock('@cloudbeaver/core-blocks', async importOriginal => ({
  ...(await importOriginal<typeof CoreBlocks>()),
  Loader: ({ children }: ComponentProps<typeof CoreBlocks.Loader>) => <>{typeof children === 'function' ? children() : children}</>,
  Placeholder: () => <button type="button">Authenticate</button>,
}));

describe('ConnectionForm status announcements', () => {
  beforeEach(() => {
    vi.stubGlobal('_ROOT_URI_', '/');
    vi.spyOn(CoreDi, 'useService').mockImplementation(service => {
      if (service === ConnectionFormService) {
        return { parts: [], actionsContainer: [] } as never;
      }
      if (service.name === 'ThemeService') {
        throw new Error('The test uses default styles');
      }
      return { translate: (message: string) => message } as never;
    });
    vi.spyOn(ConnectionFormOptions, 'getConnectionFormOptionsPart').mockReturnValue({ state: {} } as ConnectionFormOptionsPart);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function createFormState(statusMessage: string | null = null): ConnectionFormState {
    return { statusMessage, exception: null, mode: CoreUI.FormMode.Edit } as ConnectionFormState;
  }

  it('registers an empty live region before the authentication requirement loads', () => {
    const { getByRole } = render(<ConnectionForm formState={createFormState()} />);

    const status = getByRole('status');
    expect(status.textContent).toBe('');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });

  it('updates the existing live region without taking keyboard focus from Authenticate', async () => {
    const user = userEvent.setup();
    const formState = createFormState();
    const { getByRole, rerender } = render(<ConnectionForm formState={formState} />);
    const status = getByRole('status');
    const authenticate = getByRole('button', { name: 'Authenticate' });

    await user.tab();
    expect(authenticate).toHaveFocus();

    rerender(<ConnectionForm formState={createFormState(authenticationMessage)} />);

    expect(getByRole('status')).toBe(status);
    expect(status).toHaveTextContent(authenticationMessage);
    expect(authenticate).toHaveFocus();
    expect(status).not.toHaveAttribute('tabindex');

    rerender(<ConnectionForm formState={createFormState()} />);

    expect(getByRole('status')).toBe(status);
    expect(status.textContent).toBe('');
    expect(authenticate).toHaveFocus();
  });

  it('includes the provider requirement when the form opens with its status already loaded', () => {
    const { getByRole } = render(<ConnectionForm formState={createFormState(authenticationMessage)} />);

    expect(within(getByRole('status')).getByText(authenticationMessage)).toBeVisible();
  });

  it('uses valid ARIA semantics for the authentication status', async () => {
    const { getByRole } = render(<ConnectionForm formState={createFormState(authenticationMessage)} />);

    const result = await axe.run(getByRole('status'), {
      runOnly: {
        type: 'rule',
        values: ['aria-allowed-attr', 'aria-prohibited-attr', 'aria-roles', 'aria-valid-attr', 'aria-valid-attr-value', 'aria-hidden-focus'],
      },
    });

    expect(result.violations).toEqual([]);
    expect(result.incomplete).toEqual([]);
    expect(result.passes.map(rule => rule.id)).toEqual(
      expect.arrayContaining(['aria-allowed-attr', 'aria-roles', 'aria-valid-attr', 'aria-valid-attr-value']),
    );
  });
});
