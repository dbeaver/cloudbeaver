/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TabProvider } from '@dbeaver/ui-kit';

import { TabsContext, type ITabsContext } from './TabsContext.js';
import { TabsValidationContext } from './TabsValidationContext.js';
import { useTabsValidation } from './useTabsValidation.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// The hook only requires the surrounding tabs context to be present.
const tabsContext = {} as ITabsContext;

function Panel({ selected }: { selected: boolean }) {
  const ref = useTabsValidation('ssh');

  return (
    <div ref={ref} hidden={!selected}>
      <input aria-label="SSH host" name="host" required />
    </div>
  );
}

function TestForm({ selected, invalidate }: { selected: boolean; invalidate: (tabId: string) => void }) {
  return (
    <TabProvider selectedId={selected ? 'ssh' : 'main'}>
      <TabsContext.Provider value={tabsContext}>
        <TabsValidationContext.Provider value={{ invalidate }}>
          <form>
            <Panel selected={selected} />
          </form>
        </TabsValidationContext.Provider>
      </TabsContext.Provider>
    </TabProvider>
  );
}

describe('useTabsValidation', () => {
  it('defers native validation UI until the invalid tab is selected', () => {
    const invalidate = vi.fn();
    const view = render(<TestForm selected={false} invalidate={invalidate} />);
    const input = view.container.querySelector('input')!;
    const invalidEvents: Event[] = [];
    input.addEventListener('invalid', event => invalidEvents.push(event));
    const reportValidity = vi.spyOn(input, 'reportValidity');

    expect(input.form!.reportValidity()).toBe(false);
    expect(invalidate).toHaveBeenCalledWith('ssh');
    expect(invalidEvents[0]?.defaultPrevented).toBe(true);
    expect(reportValidity).not.toHaveBeenCalled();

    view.rerender(<TestForm invalidate={invalidate} selected />);

    expect(reportValidity).toHaveBeenCalledOnce();
    expect(invalidEvents.at(-1)?.defaultPrevented).toBe(false);
  });

  it('preserves custom validity when moving from a hidden tab to a visible tab', () => {
    const invalidate = vi.fn();
    const view = render(<TestForm selected={false} invalidate={invalidate} />);
    const input = view.container.querySelector('input')!;
    input.value = 'localhost';
    input.setCustomValidity('Invalid SSH host');
    const invalidEvents: Event[] = [];
    input.addEventListener('invalid', event => invalidEvents.push(event));

    expect(input.form!.checkValidity()).toBe(false);
    expect(invalidEvents[0]?.defaultPrevented).toBe(true);

    view.rerender(<TestForm invalidate={invalidate} selected />);

    expect(input.validationMessage).toBe('Invalid SSH host');
    expect(invalidEvents.at(-1)?.defaultPrevented).toBe(false);
    expect(input.form!.checkValidity()).toBe(false);

    input.setCustomValidity('');
    expect(input.form!.checkValidity()).toBe(true);
  });
});
