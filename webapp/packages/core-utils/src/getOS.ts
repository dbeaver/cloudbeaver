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
