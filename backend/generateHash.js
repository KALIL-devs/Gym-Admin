const bcrypt = require('bcrypt');

async function createAdminHash() {
  const password = 'test'; // Replace with your desired password
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Password hash:', hash);
}

createAdminHash();