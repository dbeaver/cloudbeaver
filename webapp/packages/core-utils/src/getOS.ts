/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export enum OperatingSystem {
  windowsOS,
  macOS,
  linuxOS,
  unixOS,
  iOS,
  androidOS,
}

export function getOS(): OperatingSystem {
  const operatingSystemOptions: Array<[string, OperatingSystem]> = [
    ['Win', OperatingSystem.windowsOS],
    ['like Mac', OperatingSystem.iOS],
    ['Mac', OperatingSystem.macOS],
    ['Android', OperatingSystem.androidOS],
    ['Linux', OperatingSystem.linuxOS],
    ['X11', OperatingSystem.unixOS],
  ];

  const userAgent = window.navigator.userAgent;
  const OS = operatingSystemOptions.find(([testString]) => userAgent.includes(testString))?.[1] ?? OperatingSystem.windowsOS;
  return OS;
}
