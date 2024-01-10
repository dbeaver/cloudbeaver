import { getOS, OperatingSystem } from './getOS';

describe('getOS', () => {
  it('should return windowsOS', () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Windows 11');
    expect(getOS()).toBe(OperatingSystem.windowsOS);
  });

  it('should return macOS', () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('MacOS Sonoma');
    expect(getOS()).toBe(OperatingSystem.macOS);
  });

  it('should return linuxOS', () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Linux Ubuntu');
    expect(getOS()).toBe(OperatingSystem.linuxOS);
  });

  it('should return unixOS', () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('X11');
    expect(getOS()).toBe(OperatingSystem.unixOS);
  });

  it('should return iOS', () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('like Mac');
    expect(getOS()).toBe(OperatingSystem.iOS);
  });

  it('should return Windows for unknown OS', () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('zzzz');
    expect(getOS()).toBe(OperatingSystem.windowsOS);
  });
});
