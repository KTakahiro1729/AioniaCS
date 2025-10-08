const DEFAULT_FILE_NAME = 'gm-session.json';

export function downloadGmSession(payload, fileName = DEFAULT_FILE_NAME) {
  if (!payload) return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function readGmSessionFile(file) {
  if (!file) return null;
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse GM session file:', error);
    throw new Error('GMセッションデータの読み込みに失敗しました');
  }
}
