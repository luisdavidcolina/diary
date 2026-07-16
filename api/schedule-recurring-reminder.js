export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { id, title, time } = req.body;
  const qstashToken = process.env.QSTASH_TOKEN;
  const appUrl = `https://${req.headers.host}`; 

  if (!qstashToken) {
    return res.status(200).json({ success: false, noQstash: true, error: "Falta QSTASH_TOKEN en el servidor." });
  }

  // Convert time (e.g., "15:30") from UTC-4 to UTC
  const [hourStr, minuteStr] = time.split(':');
  let utcHour = (parseInt(hourStr, 10) + 4) % 24;
  
  const cronExpression = `${parseInt(minuteStr, 10)} ${utcHour} * * *`;

  const baseUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  // Note: For schedules, the URL is /v2/schedules/{destination}
  const qstashUrl = `${baseUrl}/v2/schedules/${appUrl}/api/send-exact-reminder`;

  try {
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
    if (response.ok) {
        return res.status(200).json({ success: true, scheduleId: data.scheduleId });
    } else {
        return res.status(500).json({ success: false, error: data });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
