import React, { useEffect, useState } from 'react';

function SubscriptionList({ userId }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubs() {
      try {
        const res = await fetch(`http://localhost:3001/subscriptions/${userId}`);
        const data = await res.json();
        setSubscriptions(data);
      } catch (err) {
        console.error('Failed to fetch subscriptions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubs();
  }, [userId]);

  return (
    <div>
      <h2>Your Subscriptions</h2>
      {loading ? (
        <p>Loading...</p>
      ) : subscriptions.length === 0 ? (
        <p>You have no subscriptions.</p>
      ) : (
        <ul>
          {subscriptions.map((sub, i) => (
            <li key={i}>
              {sub.course} from {sub.time_from} to {sub.time_to}, {sub.players} players
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SubscriptionList;
