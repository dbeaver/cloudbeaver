/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Layer, Option } from 'effect';

import type { ServiceType } from './Service.js';

/** Links the statically declared layers contributed by the selected modules. */
export function composeServiceLayers(
  roots: readonly ServiceType[],
  definitions: ReadonlyMap<string, ServiceType>,
  provided: Context.Context<any> = Context.empty() as Context.Context<any>,
  aliases: ReadonlyMap<string, ServiceType> = new Map(),
): Layer.Layer<any, unknown, never> {
  const layers = new Map<string, Layer.Layer<never, unknown, unknown>>();
  const visiting = new Set<string>();

  function visit(key: ServiceType): Layer.Layer<never, unknown, unknown> {
    const existing = layers.get(key.key);

    if (existing) {
      return existing;
    }

    const value = Context.getOption(provided, key);

    if (Option.isSome(value)) {
      const layer = Layer.succeed(key, value.value);
      layers.set(key.key, layer);

      return layer;
    }

    if (visiting.has(key.key)) {
      throw new Error(`Circular service dependency: ${[...visiting, key.key].join(' → ')}`);
    }

    visiting.add(key.key);

    const alias = aliases.get(key.key);
    const definition = definitions.get(key.key);
    let layer: Layer.Layer<never, unknown, unknown>;

    if (alias) {
      layer = Layer.effect(key, alias).pipe(Layer.provideMerge(visit(alias)));
    } else {
      if (!definition?.layer) {
        throw new Error(`No layer provided for service ${key.key}`);
      }

      const dependencies = definition.dependencies?.() ?? [];
      layer = dependencies.length === 0 ? definition.layer : definition.layer.pipe(Layer.provideMerge(merge(dependencies.map(visit))));
    }

    visiting.delete(key.key);
    layers.set(key.key, layer);

    return layer;
  }

  // Module lists are selected dynamically; visit has checked every required key.
  return merge(roots.map(visit)) as unknown as Layer.Layer<any, unknown, never>;
}

function merge(layers: readonly Layer.Layer<never, unknown, unknown>[]): Layer.Layer<never, unknown, unknown> {
  return layers.length === 0 ? Layer.empty : Layer.mergeAll(layers[0]!, ...layers.slice(1));
}
