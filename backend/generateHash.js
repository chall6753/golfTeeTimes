// generateHash.js
import bcrypt from 'bcrypt';

const run = async () => {
  const password = 'test123';
  const hash = await bcrypt.hash(password, 10);
  console.log(`Hash for "${password}":`, hash);
};

run();
