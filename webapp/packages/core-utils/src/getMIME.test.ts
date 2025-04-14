/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getMIME } from './getMIME.js';

describe('getMIME', () => {
  it("should return 'application/octet-stream' if binary is empty", () => {
    expect(getMIME('')).toBe('application/octet-stream');
  });

  it('should return image/jpeg if binary starts with /', () => {
    const jpegBase64Image =
      '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCABAAEADAREAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAABgcDBAUIAv/EADcQAAEDAwIFAQUHAgcAAAAAAAECAwQABREGIQcSEzFBYQgUIlFxFSMygZGhsUJiJCVScsHR4f/EABsBAAIDAQEBAAAAAAAAAAAAAAMEAgUGAQcA/8QALhEAAQQBAwMCBQMFAAAAAAAAAQACAxEEEiExBUFhE1EicYGx8ZGh0RQzQ8Hh/9oADAMBAAIRAxEAPwBtP24jOBXrBWZpZ70LvkZrodSEWqmuD3x+9FDwgliiEE/6anqCFoXtMNXgV8HBfaSpWoJ+VTtcorSh2wq8VIFdDbW21ATCiuyHNm2kFaifAAJqJlA2CK2LukVw59p+2TGEwNTlQfBCUzWkjf8A3j/kVRRZrXincq8kgbyxO6GIl6gom2+Q3MiuDKHWVcyTTtpIt7FeF2lRzhP7VDWAuena8JsxPcftUfWAXPRUqLJtsk1Jsy4YVOxaMAkgJSO6j4pgP7lC9MKRV2striKfeuMUYQpYBdG4COf+N/zFCfkgDZEbGAuaPaQ9paLEsVytGnJqpPvSiy44jKQhBZGQkj+7z61lc/qzWOEMJs9/Ht91dYWHqkY6QU0rlWNr6Bul+I4ypWMnGdsbfTeq1mc0H4m0ibEI/wBI8apWjFMvWG8vw1Pn42ivLeQexSdsf91cwdQY0CjYKXkYCKC6J4ce2xZrg+zE1DbUFSkpCpENeDnyeVWx7dgas4pIMs6Y5NLvPH6pbUYt3NsLovTGudCa1cSizajiSHjjLC1dNxG2d0q8bHeqzJfLikiQfoQfsrOBkM9Bh3KV/Hj2jtMcPtNyGdO3KNdr851Gm0MnqBhaduZYHiq13V2MadJt3ZRmxtJpcYai9qbXmo7PLYfuSmIk1bjjiGBykBSAnlBG+POKrJeqZMj3xXt/KGyCMboPf1Rdp0xD8mZIcfU0ltKio7JDYQlIx4wmqB08sz9d+Pp+E6GtDaHusK4dadDWhZUptpZOO5PgfxUoiGzWfYJiyfonebXw1lhTiml9RKcEE7/zXogjw3DcLE3lN4KpPad4ezGULZVKbSk4IS3nxUdGKAA1EYcjfUqjOldATZMXoLuLrpVyqS22MjfvjNfNbjOO26nqnFkppae4J2h5aEWu33ufLeQFISxHKie55dvOAaDLFjQAlwICkwzzmmLLm6Z0dFbfamtTYUwFSVtSGeQkjII381XD+jLxTv2RTHlMHxBCV60/oZDTZbLobBBA5dqDlQ42s6XbnwiY7sitwpxpzTUmKlTTDighKS24hRG5OMmsZlZwaC2I8X2VzDG4C3Ly3YLJBjh4RfgcSXVJVkYwM5/XxWWycycyFoduCnmsA5QZDsltjLz03XHCMnnO2flXrTQy7tJlgCbHDjhLfNdRA5BtyINrYyo3GUrkbBHcjbKiPTNWsOLLM3UwUB3KTfLDGdL+Snjw64S6E0y1BdkvI1HdeRt1TanA0wU53I5RkjfyTmraCCP/ABEWqqYuH9wbJ/Xfiza7XY2vcExbCuIrmjPRGQOVWOXHKn8edhjv8t6Hk9OZp9Uvo+d78V3tSxcsh/p6Laea2+t9q/KV2torPHzQzLGoIDVhvTTL6mJDaB+JSkkOEbK3x2O4zSY6ScyMOe3Q+ipSZjMaYiJ2ti5h1n7PV308zJYiOKlNpJRGJPxS8J5stg9sAnPqKzOf07Kgka0i7487b0reDLglaCw/PxuhRu23izxEtvRVhpop35NiebJH6AVg5Mcmbjkn9grmGiRQtXbkl4W5yQ80Hm0tEKUnwCR+lKT9OmYXOI21BOyxxi9+6aeg+Eds0m39o6pDVyl4yiEoAtN+qj/UfTt9a93wemMj+PI3Pssdl5rnW2EUPdG1w4qIjR0sRy3HjtpwhpICUpHoPlWk1MaNPZUBY9x1d0qeIfFx+1XCNc2HHFtKYW2ltpv7tKv7iO24FY7LzJMTM1R70OPC12LhxZmJpk2s8qxbOMQnxI0vA63IFoSr8ScgZHpWtx8uHIYJWCz9isdkYsuO8xPNf7CJIPFN37RYcUStoIUF5PcZH/tNukD3AX2SrYywE8rVv2s2B7m91hzRldZK1b5QEkHA8bHxSGaYpQyQ8tB/hTx4pWPewHZ35QYZrV3tDEdt3Kpbj/SfaOFAYR8e+xGSdjtWRh6PjZMDRMNyXEG/A3v5q+jzZ8WUuYeALH1OyXmsJlxsrMm2yHHLgywhbbruClLvKdlYG2+MV531TFkw5pMbXtq28hegQyjKxWT1u6j8j3CJdWcV2m47qTIKnVDCUJPxE16iyZ73bcLJSRsY03yl3cdVTbmtbxd6Sl4CWz/SB6miOy2s+G0q3FdJup9G3pu9PSrDcG2nw8OqkOq3wndQH5ZP1FZzqErXOE4+RWj6azSDA7vusOXMZjtyYsRZEqO4SWCQVbAdsHtjG3r6UzgzticSza+Qls/H9Rul/bgqW260lPI93CUtvBOyDsv8vmK0LMhth5Kzbsd9FgCIGNXicy3EclJblJStCOZY+FKhjf8AeuSSXJtwQQVKJg0fFsQRSsaBlPRY1sS8C+qI+8h5POSAM7AehwDQOmtboi1UdJIvwi5t3IGmrA2WfxN/w1tXLt0h5t+VKPWSvJ2ySEowRgYJHrVb17Dx9AneLJd+APZO9HyZifRGwAH/AEpdxJyQjrOqy+od1+KXlyOQOE9DBqr3KtLnq6Tanl8ylDCG84Ur6VXOl5pONjNC1kR9Ru2G5tTIiv8AMEK5+sjH3fySPpUX3JGW9kSIthlDu6xpWvG3ozqRHeYm8p51tKQkKJUM82Eg+Bt86Pj4zxTn0lsnLY4uDQfkvEK63a69JJKumNk5G5+pHerVpZHe6p9Uku3ZFsSK5ZQxIU3jGAoFec0M5Gs1abjg0C6V6HqVdjnHkdUY76ytlR3zknIP0pjBksOaebtBzYwNLmo0nGHf4zAduEVlttxK0BzmPOcHJGAe2360DNcZdLX8DdTw6i1OZydl/9k=';
    expect(getMIME(jpegBase64Image)).toBe('image/jpeg');
  });

  it('should return image/png if binary starts with i', () => {
    const pngBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    expect(getMIME(pngBase64Image)).toBe('image/png');
  });

  it('should return image/gif if binary starts with R', () => {
    const gifBase64Image = 'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
    expect(getMIME(gifBase64Image)).toBe('image/gif');
  });

  it('should return image/webp if binary starts with U', () => {
    const webpBase64Image = 'UklGRmh2AABXRUJQVlA4IFx2AADSvgGdASom';
    expect(getMIME(webpBase64Image)).toBe('image/webp');
  });

  it("should return 'application/octet-stream' if binary starts with anything else", () => {
    expect(getMIME('aasdqwe')).toBe('application/octet-stream');
  });
});
