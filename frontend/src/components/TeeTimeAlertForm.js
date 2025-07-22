import React, { useState } from 'react';

const COURSE_OPTIONS = [
  'Willis Case Back Nine',
  'Kennedy (Babe Lind / West)',
  'Kennedy (Creek 9 only)',
  'Kennedy Par 3 or Footgolf',
  'City Park',
  'Wellshire',
  'Overland',
  'Harvard Gulch',
  'Evergreen',
  'Other'
];

function TeeTimeAlertForm() {
  const [form, setForm] = useState({
    course: '',
    timeFrom: '',
    timeTo: '',
    players: 1,
    email: ''
  });

  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('Saving preferences...');

    try {
      const response = await fetch('http://localhost:3001/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setStatusMessage('✅ Preferences saved! You’ll be emailed if a match is found.');
      } else {
        setStatusMessage('❌ Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatusMessage('❌ Failed to connect to the server.');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Set Tee Time Alert</h2>

      <label>
        Course:
        <select name="course" value={form.course} onChange={handleChange} required>
          <option value="">-- Select Course --</option>
          {COURSE_OPTIONS.map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
        </select>
      </label>

      <label>
        Time From:
        <input name="timeFrom" type="time" value={form.timeFrom} onChange={handleChange} required />
      </label>

      <label>
        Time To:
        <input name="timeTo" type="time" value={form.timeTo} onChange={handleChange} required />
      </label>

      <label>
        Number of Players:
        <input name="players" type="number" min="1" max="4" value={form.players} onChange={handleChange} required />
      </label>

      <label>
        Email:
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </label>

      <button type="submit">Subscribe</button>

      {statusMessage && (
        <p style={{ marginTop: '1rem', color: statusMessage.startsWith('✅') ? 'green' : 'red' }}>
          {statusMessage}
        </p>
      )}
    </form>
  );
}

export default TeeTimeAlertForm;