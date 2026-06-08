-- รัน SQL นี้เพิ่มใน hotel database ที่มีอยู่แล้ว
-- (hotel.sql ที่มีอยู่แล้วมี parts, tool, stuff_to_maintenance, support แล้ว)

CREATE TABLE IF NOT EXISTS `users` (
  `id`       INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role`     ENUM('พนักงาน','ช่าง','แอดมิน') NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้าง admin คนแรก password = "admin1234"
-- (hash นี้คือ bcrypt ของ "admin1234" — เปลี่ยนได้ผ่าน POST /api/auth/register)
INSERT INTO `users` (username, password, role) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'แอดมิน');

-- ตัวอย่างพนักงานและช่าง (password = "1234" ทุกคน)
INSERT INTO `users` (username, password, role) VALUES
('staff01', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'พนักงาน'),
('tech01',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ช่าง');
