/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
// import { fileURLToPath } from 'node:url';
import type { Plugin, PluginOption } from 'vite';
// @ts-ignore
import { DynamicPublicDirectory } from 'vite-multiple-assets';

import { getAssets } from './getAssets.js';

const ICON_SPRITE_PATH = path.join('icons', 'preload', 'icons.svg');

export interface IIconSpriteAsset {
  filePath: string;
  uri: string;
}

export function getIconSpriteAsset(): IIconSpriteAsset {
  const assets = getAssets(path.join(process.cwd(), 'package.json'));
  const iconSpritePath = assets.map(asset => path.join(asset, ICON_SPRITE_PATH)).find(asset => fs.existsSync(asset));
  if (!iconSpritePath) {
    throw new Error(`Icon sprite not found: ${ICON_SPRITE_PATH}`);
  }

  const hash = createHash('sha256').update(fs.readFileSync(iconSpritePath)).digest('hex').slice(0, 12);

  return {
    filePath: iconSpritePath,
    uri: `icons/preload/icons.${hash}.svg`,
  };
}

export function copyAssetsPlugin(iconSprite = getIconSpriteAsset()): PluginOption {
  // let rootPath = fileURLToPath(import.meta.url);
  const assets = getAssets(path.join(process.cwd(), 'package.json'));
  const normalizedAssets = assets.map(asset =>
    path
      .normalize(`${asset}/**`)
      // the DynamicPublicDirectory plugin expects paths to be in posix format (to include images and fonts for windows)
      .replace(/\\/g, '/'),
  );
  const normalizedIconSpritePath = path.normalize(iconSprite.filePath).replace(/\\/g, '/');
  const iconSpritePlugin: Plugin = {
    name: 'icon-sprite',
    configureServer(server) {
      server.watcher.add(iconSprite.filePath);
      server.watcher.on('change', file => {
        if (path.resolve(file) === path.resolve(iconSprite.filePath)) {
          void server.restart();
        }
      });
      server.middlewares.use((request, response, next) => {
        if (new URL(request.url ?? '/', 'http://localhost').pathname !== `/${iconSprite.uri}`) {
          next();
          return;
        }

        response.setHeader('Content-Type', 'image/svg+xml');
        response.end(fs.readFileSync(iconSprite.filePath));
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: iconSprite.uri,
        source: fs.readFileSync(iconSprite.filePath),
      });
    },
  };

  return [
    DynamicPublicDirectory(normalizedAssets, {
      ignore: [normalizedIconSpritePath],
    }),
    iconSpritePlugin,
  ];
  // return {
  //   name: 'copy-assets',
  //   configResolved(config) {
  //     rootPath = config.root;
  //   },
  //   async buildStart() {
  //     const assets = getAssets(fs.join(rootPath, '..', 'package.json'));

  //     for (const asset of assets) {
  //       fsExtra.copySync(asset, './src/public/', { overwrite: true });
  //     }
  //   },
  // };
}
