DROP TABLE IF EXISTS pemesanan;
DROP TABLE IF EXISTS konser;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user'
);

CREATE TABLE konser (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  lokasi VARCHAR(150) NOT NULL,
  tanggal DATETIME NOT NULL,
  harga INT NOT NULL,
  kuota INT NOT NULL
);

CREATE TABLE pemesanan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  konser_id INT NOT NULL,
  jumlah INT NOT NULL,
  total_harga INT NOT NULL,
  status ENUM('pending','lunas','batal') DEFAULT 'pending',
  tanggal_pesan DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (konser_id) REFERENCES konser(id)
);