/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISaveImageOptions } from './ISaveImageOptions.js';

export interface IPreparedSVG {
  src: string;
  width: number;
  height: number;
}

interface ICachedImage {
  promise: Promise<string | null>;
  elements: SVGImageElement[];
}

const fontImport = '@import url("https://fonts.googleapis.com/css?family=RobotoMono:300,400,500");';
const xlink = 'http://www.w3.org/1999/xlink';
const xmlNs = 'http://www.w3.org/2000/xmlns/';
const xhtmlNs = 'http://www.w3.org/1999/xhtml';
const svgNs = 'http://www.w3.org/2000/svg';

function loadImage(src: string): Promise<string | null> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    const img = new Image();

    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onerror = () => {
      console.error(`Could not load image "${src}"`);
      resolve(null);
    };
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img as unknown as CanvasImageSource, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
  });
}

async function inlineImages(el: SVGSVGElement) {
  const images = Array.from(el.querySelectorAll('image'));
  const cached: Map<string, ICachedImage> = new Map();

  for (const image of images) {
    const href = image.getAttributeNS(xlink, 'href') || image.getAttribute('href');

    if (!href) {
      continue;
    }

    if (!cached.has(href)) {
      cached.set(href, {
        promise: loadImage(href),
        elements: [],
      });
    }

    const cache = cached.get(href)!;
    cache.elements.push(image);
  }

  for (const obj of cached.values()) {
    const dataUrl = await obj.promise;

    if (dataUrl) {
      for (const image of obj.elements) {
        image.setAttributeNS(xlink, 'href', dataUrl);
      }
    }
  }
}

export async function prepareSvg(el: SVGSVGElement, options: ISaveImageOptions): Promise<IPreparedSVG> {
  await inlineImages(el);

  const bgColor = options.backgroundColor || el.style.backgroundColor;
  const rect = document.createElementNS(svgNs, 'rect');
  const scale = options.scale || 1;

  rect.setAttributeNS(null, 'width', '100%');
  rect.setAttributeNS(null, 'height', '100%');
  rect.setAttributeNS(null, 'x', `${options.left}px`);
  rect.setAttributeNS(null, 'y', `${options.top}px`);
  rect.setAttributeNS(null, 'fill', bgColor);

  el.insertBefore(rect, el.firstChild);

  el.setAttribute('version', '1.1');
  el.setAttribute('viewBox', [options.left, options.top, options.width, options.height].join(' '));
  if (!el.getAttribute('xmlns')) {
    el.setAttributeNS(xmlNs, 'xmlns', svgNs);
  }
  if (!el.getAttribute('xmlns:xlink')) {
    el.setAttributeNS(xmlNs, 'xmlns:xlink', xlink);
  }

  el.setAttribute('width', String(options.width * scale));
  el.setAttribute('height', String(options.height * scale));

  el.querySelectorAll('foreignObject > *').forEach((foreignObject: any) => {
    foreignObject.setAttributeNS(xmlNs, 'xmlns', foreignObject.tagName === 'svg' ? svgNs : xhtmlNs);
  });

  const style = document.createElement('style');

  style.setAttribute('type', 'text/css');
  style.innerHTML = fontImport;

  const defs = document.createElement('defs');

  defs.appendChild(style);
  el.insertBefore(defs, el.firstChild);

  const outer = document.createElement('div');

  outer.appendChild(el);
  const src = outer.innerHTML.replace(/NS\d+:href/gi, `xmlns:xlink=${xlink} xlink:href`);

  return { src, width: options.width, height: options.height };
}
