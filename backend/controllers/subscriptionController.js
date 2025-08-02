import db from '../db/index.js'; // make sure path and extension are correct

const subscribe = async (req, res) => {
  const { userId, course, timeFrom, timeTo, players } = req.body;

  if (!userId || !course || !timeFrom || !timeTo || !players) {
    return res.status(400).json({ error: 'Missing fields in subscription' });
  }

  try {
    await db.query(
      `INSERT INTO subscriptions (user_id, course, time_from, time_to, players) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, course, timeFrom, timeTo, players]
    );

    console.log('✅ Subscription saved for user:', userId);
    res.status(200).json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error('❌ DB insert failed:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
};

export const getByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const { rows } = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Failed to fetch subscriptions:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};


export default {
  subscribe,
  getByUser
};
