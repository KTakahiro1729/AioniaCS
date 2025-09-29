export function jsonResponse(status, data, initHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...initHeaders,
    },
  });
}

export function errorResponse(status, message) {
  return jsonResponse(status, { error: message });
}

export function okResponse(data) {
  return jsonResponse(200, data);
}
