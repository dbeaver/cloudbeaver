/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getMIME(binary: string): string {
  if (binary.length === 0) {
    return 'application/octet-stream';
  }

  switch (binary[0]) {
    case '/':
      return 'image/jpeg';
    case 'i':
      return 'image/png';
    case 'R':
      return 'image/gif';
    case 'U':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

// function getMimeType(blob: Blob, callback) {
//   const fileReader = new FileReader();

//   fileReader.onloadend = function (event) {
//     let mimeType = '';

//     const arr = new Uint8Array(event.target.result).subarray(
//       0,
//       4,
//     );
//     let header = '';

//     for (let index = 0; index < arr.length; index++) {
//       header += arr[index].toString(16);
//     }

//     // View other byte signature patterns here:
//     // 1) https://mimesniff.spec.whatwg.org/#matching-an-image-type-pattern
//     // 2) https://en.wikipedia.org/wiki/List_of_file_signatures
//     switch (header) {
//       case '89504e47': {
//         mimeType = 'image/png';
//         break;
//       }
//       case '47494638': {
//         mimeType = 'image/gif';
//         break;
//       }
//       case '52494646':
//       case '57454250':
//         mimeType = 'image/webp';
//         break;
//       case '49492A00':
//       case '4D4D002A':
//         mimeType = 'image/tiff';
//         break;
//       case 'ffd8ffe0':
//       case 'ffd8ffe1':
//       case 'ffd8ffe2':
//       case 'ffd8ffe3':
//       case 'ffd8ffe8':
//         mimeType = 'image/jpeg';
//         break;
//       default: {
//         mimeType = blob.type;
//         break;
//       }
//     }

//     callback(mimeType);
//   };

//   fileReader.readAsArrayBuffer(blob.slice(0, 4));
// }
