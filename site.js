/*
 * site.js – ตัวช่วยที่ใช้ร่วมกันทุกหน้า: เรียกหลังบ้าน, ใส่ข้อความ/รูปจากเมนูตั้งค่า, ย่อรูปก่อนส่ง
 * ไม่ต้องแก้ไฟล์นี้ (การตั้งค่าอยู่ใน config.js)
 */
(function () {
  'use strict';
  var C = window.SCHOLARSHIP_CONFIG || {};
  var apiUrl = String(C.apiUrl || '').trim();
  var pages = Object.assign({ donate: 'index.html', donors: 'donors.html', admin: 'admin.html' }, C.pages || {});

  var MESSAGES = {
    NETWORK: 'ไม่สามารถเชื่อมต่อระบบได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง',
    SERVER_ERROR: 'ระบบขัดข้องชั่วคราว โปรดลองใหม่อีกครั้ง'
  };

  function apiError(code, message) {
    var e = new Error(message || MESSAGES[code] || MESSAGES.SERVER_ERROR);
    e.code = code || 'SERVER_ERROR';
    return e;
  }

  async function readJson(res) {
    if (!res.ok) throw apiError('NETWORK');
    var j;
    try { j = await res.json(); } catch (e) { throw apiError('SERVER_ERROR'); }
    if (!j || j.ok === false) throw apiError(j && j.error, j && j.message);
    return j;
  }

  async function get(action) {
    var url = apiUrl + (apiUrl.indexOf('?') >= 0 ? '&' : '?') + 'action=' + encodeURIComponent(action);
    var res;
    try { res = await fetch(url, { cache: 'no-store', redirect: 'follow' }); } catch (e) { throw apiError('NETWORK'); }
    return readJson(res);
  }

  /* ส่งเป็น text/plain เพื่อไม่ให้เบราว์เซอร์ส่ง preflight ไปที่ Apps Script */
  async function post(action, payload) {
    var res;
    try {
      res = await fetch(apiUrl, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action: action }, payload || {}))
      });
    } catch (e) { throw apiError('NETWORK'); }
    return readJson(res);
  }

  /* รับเฉพาะรูป https / พาธสัมพัทธ์ / data:image ที่ปลอดภัย */
  function safeImg(u) {
    if (typeof u !== 'string' || !u) return '';
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(u)) return u;
    if (/^https:\/\/[^\s"'()<>\\]+$/i.test(u)) return u;
    if (/^[\w.\/-]+$/.test(u) && !/^\w+:/.test(u)) return u;
    return '';
  }

  /*
   * ใส่ข้อความจากเมนูตั้งค่า: องค์ประกอบที่มี data-cfg="คีย์"
   * - มีค่า: แสดงข้อความนั้น และเอาไฮไลต์สีเหลือง (.ph) ออก
   * - ค่าว่าง + มี data-optional: ซ่อน
   * - ค่าว่าง (ไม่ optional): คงข้อความเดิมไว้
   * ลิงก์ที่มี data-cfg-href="คีย์" ใช้ค่าเป็น href (เฉพาะ https)
   */
  function applyTexts(texts) {
    texts = texts || {};
    document.querySelectorAll('[data-cfg]').forEach(function (el) {
      var k = el.getAttribute('data-cfg');
      if (!Object.prototype.hasOwnProperty.call(texts, k)) return;
      var v = String(texts[k] == null ? '' : texts[k]).trim();
      if (v) { el.textContent = v; el.classList.remove('ph'); el.hidden = false; }
      else if (el.hasAttribute('data-optional')) el.hidden = true;
    });
    document.querySelectorAll('[data-cfg-href]').forEach(function (a) {
      var v = String(texts[a.getAttribute('data-cfg-href')] || '').trim();
      if (/^https:\/\/[^\s<>"]+$/i.test(v)) { a.href = v; a.hidden = false; }
    });
    document.querySelectorAll('[data-cfg-hide]').forEach(function (el) {
      if (String(texts[el.getAttribute('data-cfg-hide')] || '').trim()) el.hidden = true;
    });
    document.querySelectorAll('[data-cfg-if]').forEach(function (el) {
      var keys = el.getAttribute('data-cfg-if').split(/\s+/);
      var any = keys.some(function (k) { return String(texts[k] || '').trim(); });
      var known = keys.some(function (k) { return Object.prototype.hasOwnProperty.call(texts, k); });
      if (known) el.hidden = !any;
    });
  }

  /* ใส่รูปจากเมนูตั้งค่า: โลโก้เล็กมุมซ้ายบน (.mark), โลโก้มหาวิทยาลัย (#logoSlot), ภาพพื้นหลัง */
  function applyImages(images) {
    images = images || {};
    var small = safeImg(images.smallLogo);
    if (small) {
      document.querySelectorAll('.mark').forEach(function (m) {
        var img = document.createElement('img'); img.src = small; img.alt = '';
        m.replaceChildren(img); m.classList.add('has-img');
      });
    }
    var uni = safeImg(images.uniLogo);
    var slot = document.getElementById('logoSlot');
    if (uni && slot) {
      var img = document.createElement('img');
      img.src = uni; img.alt = 'โลโก้มหาวิทยาลัยเทคโนโลยีราชมงคลรัตนโกสินทร์';
      slot.replaceChildren(img); slot.classList.add('has-logo');
      slot.removeAttribute('role'); slot.removeAttribute('aria-label');
    }
    var bg = safeImg(images.background);
    if (bg) {
      document.body.style.backgroundImage = 'linear-gradient(rgba(245,248,247,.86), rgba(245,248,247,.86)), url("' + bg + '")';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundPosition = 'center';
    }
  }

  function applyPublicConfig(cfg) {
    if (!cfg) return;
    applyTexts(cfg.texts);
    applyImages(cfg.images);
  }

  /* ---------- ย่อรูปก่อนส่ง ---------- */
  function fileToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1] || ''); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  function loadImage(file, timeoutMs) {
    return new Promise(function (resolve) {
      var url, img, done = false;
      try { url = URL.createObjectURL(file); img = new Image(); } catch (e) { resolve(null); return; }
      var finish = function (v) { if (done) return; done = true; URL.revokeObjectURL(url); resolve(v); };
      img.onload = function () { finish(img); };
      img.onerror = function () { finish(null); };
      setTimeout(function () { finish(null); }, timeoutMs || 8000);
      img.src = url;
    });
  }
  var OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * ย่อรูปให้ด้านยาวไม่เกิน maxDim และแปลงเป็นชนิดที่ระบบรับ
   * @return {Promise<{type:string, data:string, size:number}>}
   */
  async function compressImage(file, o) {
    o = Object.assign({ maxDim: 2000, quality: 0.85, mime: 'image/jpeg', keepBelow: 800 * 1024, maxBytes: 5 * 1024 * 1024 }, o || {});
    var original = async function () {
      if (OK_TYPES.indexOf(file.type) < 0 || file.size > o.maxBytes) throw apiError('IMAGE', 'ไม่สามารถอ่านไฟล์รูปนี้ได้ โปรดใช้ไฟล์ JPG หรือ PNG');
      return { type: file.type, data: await fileToBase64(file), size: file.size };
    };
    var img = await loadImage(file, Site.decodeTimeout);
    if (!img) return original();
    var w = img.naturalWidth || img.width; var h = img.naturalHeight || img.height;
    var scale = Math.min(1, o.maxDim / Math.max(w, h || 1));
    if (scale === 1 && OK_TYPES.indexOf(file.type) >= 0 && file.size <= o.keepBelow) return original();
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return original();
    if (o.mime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    var blob = await new Promise(function (r) { canvas.toBlob(r, o.mime, o.quality); });
    if (!blob || blob.size > o.maxBytes) return original();
    return { type: blob.type || o.mime, data: await fileToBase64(blob), size: blob.size };
  }

  var Site = {
    apiUrl: apiUrl,
    demo: !apiUrl,
    pages: pages,
    decodeTimeout: 8000,
    get: get,
    post: post,
    safeImg: safeImg,
    applyTexts: applyTexts,
    applyImages: applyImages,
    applyPublicConfig: applyPublicConfig,
    compressImage: compressImage,
    fileToBase64: fileToBase64,
    error: apiError
  };
  window.Site = Site;
})();
