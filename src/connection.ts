import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '@Robloxindonesia17',            
  database: 'db_tiket',
  dateStrings: true  
});
export default pool;