import https from 'https';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("❌ ERROR: No se encontró la variable GROQ_API_KEY en el archivo .env");
  process.exit(1);
}

const data = JSON.stringify({
  model: "llama-3.1-8b-instant", // El modelo más barato y rápido
  messages: [
    { role: "system", content: "Eres un asistente de prueba. Responde de forma muy concisa." },
    { role: "user", content: "¿Hola, me escuchas? ¿De qué color es el cielo?" }
  ],
  temperature: 0.7
});

const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    if (res.statusCode === 200) {
      const json = JSON.parse(body);
      console.log('✅ RESPUESTA EXITOSA DE GROQ:');
      console.log(json.choices[0].message.content);
    } else {
      console.log('❌ ERROR:', body);
    }
  });
});

req.on('error', console.error);
req.write(data);
req.end();
