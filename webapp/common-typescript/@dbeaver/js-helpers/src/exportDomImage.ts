/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { domToBlob, domToForeignObjectSvg, type Options } from 'modern-screenshot';

import { DEFAULT_MAX_IMAGE_SIDE, fitToPixelBudget, type IPixelBudget } from './fitToPixelBudget.js';
import type { IImageExportOptions, ImageExportFileNameFormatter, ImageExportReadyHandler } from './IImageExportOptions.js';
import { isImageBroken } from './isImageBroken.js';
import { timestampedImageFileName } from './timestampedImageFileName.js';

export const IMAGE_EXPORT_BROKEN_ERROR = 'Something went wrong. Please try to select another file format';

const DEFAULT_BACKGROUND_COLOR = '#ffffff';
const DEFAULT_PNG_SCALE = 2;

export interface IDomImageExportConfig extends IPixelBudget {
  /** In CSS pixels, defaults to the bounding box of `node`. Required for nodes with no box of their own. */
  width?: number;
  height?: number;
  /** Used when `options.transparent` is false. */
  backgroundColor?: string;
  /** Applied to the clone before rendering, the live DOM is left alone. */
  style?: Partial<CSSStyleDeclaration>;
  /** Return false to keep a node (and its children) out of the snapshot. */
  filter?: (node: Node) => boolean;
  /** Defaults to {@link timestampedImageFileName}. */
  formatFileName?: ImageExportFileNameFormatter;
}

/**
 * PNG is scaled down to fit {@link fitToPixelBudget}, SVG is always 1:1
 */
export async function exportDomImage(
  node: Element,
  options: IImageExportOptions,
  onReady: ImageExportReadyHandler,
  config?: IDomImageExportConfig,
): Promise<void> {
  const { width, height } = resolveSize(node, config);
  const scale = options.format === 'PNG' ? fitToPixelBudget(width, height, { ...config, scale: config?.scale ?? DEFAULT_PNG_SCALE }) : 1;

  const screenshotOptions: Options = {
    // a size given here is forced onto the clone, so pass it on only when asked for
    ...(config?.width === undefined ? {} : { width: config.width }),
    ...(config?.height === undefined ? {} : { height: config.height }),
    scale,
    style: config?.style,
    filter: config?.filter,
    backgroundColor: options.transparent ? 'transparent' : (config?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR),
    quality: 1,
    maximumCanvasSize: config?.maxSide ?? DEFAULT_MAX_IMAGE_SIDE,
  };

  const blob = options.format === 'PNG' ? await renderPng(node, screenshotOptions) : await renderSvg(node, screenshotOptions);
  const uri = URL.createObjectURL(blob);
  const broken = await isImageBroken(uri);
  URL.revokeObjectURL(uri);

  if (broken) {
    throw new Error(IMAGE_EXPORT_BROKEN_ERROR);
  }

  const formatFileName = config?.formatFileName ?? timestampedImageFileName;

  await onReady({ fileName: formatFileName(options), format: options.format, blob });
}

function renderPng(node: Element, screenshotOptions: Options): Promise<Blob> {
  return domToBlob(node, { ...screenshotOptions, type: 'image/png' });
}

async function renderSvg(node: Element, screenshotOptions: Options): Promise<Blob> {
  const svg = await domToForeignObjectSvg(node, screenshotOptions);
  const svgData = new XMLSerializer().serializeToString(svg);

  return new Blob(['<?xml version="1.0" standalone="no"?>\r\n', svgData], { type: 'image/svg+xml;charset=utf-8' });
}

function resolveSize(node: Element, config?: IDomImageExportConfig): { width: number; height: number } {
  if (config?.width !== undefined && config.height !== undefined) {
    return { width: config.width, height: config.height };
  }

  const rect = node.getBoundingClientRect();

  return { width: rect.width, height: rect.height };
}
