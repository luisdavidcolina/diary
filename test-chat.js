async function test() {
  const req = {
    method: 'POST',
    body: { messages: [{ role: 'user', content: 'que hora es' }] }
  };
  const res = {
    status: (code) => ({
      json: (data) => console.log(code, data),
      end: () => console.log(code)
    })
  };
  
  const { default: handler } = await import('./api/chat.js');
  await handler(req, res);
}
test();
