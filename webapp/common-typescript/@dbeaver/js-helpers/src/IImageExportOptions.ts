/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export const IMAGE_EXPORT_FORMATS = ['SVG', 'PNG'] as const;

export type ImageExportFormat = (typeof IMAGE_EXPORT_FORMATS)[number];

export interface IImageExportOptions {
  fileName: string;
  format: ImageExportFormat;
  transparent: boolean;
}

/** Turns the requested options into the name the file is saved under, see {@link timestampedImageFileName}. */
export type ImageExportFileNameFormatter = (options: IImageExportOptions) => string;

export interface IImageExportResult {
  fileName: string;
  format: ImageExportFormat;
  blob: Blob;
}

export type ImageExportReadyHandler = (result: IImageExportResult) => void | Promise<void>;

/** For consumers that cannot take a Blob, see {@link toDataUrlImageExport}. */
export interface IImageExportDataUrlResult {
  fileName: string;
  format: ImageExportFormat;
  dataUrl: string;
}

export type ImageExportDataUrlReadyHandler = (result: IImageExportDataUrlResult) => void;
