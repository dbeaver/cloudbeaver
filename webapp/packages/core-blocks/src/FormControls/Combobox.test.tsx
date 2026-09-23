/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { observable, runInAction } from 'mobx';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as localization from '../localization/useTranslate.js';
import { Combobox, type ComboboxBaseProps } from './Combobox.js';

function ControlledCombobox({
  initialValue = '',
  items = ['PostgreSQL', 'MySQL'],
  onChange,
  ...props
}: Partial<ComboboxBaseProps<string, string>> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <Combobox
        {...props}
        aria-label="Database"
        items={items}
        value={value}
        onSelect={props.allowCustomValue ? undefined : value => setValue(value ?? '')}
        onChange={value => {
          onChange?.(value);
          if (props.allowCustomValue) {
            setValue(value ?? '');
          }
        }}
      />
      <output aria-label="Selected database">{value}</output>
      <button type="button">Outside</button>
    </>
  );
}

async function openOptions(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByRole('combobox', { name: 'Database' });
  await user.click(input);
  await user.keyboard('{ArrowDown}');
  await screen.findByRole('listbox');
  return input;
}

describe('Combobox', () => {
  beforeEach(() => {
    vi.spyOn(localization, 'useTranslate').mockReturnValue(key => key);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('calls the external onChange and starts filtering when custom values are allowed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ControlledCombobox allowCustomValue onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Database' });

    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('option', { name: 'PostgreSQL' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'MySQL' })).toBeVisible();

    await user.type(input, 'Post');

    expect(onChange).toHaveBeenLastCalledWith('Post');
    expect(input).toHaveValue('Post');
    expect(screen.getByRole('option', { name: 'PostgreSQL' })).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('option', { name: 'MySQL' })).not.toBeInTheDocument());
  });

  describe('selection only', () => {
    it('displays item labels and returns the selected key when choosing with the mouse', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const items = [
        { id: 'postgres', label: 'PostgreSQL' },
        { id: 'mysql', label: 'MySQL' },
      ];

      function DatabaseSelect() {
        const [value, setValue] = useState('postgres');
        return (
          <Combobox
            aria-label="Database"
            name="database"
            items={items}
            keySelector={item => item.id}
            valueSelector={item => item.label}
            value={value}
            onSelect={(value, name, previous) => {
              setValue(value);
              onSelect(value, name, previous);
            }}
          />
        );
      }

      render(<DatabaseSelect />);
      expect(screen.getByRole('combobox')).toHaveValue('PostgreSQL');
      const input = await openOptions(user);
      await user.click(screen.getByRole('option', { name: 'MySQL' }));

      expect(input).toHaveValue('MySQL');
      expect(onSelect).toHaveBeenCalledExactlyOnceWith('mysql', 'database', 'postgres');
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    });

    it('selects a search result using the keyboard', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'My');
      const option = await screen.findByRole('option', { name: 'MySQL' });
      await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', option.id));
      await user.keyboard('{Enter}');

      expect(input).toHaveValue('MySQL');
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent('MySQL');
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    });

    it('ignores case and surrounding whitespace when searching, and restores all options when the query is cleared', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox />);
      const input = await openOptions(user);

      await user.type(input, '  pOsT  ');
      expect(screen.getByRole('option', { name: 'PostgreSQL' })).toBeVisible();
      expect(screen.queryByRole('option', { name: 'MySQL' })).not.toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Selected database' })).toBeEmptyDOMElement();

      await user.clear(input);
      expect(await screen.findByRole('option', { name: 'MySQL' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'PostgreSQL' })).toBeVisible();
    });

    it('shows no results for an unknown value and restores the selection on blur', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox initialValue="PostgreSQL" />);
      const input = await openOptions(user);
      await user.clear(input);
      await user.type(input, 'Unknown database');

      expect(await screen.findByText('combobox_no_results_placeholder')).toBeVisible();
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      await user.keyboard('{Enter}');
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent('PostgreSQL');

      await user.click(screen.getByRole('button', { name: 'Outside' }));
      expect(input).toHaveValue('PostgreSQL');
    });

    it('shows an empty-state message when there are no available items', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox items={[]} />);
      await openOptions(user);

      expect(await screen.findByText('combobox_no_results_placeholder')).toBeVisible();
      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });
  });

  describe('custom values', () => {
    it.each([
      ['Enter', 'Post'],
      ['Enter', 'SQLite'],
      ['blur', 'Post'],
      ['blur', 'SQLite'],
    ])('offers all suggestions after %s finishes manual input of %s', async (finish, value) => {
      const user = userEvent.setup();
      render(<ControlledCombobox allowCustomValue />);
      const input = await openOptions(user);
      await user.type(input, value);
      expect(screen.queryByRole('option', { name: 'MySQL' })).not.toBeInTheDocument();

      if (finish === 'Enter') {
        await user.keyboard('{Enter}');
      } else {
        await user.click(screen.getByRole('button', { name: 'Outside' }));
      }

      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
      await openOptions(user);

      expect(screen.getByRole('option', { name: 'PostgreSQL' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'MySQL' })).toBeVisible();
      expect(input).toHaveValue(value);
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent(value);
    });

    it('keeps arbitrary text after Enter and blur even when there are no matching suggestions', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox allowCustomValue />);
      const input = await openOptions(user);

      await user.type(input, 'SQLite');
      await user.keyboard('{Enter}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.queryByText('combobox_no_results_placeholder')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Outside' }));

      expect(input).toHaveValue('SQLite');
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent('SQLite');
    });

    it('keeps the typed text on Enter rather than replacing it with a matching suggestion', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox allowCustomValue />);
      const input = await openOptions(user);
      await user.type(input, 'Post');
      expect(screen.getByRole('option', { name: 'PostgreSQL' })).toBeVisible();

      await user.keyboard('{Enter}');

      expect(input).toHaveValue('Post');
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent(/^Post$/);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    });

    it('offers all suggestions for an existing value and again after choosing a filtered suggestion', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox initialValue="MySQL" allowCustomValue />);
      const input = await openOptions(user);
      expect(screen.getByRole('option', { name: 'PostgreSQL' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'MySQL' })).toBeVisible();

      await user.clear(input);
      await user.type(input, 'Post');
      await user.click(screen.getByRole('option', { name: 'PostgreSQL' }));
      expect(input).toHaveValue('PostgreSQL');
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent('PostgreSQL');

      await openOptions(user);
      expect(screen.getByRole('option', { name: 'PostgreSQL' })).toBeVisible();
      expect(screen.getByRole('option', { name: 'MySQL' })).toBeVisible();
    });

    it('allows typing and deleting a value when no suggestions are configured', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox items={[]} allowCustomValue />);
      const input = screen.getByRole('combobox');
      await user.type(input, 'SQLite');
      await user.tab();
      expect(input).toHaveValue('SQLite');
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent('SQLite');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      await user.clear(input);
      await user.tab();
      expect(input).toHaveValue('');
      expect(screen.getByRole('status', { name: 'Selected database' })).toBeEmptyDOMElement();
    });
  });

  describe.each([false, true])('shared behavior (allowCustomValue=%s)', allowCustomValue => {
    it('reflects value changes supplied by the parent', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <Combobox items={['PostgreSQL', 'MySQL']} value="PostgreSQL" allowCustomValue={allowCustomValue} onChange={onChange} />,
      );
      expect(screen.getByRole('combobox')).toHaveValue('PostgreSQL');

      rerender(<Combobox items={['PostgreSQL', 'MySQL']} value="MySQL" allowCustomValue={allowCustomValue} onChange={onChange} />);

      expect(screen.getByRole('combobox')).toHaveValue('MySQL');
    });

    it('reads, selects and clears the named state field without an external selection handler', async () => {
      const user = userEvent.setup();
      const state = observable({ database: 'PostgreSQL', otherField: 'unchanged' });
      render(
        <Combobox
          aria-label="Database"
          items={['PostgreSQL', 'MySQL']}
          state={state}
          name="database"
          allowCustomValue={allowCustomValue}
          allowClear
        />,
      );
      expect(screen.getByRole('combobox')).toHaveValue('PostgreSQL');

      const input = await openOptions(user);
      await user.click(screen.getByRole('option', { name: 'MySQL' }));
      expect(input).toHaveValue('MySQL');
      expect(state.database).toBe('MySQL');

      await user.click(screen.getByRole('button', { name: 'Clear input' }));
      expect(input).toHaveValue('');
      expect(state.database).toBeNull();
      expect(state.otherField).toBe('unchanged');
    });

    it('reflects external updates to the named state field', () => {
      const state = observable({ database: 'PostgreSQL' });
      render(<Combobox items={['PostgreSQL', 'MySQL']} state={state} name="database" allowCustomValue={allowCustomValue} />);
      expect(screen.getByRole('combobox')).toHaveValue('PostgreSQL');

      act(() => {
        runInAction(() => {
          state.database = 'MySQL';
        });
      });

      expect(screen.getByRole('combobox')).toHaveValue('MySQL');
    });

    it('clears the value using the clear button', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox initialValue="PostgreSQL" allowCustomValue={allowCustomValue} allowClear />);

      await user.click(screen.getByRole('button', { name: 'Clear input' }));

      expect(screen.getByRole('combobox')).toHaveValue('');
      expect(screen.getByRole('status', { name: 'Selected database' })).toBeEmptyDOMElement();
    });

    it('skips disabled options during keyboard navigation and allows choosing an enabled one', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox allowCustomValue={allowCustomValue} isDisabled={item => item === 'PostgreSQL'} />);
      const input = await openOptions(user);

      const disabledOption = screen.getByRole('option', { name: 'PostgreSQL' });
      expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
      await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'MySQL' }).id));
      expect(screen.getByRole('status', { name: 'Selected database' })).toBeEmptyDOMElement();

      await user.click(screen.getByRole('option', { name: 'MySQL' }));
      expect(input).toHaveValue('MySQL');
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent('MySQL');
    });

    it.each(['disabled', 'readOnly', 'loading'] as const)('prevents editing while %s', async restriction => {
      const user = userEvent.setup();
      render(<ControlledCombobox initialValue="PostgreSQL" allowCustomValue={allowCustomValue} {...{ [restriction]: true }} />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'MySQL');

      expect(input).toBeDisabled();
      expect(input).toHaveValue('PostgreSQL');
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent('PostgreSQL');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('keeps footer actions available when the search has no matches', async () => {
      const user = userEvent.setup();
      render(<ControlledCombobox allowCustomValue={allowCustomValue} footerItems={['Other database']} />);
      const input = await openOptions(user);
      await user.type(input, 'Unknown');

      expect(screen.queryByRole('option', { name: 'PostgreSQL' })).not.toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'MySQL' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('option', { name: 'Other database' }));

      expect(input).toHaveValue('Other database');
      expect(screen.getByRole('status', { name: 'Selected database' })).toHaveTextContent('Other database');
    });
  });

  it('preserves custom input in the named state field through onChange', async () => {
    const user = userEvent.setup();
    const state = observable({ database: 'PostgreSQL' });
    render(
      <Combobox
        aria-label="Database"
        items={['PostgreSQL', 'MySQL']}
        state={state}
        name="database"
        allowCustomValue
        onChange={value => {
          runInAction(() => {
            state.database = value ?? '';
          });
        }}
      />,
    );
    const input = screen.getByRole('combobox');

    await user.clear(input);
    await user.type(input, 'SQLite');
    await user.tab();

    expect(input).toHaveValue('SQLite');
    expect(state.database).toBe('SQLite');
  });
});
