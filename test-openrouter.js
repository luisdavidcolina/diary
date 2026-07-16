const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error("❌ ERROR: No se encontró OPENROUTER_API_KEY en .env");
  process.exit(1);
}

async function testOpenRouter() {
  console.log("⏳ Conectando a OpenRouter usando el modelo gratuito Gemini Flash...");
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Usamos un modelo 100% gratuito que nos servirá perfecto para el chat
        model: 'google/gemma-4-31b-it:free', 
        messages: [
          { role: 'user', content: '¿Hola, puedes leerme? Responde muy corto.' }
        ],
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ RESPUESTA EXITOSA DE OPENROUTER:");
      console.log(data.choices[0].message.content);
    } else {
      console.error("❌ ERROR DE LA API:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ ERROR DE RED:", error.message);
  }
}

testOpenRouter();
