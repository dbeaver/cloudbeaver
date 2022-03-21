/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function openCenteredPopup(
  url?: string,
  target?: string,
  width = 500,
  height = 500,
  features?: string
): Window | null {
  if (window.top === null) {
    return null;
  }

  const systemZoom = window.top.outerWidth / window.screen.availWidth;
  const top = (window.top.outerHeight - height) / 2 / systemZoom + window.top.screenY;
  const left = (window.top.outerWidth - width) / 2 / systemZoom + window.top.screenX;
  const windowFeatures = `toolbar=no, menubar=no, width=${width / systemZoom}, height=${height / systemZoom}, top=${top}, left=${left}${features}`;

  return window.open(url, target, windowFeatures);
}
