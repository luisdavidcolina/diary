import { checkDailyLimit } from "./_costTracker.js";

export default async function handler(req, res) {
  try {
    const limitInfo = await checkDailyLimit();
    res.status(200).json(limitInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
