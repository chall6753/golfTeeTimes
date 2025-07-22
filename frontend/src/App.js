import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TeeTimeAlertForm from './components/TeeTimeAlertForm';
import './App.css';

function App() {
  const [teeTimes, setTeeTimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeeTimes = async () => {
      try {
        const response = await axios.get('http://localhost:3001/tee-times?days=3');
        setTeeTimes(response.data);
      } catch (error) {
        console.error('Error fetching tee times:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeeTimes();
  }, []);

  return (
    <div className="App">
      <h1>Denver Golf Tee Times</h1>

      {loading ? (
        <p>Loading tee times...</p>
      ) : (
        teeTimes.map((day, i) => (
          <div key={i} className="day">
            <h2>{day.date}</h2>
            {day.teeTimes.map((slot, j) => (
              <div key={j} className="slot">
                <strong>{slot.time}</strong>
                <ul>
                  {slot.bookings.map((b, k) => (
                    <li key={k}>
                      {b.course} — {b.price}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))
      )}

      <hr />

      {/* Add the alert signup form here */}
      <TeeTimeAlertForm />
    </div>
  );
}

export default App;
