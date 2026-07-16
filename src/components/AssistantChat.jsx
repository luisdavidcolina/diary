import React, { useState, useRef, useEffect } from 'react';
import { addTransaction, getTransactions, addJournalEntry, getJournalEntries, addHabitOrTask, getLifestyleItems, queryCollection, updateRecord, deleteRecord, addChatMessage, getChatMessages, getApiUsageLogs } from '../services/db';

const txUSD = (t) => (t.amountUSD != null ? t.amountUSD : parseFloat(t.amount) || 0);
const isThisMonth = (iso) => {
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
};

export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCostInfo, setDailyCostInfo] = useState(null);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' | 'stats'
  const [apiLogs, setApiLogs] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        getChatMessages().then(msgs => {
          if (msgs.length > 0) setMessages(msgs);
        });
      }
      // Fetch daily cost info
      fetch('/api/get-credits?type=daily')
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) setDailyCostInfo(data);
        })
        .catch(console.error);
        
      if (viewMode === 'stats') {
        getApiUsageLogs().then(setApiLogs).catch(console.error);
      }
    }
  }, [isOpen, viewMode]);

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
        const endpoint = isRecurring ? '/api/reminders?action=schedule-recurring' : '/api/reminders?action=schedule-exact';
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

      // CRUD genérico sobre cualquier colección permitida.
      if (name === 'db_query') {
        const { collection, limit } = argsObj;
        const data = await queryCollection(collection);
        return JSON.stringify(data.slice(0, limit || (collection === 'syllabus' ? 100 : 10)));
      }
      if (name === 'db_update') {
        const { collection, id, data } = argsObj;
        await updateRecord(collection, id, data);
        return `Registro actualizado en ${collection}.`;
      }
      if (name === 'db_delete') {
        const { collection, id } = argsObj;
        await deleteRecord(collection, id);
        return `Registro eliminado de ${collection}.`;
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
      addChatMessage('user', text);
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
        } else if (text === '/saldo') {
          const txs = (await getTransactions()).filter(t => isThisMonth(t.createdAt));
          const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + txUSD(t), 0);
          const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + txUSD(t), 0);
          const bal = income - expense;
          responseContent = `📊 Balance del mes:\n💰 Ingresos: $${income.toFixed(2)}\n💸 Gastos: $${expense.toFixed(2)}\n${bal >= 0 ? '✅' : '⚠️'} Balance: $${bal.toFixed(2)}`;
        } else if (text === '/gastos') {
          const txs = (await getTransactions()).slice(0, 10);
          responseContent = txs.length
            ? `🧾 Últimos movimientos:\n${txs.map(t => `${t.type === 'expense' ? '💸' : '💰'} $${txUSD(t).toFixed(2)} — ${t.description || 'Sin concepto'}`).join('\n')}`
            : '🧾 No tienes movimientos aún.';
        } else if (text === '/tareas') {
          const pend = (await getLifestyleItems()).filter(i => i.category === 'task' && !i.isCompleted);
          responseContent = pend.length
            ? `📋 Tareas pendientes (${pend.length}):\n${pend.map(t => `• ${t.title}`).join('\n')}`
            : '✅ ¡Inbox limpio! Sin tareas pendientes.';
        } else if (text === '/help' || text === '/ayuda') {
          responseContent = `🤖 Comandos rápidos (sin gastar IA):

📝 Registrar:
• /gasto [monto] [concepto]
• /ingreso [monto] [concepto]
• /diario [texto]
• /tarea [texto]

🔎 Consultar:
• /saldo — balance del mes
• /gastos — últimos movimientos
• /tareas — pendientes
• /creditos — saldo de IA

Si no usas la barra (/), la IA entiende tus mensajes naturalmente.`;
        } else {
          responseContent = `⚠️ Comando desconocido. Usa /help para ver la lista.`;
        }
        
        setMessages([...newMessages, { role: 'model', content: responseContent }]);
        addChatMessage('model', responseContent);
      } catch (e) {
        const errMsg = `❌ Error procesando comando: ${e.message}`;
        setMessages([...newMessages, { role: 'model', content: errMsg }]);
        addChatMessage('model', errMsg);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send only the last 5 messages to save tokens
      const contextToSend = newMessages.slice(-5);
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextToSend })
      });
      
      const data = await res.json();
      
      if (data.type === 'text') {
        setMessages([...newMessages, { role: 'model', content: data.text }]);
        addChatMessage('model', data.text);
      } else if (data.type === 'function_call') {
        // En lugar de ejecutar de inmediato, lo mandamos a la bandeja de aprobación
        const proposalMsg = { 
          role: 'model', 
          type: 'proposal', 
          content: `Me gustaría ejecutar una acción: ${data.functionCall.name}`, 
          functionCall: data.functionCall,
          status: 'pending'
        };
        setMessages([...newMessages, proposalMsg]);
        addChatMessage('model', proposalMsg.content, data.functionCall);
      }
    } catch (e) {
      console.error(e);
      setMessages([...newMessages, { role: 'model', content: '❌ Hubo un error de conexión con la IA.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveProposal = async (index, msg) => {
    // Actualizamos UI a 'executing'
    const updatedMessages = [...messages];
    updatedMessages[index] = { ...msg, status: 'executing' };
    setMessages(updatedMessages);
    
    // Ejecutamos la herramienta
    const funcResult = await executeTool(msg.functionCall);
    
    // Actualizamos la propuesta como aprobada
    updatedMessages[index] = { ...updatedMessages[index], status: 'approved', content: `✅ Acción ejecutada: ${msg.functionCall.name}` };
    
    const funcResponseMsg = { role: 'function', name: msg.functionCall.name, content: funcResult };
    const historyWithFunc = [...updatedMessages, funcResponseMsg];
    
    setMessages(historyWithFunc);
    addChatMessage('function', funcResult, null, { name: msg.functionCall.name, result: funcResult });
    
    // Informamos a la IA
    await handleSend('', historyWithFunc);
  };

  const handleRejectProposal = (index, msg) => {
    const updatedMessages = [...messages];
    updatedMessages[index] = { ...msg, status: 'rejected', content: `❌ Acción rechazada por el usuario.` };
    setMessages(updatedMessages);
    
    // Enviamos el rechazo a la IA simulando una respuesta de función
    const funcResponseMsg = { role: 'function', name: msg.functionCall.name, content: "El usuario rechazó la acción. Pregúntale si desea hacer algo más." };
    const historyWithFunc = [...updatedMessages, funcResponseMsg];
    setMessages(historyWithFunc);
    addChatMessage('function', funcResponseMsg.content, null, { name: msg.functionCall.name, result: 'rejected' });
    
    handleSend('', historyWithFunc);
  };

  return (
    <>
      {/* Botón Flotante */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
          width: '60px', height: '60px', borderRadius: '0',
          background: 'var(--brutal-yellow)',
          border: '3px solid #000', color: '#000', fontSize: '24px', cursor: 'pointer',
          boxShadow: '4px 4px 0 #000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s, box-shadow 0.15s'
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0 #000'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0 #000'; }}
      >
        ✨
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '20px', zIndex: 1000,
          width: '350px', height: '500px', background: 'var(--brutal-white)',
          border: '4px solid #000',
          borderRadius: '0', display: 'flex', flexDirection: 'column',
          boxShadow: '8px 8px 0 #000', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '1rem', background: 'var(--brutal-pink)', borderBottom: '4px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', color: '#000' }}>
                  ✨ Asistente IA
                </h3>
                <button 
                  onClick={() => setViewMode(viewMode === 'chat' ? 'stats' : 'chat')}
                  style={{ background: 'var(--brutal-white)', border: '2px solid #000', borderRadius: '0', cursor: 'pointer', fontWeight: 800, padding: '2px 8px', fontSize: '0.8rem', boxShadow: '2px 2px 0 #000' }}
                >
                  {viewMode === 'chat' ? '📊 Gastos' : '💬 Chat'}
                </button>
              </div>
              {dailyCostInfo && (
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: dailyCostInfo.total >= dailyCostInfo.limit ? 'darkred' : '#000' }}>
                  💰 Consumo Hoy: ${dailyCostInfo.total.toFixed(4)} / ${dailyCostInfo.limit}
                </div>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'var(--brutal-white)', border: '2px solid #000', color: '#000', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 #000' }}>X</button>
          </div>

          {viewMode === 'stats' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, borderBottom: '2px solid #000', paddingBottom: '0.5rem', fontWeight: 900 }}>Desglose de Costos</h4>
              {apiLogs.length === 0 ? (
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No hay consumos registrados recientemente.</p>
              ) : (
                apiLogs.map(log => (
                  <div key={log.id} style={{ border: '2px solid #000', padding: '0.75rem', background: 'var(--brutal-white)', boxShadow: '4px 4px 0 #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                      <span style={{ color: 'var(--brutal-blue)' }}>${Number(log.cost).toFixed(5)}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                      <span style={{ background: '#eee', padding: '2px 4px', border: '1px solid #000', marginRight: '4px' }}>Origen: {log.source}</span>
                      <span style={{ background: '#eee', padding: '2px 4px', border: '1px solid #000' }}>Tokens: {log.total_tokens || '?'} (P:{log.prompt_tokens || '?'} C:{log.completion_tokens || '?'})</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#444', wordBreak: 'break-word', borderLeft: '3px solid var(--brutal-pink)', paddingLeft: '0.5rem' }}>
                      "{log.promptPreview || 'Sin prompt'}"
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#000', marginTop: '2rem', border: '2px solid #000', background: 'var(--brutal-yellow)', padding: '1rem', boxShadow: '4px 4px 0 #000' }}>
                <p style={{fontWeight: 900, textTransform: 'uppercase'}}>¡Hola! Soy tu asistente.</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Puedo guardar gastos, leer tu diario, o simplemente charlar. ¿En qué te ayudo?</p>
              </div>
            )}
            
            {messages.map((msg, i) => {
              if (msg.role === 'function') return null; // No mostrar las respuestas JSON crudas al usuario
              
              const isUser = msg.role === 'user';
              
              if (msg.type === 'proposal') {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ 
                      background: 'var(--brutal-yellow)', color: '#000', padding: '1rem', borderRadius: '0',
                      border: '3px solid #000', boxShadow: '4px 4px 0 #000', maxWidth: '85%', fontWeight: 700
                    }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}>{msg.content}</p>
                      {msg.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handleApproveProposal(i, msg)} style={{ background: 'var(--brutal-green)', color: '#000', border: '2px solid #000', padding: '0.5rem', fontWeight: 900, cursor: 'pointer', boxShadow: '2px 2px 0 #000' }}>✅ Aprobar</button>
                          <button onClick={() => handleRejectProposal(i, msg)} style={{ background: 'var(--brutal-pink)', color: '#000', border: '2px solid #000', padding: '0.5rem', fontWeight: 900, cursor: 'pointer', boxShadow: '2px 2px 0 #000' }}>❌ Rechazar</button>
                        </div>
                      )}
                      {msg.status === 'executing' && <span style={{ fontSize: '0.9rem' }}>⏳ Ejecutando...</span>}
                      {msg.status === 'approved' && <span style={{ fontSize: '0.9rem', color: 'green' }}>✅ Aprobado</span>}
                      {msg.status === 'rejected' && <span style={{ fontSize: '0.9rem', color: 'red' }}>❌ Rechazado</span>}
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    background: isUser ? 'var(--brutal-green)' : 'var(--brutal-white)',
                    color: '#000', padding: '0.75rem 1rem', borderRadius: '0',
                    border: '3px solid #000',
                    boxShadow: '4px 4px 0 #000',
                    maxWidth: '85%', wordBreak: 'break-word',
                    fontSize: '0.95rem',
                    fontWeight: 700
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: 'var(--brutal-orange)', border: '2px solid #000', boxShadow: '2px 2px 0 #000', color: '#000', padding: '0.5rem 1rem', borderRadius: '0', fontSize: '0.9rem', fontWeight: 800 }}>
                  ⏳ Pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem', borderTop: '4px solid #000', background: 'var(--brutal-yellow)' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Escribe un comando o pregunta..."
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0', border: '3px solid #000', background: '#fff', color: '#000', outline: 'none', fontWeight: 600, boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.1)' }}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                style={{ background: 'var(--brutal-blue)', color: '#000', border: '3px solid #000', borderRadius: '0', padding: '0 1rem', cursor: 'pointer', fontWeight: 900, boxShadow: '2px 2px 0 #000', transition: 'all 0.15s' }}
                onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '0 0 0 #000'; }}}
                onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0 #000'; }}}
              >
                ➔
              </button>
            </form>
          </div>
          </>
          )}
        </div>
      )}
    </>
  );
}
