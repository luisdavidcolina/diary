import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { addTransaction, getTransactions, addJournalEntry, getJournalEntries, addHabitOrTask, getLifestyleItems, queryCollection, updateRecord, deleteRecord, addChatMessage, getChatMessages, getApiUsageLogs, createChatSession, getBotConfig, saveBotConfig } from '../services/db';

const txUSD = (t) => (t.amountUSD != null ? t.amountUSD : parseFloat(t.amount) || 0);
const isThisMonth = (iso) => {
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
};

export default function AssistantChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(() => localStorage.getItem('activeChatSession'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCostInfo, setDailyCostInfo] = useState(null);
  const [viewMode, setViewMode] = useState('chat'); // kept temporarily just in case
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [botConfig, setBotConfig] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      getBotConfig().then(cfg => setBotConfig(cfg));
      if (currentSessionId) {
        getChatMessages(currentSessionId).then(msgs => setMessages(msgs));
      } else {
        setMessages([]);
      }
      
      fetch('/api/get-credits?type=daily')
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) setDailyCostInfo(data);
        })
        .catch(console.error);
    }
  }, [isOpen, currentSessionId]);

  useEffect(() => {
    const handleSessionChange = (e) => {
      const sessionId = e.detail;
      setCurrentSessionId(sessionId);
      if (sessionId) {
        localStorage.setItem('activeChatSession', sessionId);
      } else {
        localStorage.removeItem('activeChatSession');
      }
      setIsOpen(true);
    };
    window.addEventListener('chat_session_changed', handleSessionChange);
    return () => window.removeEventListener('chat_session_changed', handleSessionChange);
  }, []);

  const ensureSession = async (text) => {
    let sid = currentSessionId;
    if (!sid) {
      sid = await createChatSession(text ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : "Nuevo Chat");
      setCurrentSessionId(sid);
      localStorage.setItem('activeChatSession', sid);
    }
    return sid;
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

      if (name === 'get_exchange_rates') {
        try {
          const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar');
          const data = await res.json();
          const bcv = data.monitors.bcv.price;
          const paralelo = data.monitors.enparalelovzla.price;
          return `Tasas actuales: BCV (Bs. ${bcv}), Paralelo (Bs. ${paralelo})`;
        } catch(e) {
          return "No se pudieron obtener las tasas de cambio en este momento.";
        }
      }

      if (name === 'navigate_to') {
        const { path } = argsObj;
        navigate(path);
        setTimeout(() => setIsOpen(false), 1500); // Close chat shortly after
        return `Navegación exitosa a ${path}.`;
      }

      return "Error: Herramienta desconocida";
    } catch (e) {
      return `Error ejecutando herramienta: ${e.message}`;
    }
  };

  const handleSend = async (text, history = messages) => {
    if (!text.trim() && !attachedFiles.length && !history.length) return;
    
    const sid = await ensureSession(text || "Consulta con imagen");
    
    let newMessages = history;
    const currentAttachments = [...attachedFiles];
    if (text || currentAttachments.length > 0) {
      const userMsg = { role: 'user', content: text };
      if (currentAttachments.length > 0) {
        userMsg.images = currentAttachments;
      }
      newMessages = [...history, userMsg];
      setMessages(newMessages);
      setInput('');
      setAttachedFiles([]);
      addChatMessage(sid, 'user', text, null, null, currentAttachments);
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
        } else if (text.startsWith('/modelo')) {
          const targetModel = text.replace('/modelo', '').trim();
          const currentCfg = await getBotConfig();
          
          if (!targetModel) {
            responseContent = `🤖 Modelo actual: *${currentCfg.model || 'openai/gpt-4o-mini'}*\n\nModelos disponibles:\n` +
              `• /modelo gpt-4o-mini (OpenAI)\n` +
              `• /modelo gpt-4o (OpenAI)\n` +
              `• /modelo claude-3-haiku (Anthropic)\n` +
              `• /modelo claude-3.5-sonnet (Anthropic)\n` +
              `• /modelo gemini-flash-1.5 (Google)\n` +
              `• /modelo gemini-pro-1.5 (Google)\n` +
              `• /modelo llama-3-8b (Meta)\n` +
              `• /modelo llama-3-70b (Meta)`;
          } else {
            const aliases = {
              'gpt-4o-mini': 'openai/gpt-4o-mini',
              'gpt-4o': 'openai/gpt-4o',
              'claude-3-haiku': 'anthropic/claude-3-haiku',
              'claude-haiku': 'anthropic/claude-3-haiku',
              'haiku': 'anthropic/claude-3-haiku',
              'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
              'claude-sonnet': 'anthropic/claude-3.5-sonnet',
              'sonnet': 'anthropic/claude-3.5-sonnet',
              'gemini-flash': 'google/gemini-flash-1.5',
              'gemini-flash-1.5': 'google/gemini-flash-1.5',
              'flash': 'google/gemini-flash-1.5',
              'gemini-pro': 'google/gemini-pro-1.5',
              'gemini-pro-1.5': 'google/gemini-pro-1.5',
              'pro': 'google/gemini-pro-1.5',
              'llama-3-8b': 'meta-llama/llama-3-8b-instruct',
              'llama-8b': 'meta-llama/llama-3-8b-instruct',
              'llama-3-70b': 'meta-llama/llama-3-70b-instruct',
              'llama-70b': 'meta-llama/llama-3-70b-instruct'
            };
            const canonical = aliases[targetModel.toLowerCase()];
            if (canonical) {
              const updated = { ...currentCfg, model: canonical };
              await saveBotConfig(updated);
              setBotConfig(updated);
              responseContent = `🤖 Motor de IA cambiado con éxito a:\n*${canonical}*`;
            } else {
              responseContent = `⚠️ Modelo no reconocido. Escribe \`/modelo\` para ver las opciones válidas.`;
            }
          }
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
• /modelo — ver/cambiar motor de IA

Si no usas la barra (/), la IA entiende tus mensajes naturalmente.`;
        } else {
          responseContent = `⚠️ Comando desconocido. Usa /help para ver la lista.`;
        }
        
        setMessages([...newMessages, { role: 'model', content: responseContent }]);
        addChatMessage(sid, 'model', responseContent);
      } catch (e) {
        const errMsg = `❌ Error procesando comando: ${e.message}`;
        setMessages([...newMessages, { role: 'model', content: errMsg }]);
        addChatMessage(sid, 'model', errMsg);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send last 12 messages to balance tokens and context
      let startIndex = Math.max(0, newMessages.length - 12);
      // Ensure we don't split a proposal and its function result
      if (startIndex > 0 && newMessages[startIndex].role === 'function') {
        startIndex--;
      }
      const contextToSend = newMessages.slice(startIndex);
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextToSend })
      });
      
      const data = await res.json();
      
      if (data.type === 'text') {
        setMessages([...newMessages, { role: 'model', content: data.text }]);
        addChatMessage(sid, 'model', data.text);
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
        addChatMessage(sid, 'model', proposalMsg.content, data.functionCall);
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
    addChatMessage(currentSessionId, 'function', funcResult, null, { name: msg.functionCall.name, result: funcResult });
    
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
    addChatMessage(currentSessionId, 'function', funcResponseMsg.content, null, { name: msg.functionCall.name, result: 'rejected' });
    
    handleSend('', historyWithFunc);
  };

  return (
    <>
      {/* Botón Flotante */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="assistant-chat-btn"
        style={{
          borderRadius: '0',
          background: 'var(--brutal-yellow)',
          border: '3px solid #000', color: '#000', fontSize: '24px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s, box-shadow 0.15s'
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '2px 2px 0 #000'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0 #000'; }}
      >
        ✨
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="assistant-chat-window" style={{
          background: 'var(--brutal-white)',
          border: '4px solid #000',
          borderRadius: '0', display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '1rem', background: 'var(--brutal-pink)', borderBottom: '4px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', color: '#000', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ✨ Luisda Bot
                  {botConfig?.model && (
                    <span style={{ fontSize: '0.6rem', background: '#000', color: '#fff', padding: '0.1rem 0.35rem', fontWeight: 'bold' }}>
                      {botConfig.model.split('/')[1] || botConfig.model}
                    </span>
                  )}
                </h3>
              </div>
              {dailyCostInfo && (
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: dailyCostInfo.total >= dailyCostInfo.limit ? 'darkred' : '#000' }}>
                  💰 Consumo Hoy: ${dailyCostInfo.total.toFixed(4)} / ${dailyCostInfo.limit}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                title="Nuevo Chat"
                onClick={() => {
                  setCurrentSessionId(null);
                  localStorage.removeItem('activeChatSession');
                  setMessages([]);
                }} 
                style={{ background: 'var(--brutal-yellow)', border: '2px solid #000', color: '#000', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 #000' }}
              >
                +
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'var(--brutal-white)', border: '2px solid #000', color: '#000', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 #000' }}>X</button>
            </div>
          </div>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#000', marginTop: '2rem', border: '2px solid #000', background: 'var(--brutal-yellow)', padding: '1rem', boxShadow: '4px 4px 0 #000' }}>
                <p style={{fontWeight: 900, textTransform: 'uppercase'}}>¡Hola! Soy Luisda Bot.</p>
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
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.images && msg.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {msg.images.map((img, imgIdx) => (
                          <img key={imgIdx} src={img} alt="Adjunto" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #000' }} />
                        ))}
                      </div>
                    )}
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
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              {attachedFiles.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem', background: '#fff', padding: '0.5rem', border: '2px solid #000' }}>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={file} alt="Preview" style={{ width: '40px', height: '40px', border: '1px solid #000', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: '#fff', border: '1px solid #000', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ background: 'var(--brutal-orange)', color: '#000', border: '3px solid #000', borderRadius: '0', padding: '0.75rem', cursor: 'pointer', fontWeight: 900, boxShadow: '2px 2px 0 #000', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '44px', width: '44px', flexShrink: 0 }}>
                  📎
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      if (!files.length) return;
                      setIsUploading(true);
                      try {
                        const base64s = await Promise.all(files.map(file => {
                          return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                          });
                        }));
                        setAttachedFiles(prev => [...prev, ...base64s]);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    style={{ display: 'none' }}
                    disabled={isLoading || isUploading}
                  />
                </label>
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder={isUploading ? "Cargando..." : "Escribe un comando..."}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0', border: '3px solid #000', background: '#fff', color: '#000', outline: 'none', fontWeight: 600, boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.1)' }}
                  disabled={isLoading || isUploading}
                />
                <button 
                  type="submit" 
                  disabled={isLoading || isUploading || (!input.trim() && attachedFiles.length === 0)}
                  style={{ background: 'var(--brutal-blue)', color: '#000', border: '3px solid #000', borderRadius: '0', padding: '0 1rem', cursor: 'pointer', fontWeight: 900, boxShadow: '2px 2px 0 #000', transition: 'all 0.15s', height: '44px' }}
                  onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '0 0 0 #000'; }}}
                  onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0 #000'; }}}
                >
                  ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
