// Script to set up admin password
// Run with: node scripts/setup-admin-password.js

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function setupAdminPassword() {
  const password = 'admin123'; // You can change this password
  const hashedPassword = await hashPassword(password);
  
  console.log('Admin user setup:');
  console.log('Username: ahirosh');
  console.log('Email: ahirosh@deloitte.com');
  console.log('Password:', password);
  console.log('Hashed password:', hashedPassword);
  console.log('');
  console.log('To update the database, run this SQL:');
  console.log(`UPDATE users SET password_hash = '${hashedPassword}' WHERE email = 'ahirosh@deloitte.com';`);
}

setupAdminPassword().catch(console.error);
