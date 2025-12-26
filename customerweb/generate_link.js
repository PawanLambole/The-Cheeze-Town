import AES from 'crypto-js/aes.js';
const SECRET_KEY = "CHEEZETOWN_SECRET";
const tableId = "1";
const encrypted = AES.encrypt(tableId, SECRET_KEY).toString();
console.log(`Encrypted Link: http://localhost:5173/?q=${encodeURIComponent(encrypted)}`);
