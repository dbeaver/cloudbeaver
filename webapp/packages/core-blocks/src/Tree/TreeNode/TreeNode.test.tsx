/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { fireEvent, render, waitFor } from '@testing-library/react';
import { useContext, useState } from 'react';
import { describe, expect, it } from 'vitest';

import { TreeNode } from './TreeNode.js';
import { TreeNodeContext } from './TreeNodeContext.js';
import { TreeNodeSelect } from './TreeNodeSelect.js';

function SelectionControl() {
  const context = useContext(TreeNodeContext);
  return <TreeNodeSelect onSelect={() => context.select()} />;
}

function SelectableNode() {
  const [selected, setSelected] = useState(true);
  return (
    <TreeNode selected={selected} onSelect={() => setSelected(value => !value)}>
      <SelectionControl />
    </TreeNode>
  );
}

describe('TreeNode', () => {
  it('allows a checkbox to deselect and reselect a node without selection modifiers', async () => {
    const { getByRole } = render(<SelectableNode />);
    const checkbox = getByRole('checkbox');

    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).not.toBeChecked());
    await waitFor(() => expect(checkbox).toBeEnabled());

    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());
  });
});
