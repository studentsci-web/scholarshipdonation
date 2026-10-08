/*
 * ตั้งค่าการเชื่อมต่อ (แก้ไฟล์นี้ไฟล์เดียว ใช้ร่วมกันทั้ง 3 หน้า)
 *
 * apiUrl: URL ของ Web App ที่ได้จากการ Deploy Apps Script
 *         รูปแบบ https://script.google.com/macros/s/xxxxxxxx/exec
 *         ถ้าเว้นว่าง ทุกหน้าจะทำงานในโหมดตัวอย่าง (ไม่ส่งข้อมูลจริง)
 */
window.SCHOLARSHIP_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbxAR-IZsDOIrDZhNtCvMVmzB5Tfk-obmijW_AYwtkyVr-fhwUZA-7uAHnY-kulaiytFaw/exec',

  // ชื่อไฟล์ของแต่ละหน้า (เปลี่ยนเฉพาะกรณีวางไฟล์คนละที่หรือเปลี่ยนชื่อไฟล์)
  pages: {
    donate: 'index.html',
    donors: 'donors.html',
    admin: 'admin.html'
  }
};
