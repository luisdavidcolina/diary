import React, { useState, useRef, useEffect } from 'react';
import { addTransaction, getTransactions, addJournalEntry, getJournalEntries, addHabitOrTask } from '../services/db';

export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const executeTool = async (functionCall) => {
    const { name, arguments: argsObj } = functionCall;
    
    try {
      if (name === 'add_transaction') {
        const { amount, description, type, category } = argsObj;
        await addTransaction(amount, description, type, category);
        return `Transacción agregada exitosamente: $${amount} (${description})`;
      } 
      
      if (name === 'get_finance_summary') {
        const txs = await getTransactions();
        let income = 0;
        let expense = 0;
        const byCategory = {};
        txs.forEach(t => {
          if (t.type === 'income') income += parseFloat(t.amount);
          else {
            expense += parseFloat(t.amount);
            const cat = t.category || 'other';
            byCategory[cat] = (byCategory[cat] || 0) + parseFloat(t.amount);
          }
        });
        return JSON.stringify({ totalIncome: income, totalExpense: expense, expensesByCategory: byCategory });
      }

      if (name === 'add_diary_entry') {
        const { text } = argsObj;
        await addJournalEntry(text, 'neutral');
        return "Entrada agregada al diario con éxito.";
      }

      if (name === 'get_diary_entries') {
        const entries = await getJournalEntries();
        return JSON.stringify(entries.slice(0, 5).map(e => ({ date: e.createdAt, content: e.content })));
      }

      if (name === 'schedule_reminder') {
        const { title, date, time, isRecurring } = argsObj;
        
        // 1. Guardar en BD (lifestyle)
        const dbDate = date || new Date().toISOString().split('T')[0];
        const docId = await addHabitOrTask(title, 'task', dbDate, time);
        
        // 2. Llamar API de QStash para programar recordatorio
        const endpoint = isRecurring ? '/api/schedule-recurring-reminder' : '/api/schedule-exact-reminder';
        const bodyPayload = isRecurring 
          ? { id: docId, title, time }
          : { id: docId, title, date: dbDate, time };
          
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
        
        if (!res.ok) return "La tarea se guardó, pero hubo un error al programar la alarma en el servidor.";
        return `⏰ Recordatorio programado para las ${time}`;
      }

      if (name === 'get_docs_list') {
        const res = await fetch('/api/read-doc');
        const data = await res.json();
        return JSON.stringify(data.files || data.error);
      }

      if (name === 'read_doc_file') {
        const { filepath } = argsObj;
        const res = await fetch(`/api/read-doc?filepath=${encodeURIComponent(filepath)}`);
        const data = await res.json();
        return data.content || data.error || "No se pudo leer el archivo";
      }

      if (name === 'check_api_credits') {
        const res = await fetch('/api/get-credits');
        const data = await res.json();
        if (data.error) return `Error al consultar saldo: ${data.error}`;
        return `Has consumido $${data.usage} de la API.`;
      }

      return "Error: Herramienta desconocida";
    } catch (e) {
      return `Error ejecutando herramienta: ${e.message}`;
    }
  };

  const handleSend = async (text, history = messages) => {
    if (!text.trim() && !history.length) return;
    
    let newMessages = history;
    if (text) {
      newMessages = [...history, { role: 'user', content: text }];
      setMessages(newMessages);
      setInput('');
    }
    
    // Check if it's a direct command (bypass AI)
    if (text && text.startsWith('/')) {
      setIsLoading(true);
      try {
        let responseContent = '';
        if (text.startsWith('/gasto ')) {
          const parts = text.replace('/gasto ', '').trim().split(' ');
          const amount = parseFloat(parts[0]);
          const description = parts.slice(1).join(' ');
          if (!isNaN(amount)) {
            await addTransaction(amount, description || 'Gasto web', 'expense', 'other');
            responseContent = `💸 Gasto de $${amount} registrado.`;
          } else {
            responseContent = `⚠️ Formato inválido. Usa: /gasto [monto] [concepto]`;
          }
        } else if (text.startsWith('/ingreso ')) {
          const parts = text.replace('/ingreso ', '').trim().split(' ');
          const amount = parseFloat(parts[0]);
          const description = parts.slice(1).join(' ');
          if (!isNaN(amount)) {
            await addTransaction(amount, description || 'Ingreso web', 'income', 'other');
            responseContent = `💰 Ingreso de $${amount} registrado.`;
          } else {
            responseContent = `⚠️ Formato inválido. Usa: /ingreso [monto] [concepto]`;
          }
        } else if (text.startsWith('/diario ')) {
          const content = text.replace('/diario ', '').trim();
          await addJournalEntry(content, 'neutral');
          responseContent = `📖 Entrada de diario guardada.`;
        } else if (text.startsWith('/tarea ')) {
          const title = text.replace('/tarea ', '').trim();
          await addHabitOrTask(title, 'task');
          responseContent = `✅ Tarea guardada: ${title}`;
        } else if (text === '/creditos') {
          const res = await fetch('/api/get-credits');
          const data = await res.json();
          responseContent = data.error ? `⚠️ Error: ${data.error}` : `📊 Has gastado $${data.usage}`;
        } else if (text === '/help' || text === '/ayuda') {
          responseContent = `🤖 *Comandos Rápidos (Sin gastar API):*
• \`/gasto [monto] [concepto]\` - Ej: /gasto 5 Café
• \`/ingreso [monto] [concepto]\` - Ej: /ingreso 100 Sueldo
• \`/diario [texto]\` - Guarda un pensamiento
• \`/tarea [texto]\` - Añade una tarea pendiente
• \`/creditos\` - Revisa tu saldo de IA
• \`/help\` - Muestra esta lista

*¡Recuerda que si no usas la barra (/), la IA entenderá tus mensajes naturalmente!*`;
        } else {
          responseContent = `⚠️ Comando desconocido. Usa /help para ver la lista.`;
        }
        
        setMessages([...newMessages, { role: 'model', content: responseContent }]);
      } catch (e) {
        setMessages([...newMessages, { role: 'model', content: `❌ Error procesando comando: ${e.message}` }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      
      const data = await res.json();
      
      if (data.type === 'text') {
        setMessages([...newMessages, { role: 'model', content: data.text }]);
      } else if (data.type === 'function_call') {
        // Ejecutar función local
        const funcResult = await executeTool(data.functionCall);
        
        // Agregar la llamada y la respuesta al historial
        const historyWithFunc = [
          ...newMessages,
          { role: 'model', content: `(Ejecutando: ${data.functionCall.name}...)`, functionCall: data.functionCall },
          { role: 'function', name: data.functionCall.name, content: funcResult }
        ];
        
        setMessages(historyWithFunc);
        
        // Volver a llamar a la IA con el resultado para que de la respuesta final
        await handleSend('', historyWithFunc);
      }
    } catch (e) {
      console.error(e);
      setMessages([...newMessages, { role: 'model', content: '❌ Hubo un error de conexión con la IA.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)',
          border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        ✨
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '20px', zIndex: 1000,
          width: '350px', height: '500px', background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✨ Asistente IA
            </h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                <p>¡Hola! Soy tu asistente personal.</p>
                <p style={{ fontSize: '0.9rem' }}>Puedo guardar gastos, leer tu diario, o simplemente charlar. ¿En qué te ayudo?</p>
              </div>
            )}
            
            {messages.map((msg, i) => {
              if (msg.role === 'function') return null; // No mostrar las respuestas JSON crudas al usuario
              
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    background: isUser ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                    color: 'white', padding: '0.75rem 1rem', borderRadius: '16px',
                    borderBottomRightRadius: isUser ? '4px' : '16px',
                    borderBottomLeftRadius: !isUser ? '4px' : '16px',
                    maxWidth: '85%', wordBreak: 'break-word',
                    fontSize: '0.95rem'
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '16px', fontSize: '0.9rem' }}>
                  ⏳ Pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Escribe un comando o pregunta..."
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none' }}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 1rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ➔
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
