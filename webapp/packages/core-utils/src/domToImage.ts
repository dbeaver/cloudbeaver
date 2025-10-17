/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// @ts-ignore
import * as dti from 'dom-to-image';

export interface DomToImage {
  toSvg(node: Node, options?: DomToImageOptions): Promise<string>;
  toPng(node: Node, options?: DomToImageOptions): Promise<string>;
  toJpeg(node: Node, options?: DomToImageOptions): Promise<string>;
  toBlob(node: Node, options?: DomToImageOptions): Promise<Blob>;
  toPixelData(node: Node, options?: DomToImageOptions): Promise<Uint8ClampedArray>;
}

export interface DomToImageOptions {
  filter?: ((node: Node) => boolean) | undefined;
  bgcolor?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  style?: {} | undefined;
  quality?: number | undefined;
  imagePlaceholder?: string | undefined;
  cacheBust?: boolean | undefined;
}

const domToImage: DomToImage = dti;

export { domToImage };
