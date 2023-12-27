export function blobToHex(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        const buffer = new Uint8Array(reader.result);
        const hex = Array.from(buffer)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
        resolve(hex);
      } else {
        reject(new Error('Failed to read Blob as ArrayBuffer'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Blob'));
    };

    reader.readAsArrayBuffer(blob);
  });
}
