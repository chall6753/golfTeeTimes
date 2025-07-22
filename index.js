// Import required modules
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
// Add to top of index.js
const nodemailer = require('nodemailer');

// Set up reusable transporter (use real Gmail + app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chall70101@gmail.com',
    pass: 'xdmk jqva wtlu ovao'
  }
});

// Helper function to send email
async function sendTeeTimeAlertEmail(to, teeTime) {
  const mailOptions = {
    from: '"Tee Time Notifier" <chall70101@gmail.com>',
    to,
    subject: 'Tee Time Found!',
    text: `A tee time is available at ${teeTime.course} at ${teeTime.time} for $${teeTime.price}`
  };

  await transporter.sendMail(mailOptions);
}


// Create Express app
const app = express();
app.use(cors()); // Allow cross-origin requests for frontend access

const PORT = 3001;
const subscriptions = [];
// Define GET endpoint for scraping tee times
app.get('/tee-times', async (req, res) => {
    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
        headless: true, // set to false if you want to see browser window
        slowMo: 50,     // slow down actions for better observation
        defaultViewport: null,
        args: ['--start-maximized'],
        timeout: 100000  // browser launch timeout
    });

    const page = await browser.newPage(); // Open a new browser tab

    // URL for Willis Case Back Nine tee times
    const url = 'https://app.membersports.com/tee-times/3629/20573/1/1/0';

    // Navigate to the page and wait for it to load
    await page.goto(url, { 
        waitUntil: 'networkidle2', // waits for network to be idle
        timeout: 100000
    });

    const allDays = []; // Store tee time data for each day

    // Get the number of days to scrape from the query string (default 3)
    const days = parseInt(req.query.days || '3', 10);

    // Loop through the desired number of days
    for (let i = 0; i < days; i++) {
    console.log(`⏳ Scraping day ${i + 1}...`);

    let date = '';
    let teeTimes = [];

    try {
        // Wait for tee times to load (with timeout)
        await page.waitForSelector('.teeTime', { timeout: 30000 });

        // Get the date
        date = await page.evaluate(() => {
            return document.querySelector('.dateFormat')?.textContent.trim();
        });

        // Scrape tee time slots
        teeTimes = await page.evaluate(() => {
            const slots = [];

            document.querySelectorAll('.teeTime').forEach(teeTime => {
                const time = teeTime.querySelector('.timeCol')?.textContent.trim();

                const bookings = Array.from(teeTime.querySelectorAll('app-tee-time-card')).map(card => {
                    const course = card.querySelector('.name')?.textContent.trim();
                    const price = card.querySelector('.amount')?.textContent.trim();
                    return { course, price };
                });

                if (time && bookings.length > 0) {
                    slots.push({ time, bookings });
                }
            });

            return slots;
        });
for (const { course, timeFrom, timeTo, email } of subscriptions) {
  for (const day of allDays) {
    for (const slot of day.teeTimes) {
      const time = slot.time;
      if (time >= timeFrom && time <= timeTo) {
        const hasCourse = slot.bookings.some(b => b.course === course);
        if (hasCourse) {
          await sendTeeTimeAlertEmail(email, slot.bookings.find(b => b.course === course));
        }
      }
    }
  }
}

        console.log(`✅ Found ${teeTimes.length} tee times on ${date}`);
    } catch (err) {
        console.warn(`⚠️ No tee times or page failed to load on day ${i + 1}, skipping...`);
    }

    // Always push a result so frontend can show skipped days
    allDays.push({ date: date || `Day ${i + 1}`, teeTimes });

    // Click to next day if available
    const nextButton = await page.$('img[src*="chevron-right"]');
    if (nextButton) {
        await nextButton.click();
        await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
        break;
    }
}


    await browser.close(); // close the browser
    res.json(allDays);     // return scraped data as JSON
});

app.use(express.json()); // Needed to parse JSON POST bodies

app.post('/subscribe', (req, res) => {
    const { course, timeFrom, timeTo, players, email } = req.body;

    if (!course || !timeFrom || !timeTo || !players || !email) {
        return res.status(400).json({ error: 'Missing fields in subscription' });
    }

    subscriptions.push({ course, timeFrom, timeTo, players, email, createdAt: new Date() });
    console.log('New subscription:', subscriptions[subscriptions.length - 1]);

    res.status(200).json({ message: 'Subscribed successfully' });
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Tee Time Scraper running at http://localhost:${PORT}`);
});

// Background task to check tee times every 5 minutes
setInterval(async () => {
  if (subscriptions.length === 0) return;

  console.log('🔁 Checking tee times for subscriptions...');
  try {
    const response = await fetch('http://localhost:3001/tee-times?days=3');
    const allDays = await response.json();

    for (const { course, timeFrom, timeTo, email } of subscriptions) {
      for (const day of allDays) {
        for (const slot of day.teeTimes) {
          const time = slot.time;
          if (time >= timeFrom && time <= timeTo) {
            const hasCourse = slot.bookings.some(b => b.course === course);
            if (hasCourse) {
              await sendTeeTimeAlertEmail(email, slot.bookings.find(b => b.course === course));
              console.log(`📧 Email sent to ${email} for ${course} at ${slot.time}`);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to check tee times or send email:', err.message);
  }
}, 5 * 60 * 1000); // every 5 minutes
