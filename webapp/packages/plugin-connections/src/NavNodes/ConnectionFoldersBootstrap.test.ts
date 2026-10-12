/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import type { NavNode } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import type { INodeDeletionProvider } from '@cloudbeaver/plugin-navigation-tree';

import { ConnectionFoldersBootstrap } from './ConnectionFoldersBootstrap.js';

type Dependencies = ConstructorParameters<typeof ConnectionFoldersBootstrap>;

function folder(projectId: string, name: string): NavNode {
  return {
    uri: `node://${projectId}/datasources/${name}`,
    projectId,
    name,
    folder: true,
    hasChildren: false,
    inline: false,
    navigable: true,
    filtered: false,
    objectFeatures: [],
  };
}

function setup() {
  const tree = { deleteNode: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined) };
  const providers: INodeDeletionProvider[] = [];
  const bootstrap = new ConnectionFoldersBootstrap(
    {} as Dependencies[0],
    {} as Dependencies[1],
    tree as unknown as Dependencies[2],
    { addHandler: vi.fn() } as unknown as Dependencies[3],
    { addCreator: vi.fn() } as unknown as Dependencies[4],
    {} as Dependencies[5],
    { onMove: { addHandler: vi.fn() } } as unknown as Dependencies[6],
    {} as Dependencies[7],
    {} as Dependencies[8],
    {} as Dependencies[9],
    { onItemUpdate: { addHandler: vi.fn() }, onItemDelete: { addHandler: vi.fn() } } as unknown as Dependencies[10],
    {} as Dependencies[11],
    {} as Dependencies[12],
    {} as Dependencies[13],
    {} as Dependencies[14],
    { registerProvider: (provider: INodeDeletionProvider) => providers.push(provider) } as unknown as Dependencies[15],
  );
  bootstrap.register();
  return { tree, provider: providers[0]! };
}

describe('connection folder deletion', () => {
  it('groups folder URIs by project inside the provider', async () => {
    const { tree, provider } = setup();
    const a = folder('project-a', 'first');
    const b = folder('project-b', 'second');
    const c = folder('project-a', 'third');

    await provider.deleteBatch!([a, b, c]);

    expect(tree.deleteNode).toHaveBeenCalledTimes(2);
    expect(tree.deleteNode).toHaveBeenNthCalledWith(1, resourceKeyList([a.uri, c.uri]));
    expect(tree.deleteNode).toHaveBeenNthCalledWith(2, resourceKeyList([b.uri]));
  });

  it('waits for another project to finish before reporting a failed project', async () => {
    const { tree, provider } = setup();
    const error = new Error('Project A deletion failed');
    let finish!: () => void;
    tree.deleteNode.mockRejectedValueOnce(error).mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          finish = resolve;
        }),
    );
    const settled = vi.fn();
    const deletion = provider.deleteBatch!([folder('project-a', 'first'), folder('project-b', 'second')]).then(settled, settled);

    await vi.waitFor(() => expect(tree.deleteNode).toHaveBeenCalledTimes(2));
    expect(settled).not.toHaveBeenCalled();
    finish();
    await deletion;

    expect(settled).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ errors: [error], message: error.message }));
  });
});
