// Import required modules
import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import db from './db/index.js';
import authRoutes from './routes/authRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';


// Create Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(authRoutes); // Mount auth routes
app.use(subscriptionRoutes);
const PORT = 3001;

// Email transporter (Gmail with app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chall70101@gmail.com',
    pass: 'xdmk jqva wtlu ovao' // TODO: move to environment variable
  }
});

// Send email helper
async function sendTeeTimeAlertEmail(to, messageText) {
  const mailOptions = {
    from: '"Tee Time Notifier" <chall70101@gmail.com>',
    to,
    subject: 'Tee Time Matches Found!',
    text: messageText
  };

  await transporter.sendMail(mailOptions);
}

// Endpoint: Scrape tee times
app.get('/tee-times', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 50,
    defaultViewport: null,
    args: ['--start-maximized'],
    timeout: 100000
  });

  const page = await browser.newPage();
  const url = 'https://app.membersports.com/tee-times/3629/20573/1/1/0';
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 100000 });

  const allDays = [];
  const days = parseInt(req.query.days || '3', 10);

  for (let i = 0; i < days; i++) {
    console.log(`⏳ Scraping day ${i + 1}...`);
    let date = '';
    let teeTimes = [];

    try {
      await page.waitForSelector('.teeTime', { timeout: 30000 });

      date = await page.evaluate(() => {
        return document.querySelector('.dateFormat')?.textContent.trim();
      });

      teeTimes = await page.evaluate(() => {
        const slots = [];

        document.querySelectorAll('.teeTime').forEach(teeTime => {
          const time = teeTime.querySelector('.timeCol')?.textContent.trim();

          const bookings = Array.from(teeTime.querySelectorAll('app-tee-time-card')).map(card => {
            const course = card.querySelector('.name')?.textContent.trim();
            const price = card.querySelector('.amount')?.textContent.trim();

            const openings = card.querySelector('.iconCell span')?.textContent.trim(); // ✅ this gets "1-4"

            return { course, price, openings };
          });

          if (time && bookings.length > 0) {
            slots.push({ time, bookings });
          }
        });

        return slots;
      });


      console.log(`✅ Found ${teeTimes.length} tee times on ${date}`);
    } catch (err) {
      console.warn(`⚠️ No tee times or page failed to load on day ${i + 1}, skipping...`);
    }

    allDays.push({ date: date || `Day ${i + 1}`, teeTimes });

    const nextButton = await page.$('img[src*="chevron-right"]');
    if (nextButton) {
      await nextButton.click();
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      break;
    }
  }

  await browser.close();
  res.json(allDays);
});


// Background task: Check tee times every 5 minutes
async function checkTeeTimes() {
  console.log('🔁 Checking tee times for active subscriptions...');

  try {
    const { rows: subscriptions } = await db.query(`
      SELECT s.*, u.email
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
    `);
    if (subscriptions.length === 0) return;

    const response = await fetch('http://localhost:3001/tee-times?days=3');
    const allDays = await response.json();

    const userMatches = {}; // { email: [matches...] }

    for (const sub of subscriptions) {
      const { course, time_from, time_to, email } = sub;

      for (const day of allDays) {
        for (const slot of day.teeTimes) {
          const time = slot.time;
          if (time >= time_from && time <= time_to) {
            const match = slot.bookings.find(b => {
              if (b.course !== course) return false;

              // Parse openings like "1-4"
              const openingsStr = b.openings || '';
              const maxOpenings = parseInt(openingsStr.split('-')[1]);

              return !isNaN(maxOpenings) && sub.players <= maxOpenings;
            });

            if (match) {
              const message = `${day.date} - ${match.course} at ${slot.time} for ${match.price} (Openings: ${match.openings})`;
              if (!userMatches[email]) userMatches[email] = [];
              userMatches[email].push(message);
            }

          }
        }
      }
    }

    // Send one email per user with all matches
    for (const [email, matches] of Object.entries(userMatches)) {
      if (matches.length > 0) {
        const text = `The following tee times matched your preferences:\n\n${matches.join('\n')}`;
        await sendTeeTimeAlertEmail(email, text);
        console.log(`📧 Sent email to ${email} with ${matches.length} matches`);
      }
    }

  } catch (err) {
    console.error('❌ Tee time check failed:', err.message);
  }
};

// ⏱️ Run immediately, then every 5 minutes
checkTeeTimes();
setInterval(checkTeeTimes, 5 * 60 * 1000);


// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Tee Time Scraper running at http://localhost:${PORT}`);
});
