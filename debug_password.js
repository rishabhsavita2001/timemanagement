require('dotenv').config();

console.log('PASSWORD DEBUGGING');
console.log('='.repeat(50));
console.log('Raw password from env:', JSON.stringify(process.env.DB_PASSWORD));
console.log('Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');
console.log('Password chars:');
if (process.env.DB_PASSWORD) {
  for (let i = 0; i < process.env.DB_PASSWORD.length; i++) {
    const char = process.env.DB_PASSWORD[i];
    console.log(`  [${i}]: '${char}' (${char.charCodeAt(0)})`);
  }
}

console.log('\nHardcoded password for comparison:');
const hardcodedPassword = 'Shivam@2025#';
console.log('Hardcoded:', JSON.stringify(hardcodedPassword));
console.log('Match:', process.env.DB_PASSWORD === hardcodedPassword);

if (process.env.DB_PASSWORD !== hardcodedPassword) {
  console.log('\nCharacter-by-character comparison:');
  const envPass = process.env.DB_PASSWORD || '';
  const maxLen = Math.max(envPass.length, hardcodedPassword.length);
  
  for (let i = 0; i < maxLen; i++) {
    const envChar = envPass[i] || 'MISSING';
    const hardChar = hardcodedPassword[i] || 'MISSING';
    const match = envChar === hardChar;
    console.log(`[${i}]: env='${envChar}' hard='${hardChar}' ${match ? '✅' : '❌'}`);
  }
}