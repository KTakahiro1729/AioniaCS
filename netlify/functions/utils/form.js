import Busboy from 'busboy';

export function parseMultipartForm(event, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = event.headers || {};
    const contentType = headers['content-type'] || headers['Content-Type'];

    if (!contentType) {
      reject(new Error('Content-Type header is required.'));
      return;
    }

    const busboy = Busboy({ headers: { 'content-type': contentType }, limits: options.limits });
    const files = [];
    const fields = {};

    busboy.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('limit', () => reject(new Error('アップロード可能なサイズを超えています。')));
      file.on('end', () => {
        files.push({
          fieldname: name,
          filename: info.filename,
          mimeType: info.mimeType,
          encoding: info.encoding,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.once('error', reject);
    busboy.once('finish', () => resolve({ files, fields }));

    const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    busboy.end(body);
  });
}
