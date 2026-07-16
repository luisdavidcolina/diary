export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const action = req.query.action;
  const qstashToken = process.env.QSTASH_TOKEN;
  const baseUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  const appUrl = `https://${req.headers.host}`;

  if (!qstashToken) {
    return res.status(200).json({ success: false, noQstash: true, error: "Falta QSTASH_TOKEN en el servidor." });
  }

  try {
    if (action === 'schedule-exact') {
      const { id, title, date, time } = req.body;
      const targetDate = new Date(`${date}T${time}:00-04:00`);
      const notBefore = Math.floor(targetDate.getTime() / 1000);
      const qstashUrl = `${baseUrl}/v2/publish/${appUrl}/api/send-exact-reminder`;
      
      const response = await fetch(qstashUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${qstashToken}`,
          'Content-Type': 'application/json',
          'Upstash-Not-Before': notBefore.toString()
        },
        body: JSON.stringify({ id, title })
      });
      const data = await response.json();
      if (response.ok) return res.status(200).json({ success: true, messageId: data.messageId });
      return res.status(500).json({ success: false, error: data });
    }
    
    if (action === 'schedule-recurring') {
      const { id, title, time } = req.body;
      const [hourStr, minuteStr] = time.split(':');
      let utcHour = (parseInt(hourStr, 10) + 4) % 24;
      const cronExpression = `${parseInt(minuteStr, 10)} ${utcHour} * * *`;
      const qstashUrl = `${baseUrl}/v2/schedules/${appUrl}/api/send-exact-reminder`;

      const response = await fetch(qstashUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${qstashToken}`,
          'Content-Type': 'application/json',
          'Upstash-Cron': cronExpression
        },
        body: JSON.stringify({ id, title })
      });
      const data = await response.json();
      if (response.ok) return res.status(200).json({ success: true, scheduleId: data.scheduleId });
      return res.status(500).json({ success: false, error: data });
    }

    if (action === 'cancel') {
      const { reminderId, isRecurring } = req.body;
      const endpoint = isRecurring 
        ? `${baseUrl}/v2/schedules/${reminderId}` 
        : `${baseUrl}/v2/messages/${reminderId}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${qstashToken}` }
      });
      if (response.ok) return res.status(200).json({ success: true });
      const data = await response.json();
      return res.status(500).json({ success: false, error: data });
    }

    return res.status(400).json({ success: false, error: "Invalid action" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
