export function hexToBlob(hexdata: string): Blob {
  const byteArray = new Uint8Array(hexdata.length / 2);
  for (let x = 0; x < byteArray.length; x++) {
    byteArray[x] = parseInt(hexdata.substring(x * 2, x * 2 + 2), 16);
  }

  return new Blob([byteArray], { type: 'application/octet-stream' });
}
