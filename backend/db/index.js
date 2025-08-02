import pkg from 'pg';
const { Client } = pkg;


const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'golf_tee_times',
  password: 'jester',  // Replace with your actual password
  port: 5432,
});

client.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

export default client;
