# วิธีติดตั้ง

หลักๆคือต้องexport ไฟล์ hotel.qsql ที่ผมแทกมาใน โฟลเดอร์ githud ไป import ไว้ใน myphpadmin
หลักจากนั้น run APACHE & SQL ก่อนแล้วรันเซิฟด้วย cmd รัน คำสั่ง npm install   สองที
คือ root กับ hotel-backend
 pathที่พี่ลงไว้\hotel-maintenance-service\
 pathที่พี่ลงไว้\hotel-maintenance-service\hotel-backend

พอ npm install ทั้งสองทีเสร็จ ก็ ทำการรันlocalhost ด้วย คำสั่ง npm run dev 
จากนั้นเปิด http://localhost:5173/ เอาครับผม

ผมไม่แน่ใจเรื่องkey เท่าไหรแต่ในไฟล์ผมตั้งไว้แล้ว 
 ข้างล่างนี้ มีเขียนวิธีแจกkey อยู่นะครับ


# 🔧 Hotel Maintenance Service

ระบบจัดการงานซ่อมบำรุงโรงแรม พัฒนาด้วย React + Vite (frontend) และ Express.js + MySQL (backend)

---

## 📋 ความต้องการของระบบ

ก่อนติดตั้งให้เตรียมโปรแกรมเหล่านี้ให้พร้อม

| โปรแกรม | Version | ดาวน์โหลด |
|---|---|---|
| Node.js | 18 ขึ้นไป | https://nodejs.org |
| XAMPP | ล่าสุด | https://www.apachefriends.org |

---

## 🗂️ โครงสร้างโปรเจกต์

```
hotel-maintenance-service/
├── src/                        ← React frontend
│   ├── components/
│   │   ├── NotificationBell.jsx
│   │   └── ToastContainer.jsx
│   ├── hooks/
│   │   └── useNotifications.js
│   ├── App.jsx
│   ├── Login.jsx
│   ├── ServiceOrder.jsx
│   ├── AdminPanel.jsx
│   ├── InventoryList.jsx
│   └── RepairReport.jsx
├── public/
│   └── sw.js                   ← Service Worker (Push Notification)
└── hotel-backend/              ← Express backend
    ├── index.js
    ├── db.js
    ├── .env
    ├── middleware/
    │   └── auth.js
    └── routes/
        ├── auth.js
        ├── stuff.js
        ├── parts.js
        ├── tools.js
        ├── support.js
        └── notifications.js
```

---

## ⚙️ วิธีติดตั้ง

### ขั้นตอนที่ 1 — เปิด XAMPP

1. เปิดโปรแกรม XAMPP Control Panel
2. กด **Start** ที่ **Apache** และ **MySQL**
3. ตรวจสอบให้แน่ใจว่าทั้งสองขึ้นสถานะ **Running** (แถบสีเขียว)

---

### ขั้นตอนที่ 2 — สร้างฐานข้อมูล

1. เปิด browser แล้วไปที่ `http://localhost/phpmyadmin`
2. คลิก **New** ที่แถบซ้าย
3. ตั้งชื่อ database ว่า `hotel` แล้วกด **Create**
4. คลิกเข้าไปใน database `hotel` แล้วคลิกแท็บ **SQL**
5. นำไฟล์ `hotel.sql` ไปวางแล้วกด **Go**
6. จากนั้นรัน SQL เพิ่มเติมสำหรับระบบ notification

```sql
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `user_id`    INT(11)      NOT NULL,
  `type`       ENUM('new_repair','deadline_soon','deadline_passed') NOT NULL,
  `stuff_id`   VARCHAR(11)  NOT NULL,
  `title`      VARCHAR(255) NOT NULL,
  `body`       VARCHAR(500) NOT NULL,
  `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `id`         INT(11)  NOT NULL AUTO_INCREMENT,
  `user_id`    INT(11)  NOT NULL,
  `endpoint`   TEXT     NOT NULL,
  `p256dh`     TEXT     NOT NULL,
  `auth`       TEXT     NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
```

---

### ขั้นตอนที่ 3 — ติดตั้ง Backend

เปิด Command Prompt แล้วรันคำสั่งตามลำดับ

```bash
cd hotel-maintenance-service/hotel-backend
npm install
```

สร้าง VAPID keys สำหรับระบบ Push Notification

```bash
npx web-push generate-vapid-keys
```

จะได้ output แบบนี้ ให้ copy เก็บไว้

```
Public Key:
BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ

Private Key:
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

สร้างไฟล์ `.env` ใน folder `hotel-backend` แล้วใส่ข้อมูลดังนี้

```env
JWT_SECRET=hotel_secret_key_2024
VAPID_PUBLIC_KEY=<Public Key ที่ได้จากข้างบน>
VAPID_PRIVATE_KEY=<Private Key ที่ได้จากข้างบน>
VAPID_EMAIL=admin@hotel.local
```

รัน backend server

```bash
npm run dev
```

ถ้าขึ้นข้อความแบบนี้แสดงว่าสำเร็จ

```
Server running on port 3001
```

---

### ขั้นตอนที่ 4 — ติดตั้ง Frontend

เปิด Command Prompt ใหม่อีกหน้าต่าง (อย่าปิดหน้าต่าง backend)

```bash
cd hotel-maintenance-service
npm install
npm run dev
```

ถ้าขึ้นข้อความแบบนี้แสดงว่าสำเร็จ

```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### ขั้นตอนที่ 5 — เข้าใช้งาน

เปิด browser แล้วไปที่ `http://localhost:5173`

**บัญชีสำหรับทดสอบ**

| Username | Password | Role |
|---|---|---|
| admin | (ดูใน hotel.sql) | แอดมิน |
| staff01 | password | พนักงาน |
| tech01 | password | ช่าง |
| a | (ดูใน hotel.sql) | พนักงาน |
| T | (ดูใน hotel.sql) | ช่าง |

> password ที่แสดงว่า `password` คือตัวอักษร `password` จริงๆ ครับ

---

## 🚀 การเริ่มใช้งานครั้งถัดไป

ทุกครั้งที่จะเปิดใช้งานให้ทำตามลำดับนี้

1. เปิด **XAMPP** แล้ว Start **Apache** และ **MySQL**
2. เปิด terminal ที่ `hotel-backend` แล้วรัน `npm run dev`
3. เปิด terminal ที่ `hotel-maintenance-service` แล้วรัน `npm run dev`
4. เปิด browser ไปที่ `http://localhost:5173`

---

## 🛠️ Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 18, Vite |
| Backend | Express.js, Node.js |
| Database | MySQL (MariaDB via XAMPP) |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| File Upload | Multer |
| Notification | Web Push, node-cron, Service Worker |
