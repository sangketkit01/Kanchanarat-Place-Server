# Kanchanarat Place Server

Kanchanarat Place Server เป็น backend ที่พัฒนาด้วย **Node.js** และ **Express.js** สำหรับจัดการข้อมูลของระบบ Kanchanarat Place

## 🚀 การติดตั้งและใช้งาน

### 1️⃣ **Clone Repository**
```sh
git clone https://github.com/sangketkit01/Kanchanarat-Place-Server.git
```

### 2️⃣ **เข้าไปที่โฟลเดอร์โปรเจ็กต์**
```sh
cd Kanchanarat-Place-Server
```

### 3️⃣ **ติดตั้ง Dependencies**
```sh
npm install express body-parser mysql cors multer --save
npm install dotenv
```

### 4️⃣ **เริ่มต้นเซิร์ฟเวอร์**
```sh
node server/server.js
```

## 🔧 เทคโนโลยีที่ใช้
- **Node.js** - Runtime สำหรับ JavaScript
- **Express.js** - Web Framework สำหรับ Node.js
- **MySQL** - ระบบฐานข้อมูลเชิงสัมพันธ์ (RDBMS)
- **Body-parser** - Middleware สำหรับแปลงข้อมูล request body
- **CORS** - Middleware สำหรับจัดการ Cross-Origin Resource Sharing
- **Multer** - Middleware สำหรับจัดการไฟล์อัปโหลด
- **Dotenv** - ใช้สำหรับจัดการ environment variables

## 📌 หมายเหตุ
- ต้องแน่ใจว่า **MySQL Server** ทำงานอยู่ก่อนที่จะรันเซิร์ฟเวอร์
- ตรวจสอบให้แน่ใจว่าไฟล์ **.env** ถูกตั้งค่าอย่างถูกต้อง


