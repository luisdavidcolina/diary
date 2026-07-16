import https from 'https';

const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyFakeKey1234567890123456789012345';
const data = JSON.stringify({
  contents: [{ role: 'user', parts: [{ text: 'hola' }] }]
});

const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => console.log(res.statusCode, body));
});
req.on('error', console.error);
req.write(data);
req.end();
