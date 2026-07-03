/* ================================================================
   SISTEM PENYIMPANAN GANDA — localStorage + Cookie fallback
   ================================================================ */
var SAVE_KEY = 'mathku_v20_newlv'; // Versi multi-user
function setCookie(name, val, days) {
  var d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = name + '=' + encodeURIComponent(val) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}
function getCookie(name) {
  var pairs = document.cookie.split(';');
  for (var i = 0; i < pairs.length; i++) {
    var c = pairs[i].trim();
    if (c.indexOf(name + '=') === 0) {
      return decodeURIComponent(c.substring(name.length + 1));
    }
  }
  return null;
}
function deleteCookie(name) {
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax';
}

// Multi-user: daftar user (maks 3), currentUserId, accessGranted global
var MAX_USERS = 5;
var users = [];        // array of {id, name, progress}
var currentUserId = null;
var accessGranted = false;
var progress = null;   // pointer ke progress user aktif

function saveProg(p) {
  // p bisa diabaikan - sekarang simpan struktur multi-user
  saveAllUsers();
}

function saveAllUsers() {
  var data = {
    users: users,
    currentUserId: currentUserId,
    accessGranted: accessGranted
  };
  var json = JSON.stringify(data);
  try { localStorage.setItem(SAVE_KEY, json); } catch(e) {}
  try { setCookie(SAVE_KEY, json, 365); } catch(e) {}
}

function loadAllUsers() {
  var json = null;
  try { json = localStorage.getItem(SAVE_KEY); } catch(e) {}
  if (!json) { json = getCookie(SAVE_KEY); }
  if (json) {
    try {
      var data = JSON.parse(json);
      // Migrasi dari format lama (progress tunggal) ke multi-user
      if (data.users && Array.isArray(data.users)) {
        users = data.users;
        currentUserId = data.currentUserId || (users.length > 0 ? users[0].id : null);
        accessGranted = !!data.accessGranted;
        // Validasi setiap user progress
        for (var k = 0; k < users.length; k++) {
          users[k].progress = normalizeProgress(users[k].progress);
        }
        return true;
      }
      // Format lama: data adalah progress tunggal
      if (data.userName !== undefined) {
        accessGranted = !!data.accessGranted;
        var migrated = normalizeProgress(data);
        var uid = 'u' + Date.now();
        users = [{id: uid, name: data.userName || 'User', progress: migrated}];
        currentUserId = uid;
        saveAllUsers();
        return true;
      }
    } catch(e) { }
  }
  users = [];
  currentUserId = null;
  accessGranted = false;
  return false;
}

function normalizeProgress(p) {
  if (!p || typeof p !== 'object') p = {};
  for (var i = 0; i < CATS.length; i++) {
    var c = CATS[i];
    if (!p[c.id] || typeof p[c.id] !== 'object') p[c.id] = { unlocked: 1, stars: {} };
    if (typeof p[c.id].unlocked !== 'number' || p[c.id].unlocked < 1) p[c.id].unlocked = 1;
    if (!p[c.id].stars || typeof p[c.id].stars !== 'object') p[c.id].stars = {};
    for (var j = 1; j <= c.maxLv; j++) {
      if (typeof p[c.id].stars[j] !== 'number' || p[c.id].stars[j] < 0) p[c.id].stars[j] = 0;
      if (p[c.id].stars[j] > 3) p[c.id].stars[j] = 3;
    }
  }
  if (p['ujian'] && p['ujian'].unlocked < 8) p['ujian'].unlocked = 8;
  // Init stars[0] untuk mencacah (intro marker)
  if (p['mencacah']) {
    if (typeof p['mencacah'].stars[0] !== 'number' || p['mencacah'].stars[0] < 0) p['mencacah'].stars[0] = 0;
    if (p['mencacah'].stars[0] > 1) p['mencacah'].stars[0] = 1;
  }
  return p;
}

function defProg(){
  var p={};
  for(var i=0;i<CATS.length;i++){var c=CATS[i];p[c.id]={unlocked:1,stars:{}};for(var j=1;j<=c.maxLv;j++)p[c.id].stars[j]=0;}
  p['ujian'].unlocked=8;
  return p;
}

function getCurrentUser() {
  if (!currentUserId) return null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === currentUserId) return users[i];
  }
  return null;
}

function switchUser(uid) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === uid) {
      currentUserId = uid;
      progress = users[i].progress;
      saveAllUsers();
      return true;
    }
  }
  return false;
}

function addUser(name) {
  if (users.length >= MAX_USERS) return {ok: false, reason: 'max'};
  var uid = 'u' + Date.now() + Math.floor(Math.random()*1000);
  users.push({id: uid, name: name, progress: defProg()});
  currentUserId = uid;
  progress = users[users.length-1].progress;
  saveAllUsers();
  return {ok: true, uid: uid};
}

function deleteUser(uid) {
  var idx = -1;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === uid) { idx = i; break; }
  }
  if (idx === -1) return false;
  users.splice(idx, 1);
  if (currentUserId === uid) {
    currentUserId = users.length > 0 ? users[0].id : null;
    progress = users.length > 0 ? users[0].progress : null;
  }
  saveAllUsers();
  return true;
}

window.addEventListener('beforeunload', function() { saveAllUsers(); });
window.addEventListener('pagehide', function() { saveAllUsers(); });
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        saveAllUsers();
    }
});

var saveToastTimer = null;
function showSaveToast() {
  var el = document.getElementById('save-toast');
  if (!el) return;
  el.classList.add('show');
  if (saveToastTimer) clearTimeout(saveToastTimer);
  saveToastTimer = setTimeout(function() { el.classList.remove('show'); }, 2000);
}

/* ================================================================
   KONFIGURASI KATEGORI
   ================================================================ */
var CATS=[
  {id:'mencacah',name:'Mencacah',icon:'\uD83D\uDC46',isEmoji:true,color:'#8D6E63',maxLv:2},
  {id:'penjumlahan',name:'Penjumlahan',icon:'+',isEmoji:false,color:'#26A69A',maxLv:11},
  {id:'pengurangan',name:'Pengurangan',icon:'\u2212',isEmoji:false,color:'#FF7043',maxLv:11},
  {id:'jumlah_kurang',name:'Jumlah & Kurang',icon:'\u00B1',isEmoji:false,color:'#AB47BC',maxLv:7},
  {id:'perkalian',name:'Perkalian',icon:'\u00D7',isEmoji:false,color:'#66BB6A',maxLv:11},
  {id:'pembagian',name:'Pembagian',icon:'\u00F7',isEmoji:false,color:'#42A5F5',maxLv:10},
  {id:'kali_bagi',name:'Kali & Bagi',icon:'\u00D7\u00F7',isEmoji:false,color:'#FFA726',maxLv:8},
  {id:'advance',name:'Advance',icon:'\u2217',isEmoji:false,color:'#EC407A',maxLv:8},
  {id:'ujian',name:'Ujian',icon:'\uD83C\uDFC6',isEmoji:true,color:'#5C6BC0',maxLv:7}
];

// Level definitions: type='regular' or 'story' with range
// For regular levels, map new level number -> old level number (for genQ)
var LEVEL_DEFS = {
  penjumlahan: [
    {type:'regular',old:1}, {type:'story',range:{aMin:1,aMax:10,bMin:1,bMax:10}},
    {type:'regular',old:2}, {type:'story',range:{aMin:1,aMax:20,bMin:1,bMax:20}},
    {type:'regular',old:3}, {type:'regular',old:4}, {type:'regular',old:5},
    {type:'regular',old:6}, {type:'regular',old:7}, {type:'regular',old:8}, {type:'regular',old:9}
  ],
  pengurangan: [
    {type:'regular',old:1}, {type:'story',range:{aMin:2,aMax:10,bMin:1,bMax:9}},
    {type:'regular',old:2}, {type:'story',range:{aMin:2,aMax:20,bMin:1,bMax:19}},
    {type:'regular',old:3}, {type:'regular',old:4}, {type:'regular',old:5},
    {type:'regular',old:6}, {type:'regular',old:7}, {type:'regular',old:8}, {type:'regular',old:9}
  ],
  jumlah_kurang: [
    {type:'regular',old:1}, {type:'regular',old:2},
    {type:'mixed',ranges:[
      {cat:'penjumlahan',range:{aMin:1,aMax:20,bMin:1,bMax:20},count:5},
      {cat:'pengurangan',range:{aMin:2,aMax:20,bMin:1,bMax:19},count:5}
    ]},
    {type:'story',range:{aMin:1,aMax:10,bMin:1,bMax:10,cMin:1,cMax:10}},
    {type:'regular',old:3},
    {type:'story',range:{aMin:5,aMax:25,bMin:5,bMax:25,cMin:5,cMax:25}},
    {type:'twop',op:'addsub',range:{aMin:1,aMax:1000,bMin:1,bMax:1000,cMin:1,cMax:1000},distinct:true,resultGt0:true}
  ],
  perkalian: [
    {type:'regular',old:1}, {type:'story',range:{aMin:1,aMax:10,bMin:1,bMax:10}},
    {type:'regular',old:2}, {type:'story',range:{aMin:1,aMax:20,bMin:1,bMax:20}},
    {type:'regular',old:3}, {type:'regular',old:4}, {type:'regular',old:5},
    {type:'regular',old:6}, {type:'regular',old:7}, {type:'regular',old:8}, {type:'regular',old:9}
  ],
  pembagian: [
    {type:'regular',old:1}, {type:'story',range:{aMin:4,aMax:25,bMin:2,bMax:25}},
    {type:'regular',old:2}, {type:'story',range:{aMin:4,aMax:100,bMin:2,bMax:100,noMult10:true}},
    {type:'regular',old:3}, {type:'regular',old:4}, {type:'regular',old:5},
    {type:'regular',old:6}, {type:'regular',old:7}, {type:'regular',old:8}
  ],
  kali_bagi: [
    {type:'regular',old:1}, {type:'regular',old:2},
    {type:'mixed',ranges:[
      {cat:'perkalian',range:{aMin:1,aMax:10,bMin:1,bMax:10},count:5},
      {cat:'pembagian',range:{aMin:4,aMax:25,bMin:2,bMax:25},count:5}
    ]},
    {type:'story',range:{aMin:2,aMax:25,bMin:2,bMax:25,cMin:2,cMax:25}},
    {type:'regular',old:3}, {type:'regular',old:4},
    {type:'story',range:{aMin:2,aMax:50,bMin:2,bMax:50,cMin:2,cMax:50}},
    {type:'twop',op:'muldiv',range:{aMin:1,aMax:1000,bMin:1,bMax:1000,cMin:2,cMax:1000},distinct:true,resultGt1:true}
  ],
  advance: [
    {type:'mixed',ranges:[
      {cat:'penjumlahan',range:{aMin:1,aMax:20,bMin:1,bMax:20},count:5},
      {cat:'pengurangan',range:{aMin:2,aMax:20,bMin:1,bMax:19},count:5}
    ]},
    {type:'regular',old:1},
    {type:'mixed',ranges:[
      {cat:'perkalian',range:{aMin:1,aMax:10,bMin:1,bMax:10},count:5},
      {cat:'pembagian',range:{aMin:4,aMax:25,bMin:2,bMax:25},count:5}
    ]},
    {type:'regular',old:2},
    {type:'story',cat:'jumlah_kurang',range:{aMin:1,aMax:99,bMin:1,bMax:99,cMin:1,cMax:99},distinct:true,resultGt0:true},
    {type:'story',cat:'kali_bagi',range:{aMin:1,aMax:99,bMin:1,bMax:99,cMin:2,cMax:99},distinct:true,resultGt1:true,noMult10:true},
    {type:'regular',old:3}, {type:'regular',old:4}
  ]
};

function getLevelDef(catId, lv) {
  var defs = LEVEL_DEFS[catId];
  if (!defs) return {type:'regular', old: lv};
  if (lv < 1 || lv > defs.length) return {type:'regular', old: lv};
  return defs[lv-1];
}

function isStoryLevel(catId, lv) {
  var def = getLevelDef(catId, lv);
  return def.type === 'story' || def.type === 'mixed';
}

var UJ_SEC=[
  {id:'penjumlahan',name:'Penjumlahan',color:'#26A69A',maxLv:11,time:10},
  {id:'pengurangan',name:'Pengurangan',color:'#FF7043',maxLv:11,time:10},
  {id:'jumlah_kurang',name:'Jumlah & Kurang',color:'#AB47BC',maxLv:7,time:15},
  {id:'perkalian',name:'Perkalian',color:'#66BB6A',maxLv:11,time:15},
  {id:'pembagian',name:'Pembagian',color:'#42A5F5',maxLv:10,time:15},
  {id:'kali_bagi',name:'Kali & Bagi',color:'#FFA726',maxLv:8,time:20},
  {id:'advance',name:'Advance',color:'#EC407A',maxLv:8,time:20}
];

var DEV_CODE = "211221"; 

/* ================================================================
   SISTEM INTERNASIONALISASI (i18n) — Bahasa Indonesia & English
   ================================================================ */
var LANG_KEY = 'mathku_lang';
var currentLang = 'id';
try {
  var savedLang = localStorage.getItem(LANG_KEY);
  if (savedLang === null) { savedLang = getCookie(LANG_KEY); }
  if (savedLang === 'en' || savedLang === 'id') currentLang = savedLang;
  // Deteksi bahasa browser jika belum ada preferensi tersimpan
  if (!savedLang) {
    var bl = (navigator.language || 'id').toLowerCase();
    currentLang = bl.indexOf('en') === 0 ? 'en' : 'id';
  }
} catch(e) {}

var I18N = {
  id: {
    // Akses
    access_welcome: 'Selamat datang! Silakan masukkan Nama kamu untuk mulai belajar berhitung.',
    access_request_link: 'Minta akses',
    access_name_ph: 'Nama Kamu',
    access_code_ph: 'Kode Akses',
    access_btn: 'Mulai Belajar',
    access_err_name: 'Nama tidak boleh kosong.',
    access_err_code: 'Kode akses salah!',
    access_granted_title: 'Selamat Datang!',
    access_granted_desc: 'Halo <strong>{name}</strong>, selamat belajar. Mari biasakan berdoa sebelum memulai pelajaran.',
    access_continue: 'Lanjut',
    // Gate (Level 2+)
    gate_title: 'Kode Akses Diperlukan',
    gate_desc: 'Kamu sudah menyelesaikan Level 1. Masukkan kode akses untuk membuka Level 2 dan seterusnya. Kode berlaku untuk semua kategori.',
    gate_btn: 'Buka Level',
    gate_cancel: 'Kembali',
    gate_success: 'Akses diberikan! Semua level kini terbuka.',
    gate_err_code: 'Kode akses salah! Coba lagi atau minta akses.',
    gate_adduser_title: 'Kode Akses untuk Tambah User',
    gate_adduser_desc: 'Untuk menambah user baru, masukkan kode akses terlebih dahulu. Kode berlaku untuk semua user.',
    gate_adduser_btn: 'Lanjut Tambah User',
    // User Manager
    user_manager_title: 'Pilih User',
    user_active: 'Aktif',
    user_add: 'Tambah User',
    user_add_title: 'User Baru',
    user_add_confirm: 'Tambah',
    user_delete: 'Hapus User',
    user_delete_confirm: 'Yakin hapus user \"{name}\"? Semua progresnya akan hilang.',
    user_max_reached: 'Maksimal 5 user. Hapus salah satu untuk menambah baru.',
    user_close: 'Tutup',
    about_link: 'Tentang MathKu',
    // Intro quiz (pengenalan angka)
    intro_label: 'Pengenalan',
    intro_count_word: 'ini ada {word}',
    intro_repeat: 'Ulangi',
    intro_next: 'Lanjut',
    intro_finish: 'Mulai Berhitung',
    intro_emoji_label: 'Berapa jumlahnya?',
    // Number words 1-10
    num_1: 'satu', num_2: 'dua', num_3: 'tiga', num_4: 'empat', num_5: 'lima',
    num_6: 'enam', num_7: 'tujuh', num_8: 'delapan', num_9: 'sembilan', num_10: 'sepuluh',
    // Home
    home_subtitle: 'Halo {name}, Belajar Berhitung Jadi Menyenangkan',
    home_install_btn: 'Pasang Aplikasi',
    home_save_indicator: '\u2713 Progres tersimpan otomatis',
    home_ujian_count: '7 kategori ujian',
    home_all_done: 'Semua level selesai',
    home_reset_btn: 'Reset Semua Progress',
    home_reset_confirm: 'Yakin hapus semua progress?',
    home_reset_yes: 'Hapus',
    home_reset_no: 'Batal',
    home_footer: '© 2026 MathKu 1.2.1 (Beta) · PWA · Multi-User | Hak Cipta Dilindungi.<br>Dibuat dengan ❤️ untuk pendidikan anak Indonesia.',
    // Level page
    level_desc: 'Skor >70% untuk bintang. 3 bintang untuk naik level.',
    ujian_level_desc: 'Kuis dari semua level setiap kategori \u2022 10 soal \u2022 Waktu berbeda per kategori',
    // Quiz
    quiz_prepare: 'Persiapan Ujian',
    quiz_exam_title: 'Ujian: {name}',
    quiz_exam_time: '<strong>\u23F1 Waktu Ujian:</strong> Kamu punya waktu <strong>{time} menit</strong> untuk mengerjakan 10 soal. Kerjakan dengan cepat tapi teliti!',
    quiz_exam_pray: '<strong>"Ya Allah, berkahilah ilmu yang kau berikan padaku."',
    quiz_exam_start: 'Ujian dimulai dalam:',
    quiz_countdown_go: 'Mulai!',
    quiz_question: 'Soal {n} / {total}',
    quiz_count_emoji: 'Berapa jumlahnya?',
    quiz_input_placeholder: '?',
    quiz_submit: 'Jawab',
    quiz_correct: 'Benar, {name}!',
    quiz_wrong: 'Salah, {name}',
    quiz_answer: 'Jawaban: {ans}',
    // Result
    result_score_label: 'Skor',
    result_correct_count: '{cor} dari {total} benar',
    result_level: 'Level {lv}',
    result_time: 'Waktu: {time}',
    result_stars_hint: 'Kumpulkan 3 bintang (skor >70%) sebanyak {n}x lagi',
    result_level_unlocked: 'Level {lv} sudah terbuka!',
    result_cat_done: 'Semua level {name} selesai!',
    result_msg_3stars: 'Kamu sudah 3 bintang!',
    result_msg_stars_left: ' {n} bintang lagi.',
    result_msg_exam_done: ' Ujian {name} selesai!',
    result_msg_need_score: ' Butuh skor >70% untuk bintang.',
    result_retry: 'Latihan Lagi',
    result_back: 'Kembali',
    // Celebration
    celeb_level_up: 'Kamu naik ke <strong>Level {lv}</strong> di kategori {name}!',
    celeb_cat_done: 'Semua level <strong>{name}</strong> selesai!',
    celeb_continue: 'Lanjut',
    // Toast
    toast_saved: 'Progres tersimpan',
    toast_installed: 'MathKu terpasang! Cari di layar utama.',
    toast_install_success: 'MathKu berhasil dipasang!',
    // Modal install
    install_title: 'Pasang MathKu di Perangkat Anda',
    install_intro: 'Pasang MathKu sebagai aplikasi agar bisa dibuka dengan satu tap, tampil layar penuh, dan tersimpan di layar utama seperti aplikasi biasa.',
    install_close: 'Tutup',
    install_tab_android: 'Android',
    install_tab_ios: 'iPhone/iPad',
    install_tab_desktop: 'Komputer',
    // Android steps
    and_step1: 'Buka aplikasi MathKu di browser <strong>Chrome</strong> di HP Android Anda.',
    and_step2: 'Tap ikon menu <span class="step-hint">&vellip;</span> (tiga titik) di sudut kanan atas browser.',
    and_step3: 'Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Pasang aplikasi"</strong>.',
    and_step4: 'Tekan tombol <strong>"Pasang"</strong> pada kotak konfirmasi yang muncul.',
    and_step5: 'Selesai! Ikon MathKu kini muncul di layar utama HP Anda.',
    and_note: 'Progres belajar tetap tersimpan otomatis meskipun aplikasi ditutup.',
    // iOS steps
    ios_step1: 'Buka aplikasi MathKu di browser <strong>Safari</strong> di iPhone atau iPad Anda.',
    ios_step2: 'Tap tombol <strong>Share</strong> <span class="step-hint">&#8599;</span> (kotak dengan panah ke atas) di bilah bawah Safari.',
    ios_step3: 'Gulir daftar ke bawah lalu pilih <strong>"Tambah ke Layar Utama"</strong>.',
    ios_step4: 'Tekan <strong>"Tambahkan"</strong> di pojok kanan atas layar.',
    ios_step5: 'Selesai! Ikon MathKu kini muncul di layar utama iPhone/iPad Anda.',
    ios_note: 'Wajib gunakan Safari. Browser lain di iOS tidak mendukung PWA.',
    // Desktop steps
    dsk_step1: 'Buka aplikasi MathKu di browser <strong>Chrome</strong> atau <strong>Edge</strong> di komputer Anda.',
    dsk_step2: 'Cari ikon install <span class="step-hint">&#8853;</span> di sisi kanan address bar, lalu klik.',
    dsk_step3: 'Jika tidak ada, klik menu <span class="step-hint">&vellip;</span> (tiga titik) &raquo; <strong>"Pasang MathKu"</strong> atau <strong>"Install MathKu"</strong>.',
    dsk_step4: 'Klik tombol <strong>"Pasang"</strong> pada dialog konfirmasi.',
    dsk_step5: 'Selesai! MathKu terbuka di jendela terpisah dan ikonnya tersedia di desktop/taskbar.',
    dsk_note: 'Aplikasi terbuka layar penuh tanpa address bar, seperti aplikasi desktop biasa.',
    // Category names
    cat_mencacah: 'Berhitung',
    cat_penjumlahan: 'Penjumlahan',
    cat_pengurangan: 'Pengurangan',
    cat_jumlah_kurang: 'Jumlah & Kurang',
    cat_perkalian: 'Perkalian',
    cat_pembagian: 'Pembagian',
    cat_kali_bagi: 'Kali & Bagi',
    cat_advance: 'Advance',
    cat_ujian: 'Ujian',
    // Motivasi
    msg_lu: ['Luar biasa, {nama}!','Hebat sekali, {nama}!','Kamu menakjubkan, {nama}!','Fantastis, {nama}!','Keren banget, {nama}!'],
    msg_cd: ['Juara Matematika, {nama}!','Master sejati, {nama}!','Luar biasa hebat, {nama}!','Luar biasa pintar, {nama}!'],
    msg_g: ['Bagus sekali, {nama}!','Kerja kerasmu membuahkan hasil, {nama}!','Terus semangat, {nama}!','Hampir sampai, {nama}!'],
    msg_ta: ['Jangan menyerah, {nama}!','Kamu pasti bisa, {nama}!','Terus berlatih ya, {nama}!','Semangat terus, {nama}!']
  },
  en: {
    // Access
    access_welcome: 'Welcome! Please enter your Name to start learning math.',
    access_request_link: 'Request access',
    access_name_ph: 'Your Name',
    access_code_ph: 'Access Code',
    access_btn: 'Start Learning',
    access_err_name: 'Name cannot be empty.',
    access_err_code: 'Wrong access code!',
    access_granted_title: 'Welcome!',
    access_granted_desc: 'Hello <strong>{name}</strong>, happy learning. Let\'s make a habit of praying before starting the lesson.',
    access_continue: 'Continue',
    // Gate (Level 2+)
    gate_title: 'Access Code Required',
    gate_desc: 'You\'ve completed Level 1. Enter the access code to unlock Level 2 and beyond. Code applies to all categories.',
    gate_btn: 'Unlock Level',
    gate_cancel: 'Back',
    gate_success: 'Access granted! All levels are now unlocked.',
    gate_err_code: 'Wrong access code! Try again or request access.',
    gate_adduser_title: 'Access Code to Add User',
    gate_adduser_desc: 'To add a new user, enter the access code first. Code applies to all users.',
    gate_adduser_btn: 'Continue to Add User',
    // User Manager
    user_manager_title: 'Select User',
    user_active: 'Active',
    user_add: 'Add User',
    user_add_title: 'New User',
    user_add_confirm: 'Add',
    user_delete: 'Delete User',
    user_delete_confirm: 'Sure to delete user \"{name}\"? All their progress will be lost.',
    user_max_reached: 'Maximum 5 users. Delete one to add new.',
    user_close: 'Close',
    about_link: 'About MathKu',
    // Intro quiz (number introduction)
    intro_label: 'Introduction',
    intro_count_word: 'this is {word}',
    intro_repeat: 'Repeat',
    intro_next: 'Next',
    intro_finish: 'Start Counting',
    intro_emoji_label: 'How many are there?',
    // Number words 1-10
    num_1: 'one', num_2: 'two', num_3: 'three', num_4: 'four', num_5: 'five',
    num_6: 'six', num_7: 'seven', num_8: 'eight', num_9: 'nine', num_10: 'ten',
    // Home
    home_subtitle: 'Hi {name}, Learning Math Becomes Fun',
    home_install_btn: 'Install App',
    home_save_indicator: '\u2713 Progress auto-saved',
    home_ujian_count: '7 exam categories',
    home_all_done: 'All levels completed',
    home_reset_btn: 'Reset All Progress',
    home_reset_confirm: 'Sure to delete all progress?',
    home_reset_yes: 'Delete',
    home_reset_no: 'Cancel',
    home_footer: '© 2026 MathKu 1.2.1 (Beta) · PWA · Multi-User | All Rights Reserved.<br>Made with ❤️ for Indonesian children\u2019s education.',
    // Level page
    level_desc: 'Score >70% for a star. 3 stars to unlock next level.',
    ujian_level_desc: 'Quiz from all levels of each category \u2022 10 questions \u2022 Different time per category',
    // Quiz
    quiz_prepare: 'Exam Preparation',
    quiz_exam_title: 'Exam: {name}',
    quiz_exam_time: '<strong>\u23F1 Exam Time:</strong> You have <strong>{time} minutes</strong> to complete 10 questions. Work quickly but carefully!',
    quiz_exam_pray: '<strong>"O Allah, bless the knowledge You have given me."',
    quiz_exam_start: 'Exam starts in:',
    quiz_countdown_go: 'Go!',
    quiz_question: 'Question {n} / {total}',
    quiz_count_emoji: 'How many are there?',
    quiz_input_placeholder: '?',
    quiz_submit: 'Answer',
    quiz_correct: 'Correct, {name}!',
    quiz_wrong: 'Wrong, {name}',
    quiz_answer: 'Answer: {ans}',
    // Result
    result_score_label: 'Score',
    result_correct_count: '{cor} of {total} correct',
    result_level: 'Level {lv}',
    result_time: 'Time: {time}',
    result_stars_hint: 'Collect 3 stars (score >70%) {n} more time(s)',
    result_level_unlocked: 'Level {lv} is unlocked!',
    result_cat_done: 'All {name} levels completed!',
    result_msg_3stars: 'You got 3 stars!',
    result_msg_stars_left: ' {n} more star(s) to go.',
    result_msg_exam_done: ' Exam {name} completed!',
    result_msg_need_score: ' Need score >70% for a star.',
    result_retry: 'Practice Again',
    result_back: 'Back',
    // Celebration
    celeb_level_up: 'You advanced to <strong>Level {lv}</strong> in {name}!',
    celeb_cat_done: 'All <strong>{name}</strong> levels completed!',
    celeb_continue: 'Continue',
    // Toast
    toast_saved: 'Progress saved',
    toast_installed: 'MathKu installed! Find it on your home screen.',
    toast_install_success: 'MathKu successfully installed!',
    // Modal install
    install_title: 'Install MathKu on Your Device',
    install_intro: 'Install MathKu as an app so you can open it with one tap, view it full screen, and have it saved on your home screen like a regular app.',
    install_close: 'Close',
    install_tab_android: 'Android',
    install_tab_ios: 'iPhone/iPad',
    install_tab_desktop: 'Computer',
    // Android steps
    and_step1: 'Open the MathKu app in the <strong>Chrome</strong> browser on your Android phone.',
    and_step2: 'Tap the menu icon <span class="step-hint">&vellip;</span> (three dots) in the top right corner of the browser.',
    and_step3: 'Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.',
    and_step4: 'Press the <strong>"Install"</strong> button in the confirmation box that appears.',
    and_step5: 'Done! The MathKu icon now appears on your phone\u2019s home screen.',
    and_note: 'Learning progress is still auto-saved even when the app is closed.',
    // iOS steps
    ios_step1: 'Open the MathKu app in the <strong>Safari</strong> browser on your iPhone or iPad.',
    ios_step2: 'Tap the <strong>Share</strong> button <span class="step-hint">&#8599;</span> (box with up arrow) in Safari\u2019s bottom bar.',
    ios_step3: 'Scroll down the list and select <strong>"Add to Home Screen"</strong>.',
    ios_step4: 'Press <strong>"Add"</strong> in the top right corner of the screen.',
    ios_step5: 'Done! The MathKu icon now appears on your iPhone/iPad home screen.',
    ios_note: 'Safari is required. Other browsers on iOS do not support PWA.',
    // Desktop steps
    dsk_step1: 'Open the MathKu app in <strong>Chrome</strong> or <strong>Edge</strong> browser on your computer.',
    dsk_step2: 'Find the install icon <span class="step-hint">&#8853;</span> on the right side of the address bar, then click it.',
    dsk_step3: 'If not present, click the menu <span class="step-hint">&vellip;</span> (three dots) &raquo; <strong>"Install MathKu"</strong>.',
    dsk_step4: 'Click the <strong>"Install"</strong> button in the confirmation dialog.',
    dsk_step5: 'Done! MathKu opens in a separate window and its icon is available on desktop/taskbar.',
    dsk_note: 'The app opens full screen without an address bar, like a regular desktop app.',
    // Category names
    cat_mencacah: 'Counting',
    cat_penjumlahan: 'Addition',
    cat_pengurangan: 'Subtraction',
    cat_jumlah_kurang: 'Add & Subtract',
    cat_perkalian: 'Multiplication',
    cat_pembagian: 'Division',
    cat_kali_bagi: 'Multiply & Divide',
    cat_advance: 'Advanced',
    cat_ujian: 'Exam',
    // Motivasi
    msg_lu: ['Amazing, {nama}!','Great job, {nama}!','You\u2019re incredible, {nama}!','Fantastic, {nama}!','Awesome, {nama}!'],
    msg_cd: ['Math Champion, {nama}!','True Master, {nama}!','Outstanding, {nama}!','Brilliant, {nama}!'],
    msg_g: ['Well done, {nama}!','Your hard work paid off, {nama}!','Keep it up, {nama}!','Almost there, {nama}!'],
    msg_ta: ['Don\u2019t give up, {nama}!','You can do it, {nama}!','Keep practicing, {nama}!','Stay spirited, {nama}!']
  }
};

// Helper: terjemahkan key, support placeholder {var}
function t(key, vars) {
  var dict = I18N[currentLang] || I18N.id;
  var s = dict[key];
  if (s === undefined) s = I18N.id[key];
  if (s === undefined) return key;
  if (vars) {
    for (var k in vars) {
      if (vars.hasOwnProperty(k)) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      }
    }
  }
  return s;
}

// Helper: terjemahkan nama kategori
function tCat(id) {
  return t('cat_' + id);
}

// Helper: ambil array motivasi sesuai bahasa
function tMsgArr(key) {
  return I18N[currentLang][key] || I18N.id[key];
}

function setLang(lang) {
  if (lang !== 'id' && lang !== 'en') return;
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch(e) {}
  try { setCookie(LANG_KEY, lang, 365); } catch(e) {}
  // Update flag button
  var flag = document.getElementById('lang-flag');
  if (flag) flag.textContent = lang === 'id' ? 'ID' : 'EN';
  // Update html lang attribute
  document.documentElement.lang = lang;
}

/* ================================================================
   SOUND ENGINE — Web Audio API (melodi original, lisensi terbuka)
   Semua melodi dikomposisikan sendiri, tidak ada file eksternal.
   ================================================================ */
var SoundEngine = (function() {
  var ctx = null;
  var masterGain = null;
  var enabled = true;
  var SAVE_SOUND_KEY = 'mathku_sound';

  // Muat preferensi pengguna
  try {
    var saved = localStorage.getItem(SAVE_SOUND_KEY);
    if (saved === null) {
      var c = getCookie(SAVE_SOUND_KEY);
      if (c !== null) saved = c;
    }
    if (saved === '0' || saved === 'false') enabled = false;
  } catch(e) {}

  function initCtx() {
    if (ctx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.25; // Volume master 25%
      masterGain.connect(ctx.destination);
    } catch(e) { ctx = null; }
  }

  function isEnabled() { return enabled; }

  function setEnabled(v) {
    enabled = !!v;
    try { localStorage.setItem(SAVE_SOUND_KEY, enabled ? '1' : '0'); } catch(e) {}
    try { setCookie(SAVE_SOUND_KEY, enabled ? '1' : '0', 365); } catch(e) {}
    var btn = document.getElementById('sound-toggle');
    if (btn) {
      if (enabled) btn.classList.remove('muted');
      else btn.classList.add('muted');
    }
    // Beri feedback pendek saat diaktifkan
    if (enabled) play('click');
  }

  // Mainkan satu nada
  function playNote(freq, startAt, dur, type, vol) {
    if (!ctx) return;
    type = type || 'sine';
    vol = (vol === undefined) ? 0.3 : vol;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    // Envelope: attack-decay-release halus
    var t = ctx.currentTime + startAt;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Notasi frekuensi (Equal Temperament A4=440Hz)
  var N = {
    'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.00,'A4':440.00,'B4':493.88,
    'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.00,'B5':987.77,
    'C6':1046.50,'D6':1174.66,'E6':1318.51,'G3':196.00,'A3':220.00,'B3':246.94,'C3':130.81,
    'Eb4':311.13,'F#4':369.99,'Bb4':466.16,'Eb5':622.25,'F#5':739.99
  };

  // Daftar melodi. Setiap nada: [nama, durasi(baris), volume]
  var MELODIES = {
    // 1. Welcome - sambutan ceria (C mayor arpeggio)
    welcome: {
      tempo: 0.18, type: 'triangle',
      notes: [
        ['C5',1,0.32],['E5',1,0.32],['G5',1,0.32],['C6',2,0.4],
        ['G5',1,0.3],['C6',3,0.45]
      ]
    },
    // 2. Access granted - lagu pembuka
    accessGranted: {
      tempo: 0.16, type: 'triangle',
      notes: [
        ['C5',1,0.3],['E5',1,0.3],['G5',1,0.3],['C6',2,0.4],
        ['E5',1,0.28],['G5',1,0.28],['C6',1,0.28],['E5',1,0.28],['G5',3,0.45]
      ]
    },
    // 3. Jawaban benar - chime pendek naik
    correct: {
      tempo: 0.09, type: 'sine',
      notes: [
        ['C5',1,0.3],['E5',1,0.3],['G5',2,0.4]
      ]
    },
    // 4. Jawaban salah - descending minor
    wrong: {
      tempo: 0.14, type: 'sawtooth',
      notes: [
        ['Bb4',1,0.22],['F#4',1,0.22],['Eb4',2,0.25]
      ]
    },
    // 5. Kuis selesai (lulus) - fanfah singkat
    quizPass: {
      tempo: 0.13, type: 'triangle',
      notes: [
        ['C5',1,0.32],['C5',1,0.32],['C5',1,0.32],['C5',1,0.32],
        ['E5',1,0.34],['G5',1,0.34],['G5',1,0.34],['E5',1,0.34],
        ['C6',4,0.5]
      ]
    },
    // 6. Kuis selesai (gagal) - lembut "coba lagi"
    quizFail: {
      tempo: 0.2, type: 'sine',
      notes: [
        ['E5',1,0.28],['D5',1,0.28],['C5',1,0.28],['B4',1,0.28],
        ['A4',3,0.3]
      ]
    },
    // 7. Level baru terbuka - sparkly arpeggio
    levelUnlock: {
      tempo: 0.1, type: 'triangle',
      notes: [
        ['G4',1,0.28],['C5',1,0.28],['E5',1,0.3],['G5',1,0.3],
        ['C6',1,0.34],['E5',1,0.3],['G5',3,0.45]
      ]
    },
    // 8. Kategori selesai - fanfah kemenangan
    categoryComplete: {
      tempo: 0.14, type: 'triangle',
      notes: [
        ['C5',1,0.34],['E5',1,0.34],['G5',1,0.34],['C6',2,0.45],
        ['G5',1,0.32],['C6',4,0.55]
      ]
    },
    // 9. Ticking countdown ujian (5 detik) - detak tense
    tick: {
      tempo: 0.06, type: 'square',
      notes: [
        ['A3',1,0.18]
      ]
    },
    // 10. Countdown terakhir (Mulai!) - bunyi "go"
    go: {
      tempo: 0.18, type: 'triangle',
      notes: [
        ['G4',1,0.32],['C5',1,0.32],['E5',1,0.34],['G5',3,0.5]
      ]
    },
    // 11. Click tombol - sangat singkat
    click: {
      tempo: 0.04, type: 'sine',
      notes: [
        ['C6',1,0.18]
      ]
    },
    // 12. Bintang bertambah (saat skor tinggi)
    star: {
      tempo: 0.08, type: 'sine',
      notes: [
        ['C6',1,0.22],['G5',1,0.22],['E5',2,0.3]
      ]
    }
  };

  function play(name) {
    if (!enabled) return;
    initCtx();
    if (!ctx) return;
    // Browser autoplay policy: resume jika di-suspend
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function(){ });
    }
    var mel = MELODIES[name];
    if (!mel) return;
    var tempo = mel.tempo || 0.15;
    var type = mel.type || 'sine';
    var t = 0;
    for (var i = 0; i < mel.notes.length; i++) {
      var n = mel.notes[i];
      var freq = N[n[0]];
      if (!freq) continue;
      playNote(freq, t, n[1] * tempo * 1.5, type, n[2]);
      t += n[1] * tempo;
    }
    // Animasi pulse pada tombol
    var btn = document.getElementById('sound-toggle');
    if (btn) {
      btn.classList.remove('playing');
      void btn.offsetWidth;
      btn.classList.add('playing');
    }
  }

  return { play: play, isEnabled: isEnabled, setEnabled: setEnabled, initCtx: initCtx };
})();

// Fungsi pembantu global
function snd(name) { SoundEngine.play(name); }

var MSG_LU=[],MSG_CD=[],MSG_G=[],MSG_TA=[]; // Legacy placeholders - sekarang via tMsgArr()
var FRUIT_E=['\uD83C\uDF4E','\uD83C\uDF4A','\uD83C\uDF4B','\uD83C\uDF4C','\uD83C\uDF47','\uD83C\uDF49','\uD83C\uDF53','\uD83C\uDF45','\uD83C\uDF46','\uD83C\uDF3D'];
var ANIMAL_E=['\uD83D\uDC36','\uD83D\uDC31','\uD83D\uDC30','\uD83D\uDC39','\uD83D\uDC38','\uD83D\uDC2F','\uD83E\uDD8A','\uD83D\uDC35','\uD83D\uDC34','\uD83D\uDC3B'];

// Emoji khusus untuk intro quiz angka 1-10 (stabil, tidak random)
var INTRO_EMOJIS = ['\uD83D\uDC36','\uD83D\uDC31','\uD83D\uDC30','\uD83D\uDC39','\uD83D\uDC38','\uD83D\uDC2F','\uD83E\uDD8A','\uD83D\uDC35','\uD83D\uDC34','\uD83D\uDC3B'];
// Helper: dapatkan kata angka berdasarkan bahasa aktif
function numWord(n) { return t('num_' + n); }

// Bank soal cerita dari CSV (di-embed)
var STORY_BANK = {"penjumlahan": [["Budi punya {a} kelereng. Ayah membelikannya {b} kelereng lagi. Berapa jumlah kelereng Budi sekarang?", "Budi has {a} marbles. His father buys him {b} more marbles. How many marbles does Budi have now?"], ["Ani memiliki {a} boneka. Saat ulang tahun, ia mendapat hadiah {b} boneka lagi. Berapa boneka Ani sekarang?", "Ani has {a} dolls. On her birthday, she gets {b} more dolls as a gift. How many dolls does Ani have now?"], ["Edo membawa {a} mobil-mobilan ke taman. Udin membawa {b} mobil-mobilan. Berapa jumlah mobil-mobilan mereka berdua?", "Edo brings {a} toy cars to the park. Udin brings {b} toy cars. How many toy cars do they have in total?"], ["Siti punya {a} bola karet. Lani memberinya {b} bola karet lagi. Berapa banyak bola karet Siti?", "Siti has {a} rubber balls. Lani gives her {b} more rubber balls. How many rubber balls does Siti have?"], ["Di kotak mainan ada {a} blok lego. Adik memasukkan {b} blok lego lagi. Berapa jumlah lego di dalam kotak sekarang?", "There are {a} Lego blocks in the toy box. Her younger sibling puts in {b} more Lego blocks. How many Lego blocks are there in the box now?"], ["Doni memiliki {a} layang-layang. Kakak membuatkan {b} layang-layang lagi untuknya. Berapa layang-layang Doni sekarang?", "Doni has {a} kites. His older brother makes {b} more kites for him. How many kites does Doni have now?"], ["Rara mengumpulkan {a} stiker bintang. Ibu memberinya {b} stiker bintang lagi. Berapa stiker Rara sekarang?", "Rara collected {a} star stickers. Her mother gives her {b} more star stickers. How many stickers does Rara have now?"], ["Rudi punya {a} robot mainan. Ayah membelikannya {b} robot mainan lagi. Berapa jumlah robot Rudi semuanya?", "Rudi has {a} toy robots. Father buys him {b} more toy robots. How many robots does Rudi have in total?"], ["Dina meniup {a} balon merah dan {b} balon biru. Berapa jumlah semua balon Dina?", "Dina blows up {a} red balloons and {b} blue balloons. How many balloons does Dina have in total?"], ["Tono punya {a} kartu bergambar. Temannya memberi {b} kartu lagi. Berapa kartu Tono sekarang?", "Tono has {a} picture cards. His friend gives him {b} more cards. How many cards does Tono have now?"], ["Bima memiliki {a} gasing. Ayah membelikannya {b} gasing baru. Berapa banyak gasing Bima?", "Bima has {a} spinning tops. His father buys him {b} new spinning tops. How many spinning tops does Bima have?"], ["Rani menyusun {a} manik-manik merah dan {b} manik-manik kuning menjadi gelang. Berapa jumlah manik-manik Rani?", "Rani strings {a} red beads and {b} yellow beads into a bracelet. What is the total number of beads Rani has?"], ["Gilang punya {a} yoyo. Paman membelikannya {b} yoyo lagi. Berapa jumlah yoyo Gilang sekarang?", "Gilang has {a} yoyos. His uncle buys him {b} more yoyos. How many yoyos does Gilang have now?"], ["Fani punya {a} mainan puzzle. Kakek memberinya {b} mainan puzzle lagi. Berapa jumlah puzzle Fani?", "Fani has {a} puzzle toys. Grandfather gives her {b} more puzzle toys. How many puzzles does Fani have?"], ["Nisa memiliki {a} boneka beruang. Bibi membelikannya {b} boneka lagi. Berapa boneka Nisa sekarang?", "Nisa has {a} teddy bears. Her aunt buys her {b} more teddy bears. How many teddy bears does Nisa have now?"], ["Edo makan {a} biskuit manis. Karena masih lapar, ia makan {b} biskuit lagi. Berapa biskuit yang dimakan Edo?", "Edo eats {a} sweet biscuits. Because he is still hungry, he eats {b} more biscuits. How many biscuits does Edo eat?"], ["Ani membeli {a} permen rasa jeruk dan {b} permen rasa stroberi. Berapa permen Ani semuanya?", "Ani buys {a} orange-flavored candies and {b} strawberry-flavored candies. How many candies does Ani have in total?"], ["Budi membawa {a} donat ke sekolah. Temannya memberinya {b} donat lagi. Berapa donat Budi sekarang?", "Budi brings {a} donuts to school. His friend gives him {b} more donuts. How many donuts does Budi have now?"], ["Paman membelikan {a} es krim rasa stroberi dan {b} es krim cokelat. Berapa jumlah es krim semuanya?", "Uncle buys {a} strawberry ice creams and {b} chocolate ice creams. What is the total number of ice creams?"], ["Ibu membuat {a} kue cokelat dan {b} kue keju. Berapa total kue yang dibuat ibu?", "Mother bakes {a} chocolate cakes and {b} cheese cakes. What is the total number of cakes mother baked?"], ["Di toples ada {a} kue nastar. Ibu menaruh {b} kue nastar lagi. Berapa kue nastar di dalam toples?", "There are {a} nastar cookies in the jar. Mother puts in {b} more nastar cookies. How many nastar cookies are in the jar?"], ["Lita memakan {a} biskuit stroberi dan {b} biskuit cokelat. Berapa biskuit yang dimakan Lita?", "Lita eats {a} strawberry biscuits and {b} chocolate biscuits. How many biscuits does Lita eat?"], ["Di kotak bekal ada {a} potong roti. Ibu menambahkan {b} potong roti lagi. Berapa potong roti di kotak bekal?", "In the lunchbox there are {a} slices of bread. Mother adds {b} more slices of bread. How many slices of bread are in the lunchbox?"], ["Ibu membeli {a} apel manis. Ayah pulang membawa {b} apel lagi. Berapa jumlah apel semuanya?", "Mother buys {a} sweet apples. Father comes home bringing {b} more apples. What is the total number of apples?"], ["Lani memetik {a} buah jeruk di kebun. Kakek memetik {b} jeruk lagi. Berapa jeruk yang terkumpul?", "Lani picks {a} oranges in the garden. Grandfather picks {b} more oranges. How many oranges are collected?"], ["Edo memakan {a} stroberi. Kemudian ia memakan {b} stroberi lagi. Berapa stroberi yang dimakan Edo?", "Edo eats {a} strawberries. Then he eats {b} more strawberries. How many strawberries does Edo eat?"], ["Siti membeli {a} buah pisang. Adik meminta ibu membelikan {b} pisang lagi. Berapa total pisang mereka?", "Siti buys {a} bananas. Her younger sibling asks mother to buy {b} more bananas. What is their total number of bananas?"], ["Beni membawa {a} buah kelengkeng. Temannya memberi {b} kelengkeng lagi. Berapa kelengkeng Beni?", "Beni brings {a} longans. His friend gives him {b} more longans. How many longans does Beni have?"], ["Rio makan {a} potong buah melon, lalu minta tambah {b} potong melon lagi. Berapa melon yang dimakan Rio?", "Rio eats {a} slices of melon, then asks for {b} more slices of melon. How many slices of melon does Rio eat?"], ["Budi memasukkan {a} salak ke dalam kantong, lalu memasukkan {b} salak lagi. Berapa salak di kantong Budi?", "Budi puts {a} snake fruits into a bag, then puts in {b} more snake fruits. How many snake fruits are in Budi's bag?"], ["Ani punya {a} pensil. Ibu membelikannya {b} pensil baru. Berapa jumlah pensil Ani sekarang?", "Ani has {a} pencils. Her mother buys her {b} new pencils. How many pencils does Ani have now?"], ["Budi memiliki {a} buku tulis. Ayah memberinya {b} buku tulis lagi. Berapa buku tulis Budi semuanya?", "Budi has {a} notebooks. His father gives him {b} more notebooks. How many notebooks does Budi have in total?"], ["Di tempat pensil ada {a} penghapus. Kakak memasukkan {b} penghapus lagi. Berapa jumlah penghapus?", "There are {a} erasers in the pencil case. Her older sibling puts in {b} more erasers. How many erasers are there in total?"], ["Edo membawa {a} spidol warna merah dan {b} spidol warna biru. Berapa jumlah spidol Edo?", "Edo brings {a} red markers and {b} blue markers. How many markers does Edo have?"], ["Siti punya {a} krayon merah. Ia membeli {b} krayon biru. Berapa jumlah krayon Siti?", "Siti has {a} red crayons. She buys {b} blue crayons. How many crayons does Siti have in total?"], ["Guru membagikan {a} kertas lipat warna merah dan {b} kertas lipat warna kuning. Berapa total kertas lipat?", "The teacher hands out {a} red origami papers and {b} yellow origami papers. What is the total number of origami papers?"], ["Andi punya {a} rautan pensil. Ia membeli {b} rautan lagi. Berapa rautan pensil Andi?", "Andi has {a} pencil sharpeners. He buys {b} more pencil sharpeners. How many pencil sharpeners does Andi have?"], ["Nisa membawa {a} buku cerita anak. Di perpustakaan ia meminjam {b} buku cerita lagi. Berapa buku Nisa sekarang?", "Nisa brings {a} children's storybooks. In the library she borrows {b} more storybooks. How many books does Nisa have now?"], ["Tono menempel {a} stiker nama di bukunya, lalu menempel {b} stiker lagi. Berapa stiker yang ditempel Tono?", "Tono pastes {a} name stickers on his book, then he pastes {b} more stickers. How many stickers does Tono paste?"], ["Rini memiliki {a} kuas lukis. Paman membelikannya {b} kuas lukis baru. Berapa kuas Rini?", "Rini has {a} paintbrushes. Her uncle buys her {b} new paintbrushes. How many paintbrushes does Rini have?"], ["Dina melipat {a} pesawat kertas. Edo melipat {b} pesawat kertas. Berapa mainan kertas mereka berdua?", "Dina folds {a} paper airplanes. Edo folds {b} paper airplanes. How many paper toys do they have together?"], ["Beni mewarnai {a} gambar mobil dan {b} gambar motor. Berapa jumlah gambar yang diwarnai Beni?", "Beni colors {a} pictures of cars and {b} pictures of motorcycles. How many pictures does Beni color?"], ["Sinta membawa {a} botol minum ke sekolah. Kakaknya menitipkan {b} botol minum lagi. Berapa botol minum yang dibawa Sinta?", "Sinta brings {a} water bottles to school. Her older sibling entrusts her with {b} more water bottles. How many water bottles does Sinta bring?"], ["Di laci meja ada {a} pulpen hitam dan {b} pulpen biru. Berapa jumlah pulpen di dalam laci?", "In the desk drawer, there are {a} black pens and {b} blue pens. How many pens are in the drawer?"], ["Lani punya {a} jepit kertas, lalu ia menemukan {b} jepit kertas lagi di lantai kelas. Berapa jepit kertas Lani?", "Lani has {a} paper clips, then she finds {b} more paper clips on the classroom floor. How many paper clips does Lani have?"], ["Di kolam peliharaan ada {a} ikan hias. Paman memasukkan {b} ikan hias lagi. Berapa jumlah ikan di kolam?", "There are {a} ornamental fish in the pet pond. Uncle puts in {b} more ornamental fish. How many fish are in the pond?"], ["Lani memelihara {a} kelinci putih dan {b} kelinci cokelat. Berapa jumlah kelinci Lani semuanya?", "Lani keeps {a} white rabbits and {b} brown rabbits as pets. What is the total number of rabbits Lani has?"], ["Edo melihat {a} kupu-kupu hinggap di bunga. Lalu terbang datang {b} kupu-kupu lagi. Berapa jumlah kupu-kupu sekarang?", "Edo sees {a} butterflies landing on the flowers. Then {b} more butterflies fly over. How many butterflies are there now?"], ["Kakek memelihara {a} ekor ayam. Paman memberi kakek {b} ekor ayam lagi. Berapa ekor ayam kakek sekarang?", "Grandfather raises {a} chickens. Uncle gives grandfather {b} more chickens. How many chickens does grandfather have now?"], ["Dina melihat {a} katak melompat di pinggir sungai, lalu melihat {b} katak lagi. Berapa katak yang dilihat Dina?", "Dina sees {a} frogs jumping by the river, then sees {b} more frogs. How many frogs does Dina see?"], ["Rini punya {a} ikan cupang di akuarium kecil. Ayah membelikannya {b} ikan cupang lagi. Berapa ikan cupang Rini?", "Rini has {a} betta fish in a small aquarium. Her father buys her {b} more betta fish. How many betta fish does Rini have?"], ["Di kebun binatang, Edo melihat {a} anak gajah dan {b} gajah dewasa. Berapa jumlah gajah tersebut?", "At the zoo, Edo sees {a} baby elephants and {b} adult elephants. How many elephants are there in total?"], ["Kucing Budi melahirkan {a} anak kucing berbulu hitam dan {b} anak kucing berbulu putih. Berapa anak kucing Budi?", "Budi's cat gave birth to {a} black kittens and {b} white kittens. How many kittens does Budi have?"], ["Di atap rumah ada {a} burung merpati. Kemudian terbang datang {b} burung merpati lagi. Berapa burung merpati di atap?", "On the roof there are {a} doves. Then {b} more doves fly in. How many doves are on the roof?"], ["Terdapat {a} ekor semut sedang berjalan di dinding. Datang {b} ekor semut lagi menyusul. Berapa jumlah semut di dinding?", "There are {a} ants walking on the wall. {b} more ants follow. How many ants are on the wall in total?"], ["Lani punya {a} jepit rambut merah jambu. Ibu membelikannya {b} jepit rambut biru. Berapa jepit rambut Lani?", "Lani has {a} pink hair clips. Her mother buys her {b} blue hair clips. How many hair clips does Lani have?"], ["Di lemari pakaian ada {a} kemeja Budi. Ibu menaruh {b} kemeja bersih lagi. Berapa kemeja Budi di lemari sekarang?", "There are {a} of Budi's shirts in the closet. Mother puts in {b} more clean shirts. How many shirts does Budi have in the closet now?"], ["Siti mencuci {a} pasang kaus kaki sekolah dan {b} pasang kaus kaki main. Berapa pasang kaus kaki yang dicuci Siti?", "Siti washes {a} pairs of school socks and {b} pairs of play socks. How many pairs of socks does Siti wash?"], ["Edo punya {a} topi kesayangan. Saat liburan, ia dibelikan {b} topi lagi. Berapa topi Edo sekarang?", "Edo has {a} favorite hats. During the holidays, he was bought {b} more hats. How many hats does Edo have now?"], ["Bima punya {a} jaket tebal. Ayah membelikannya {b} jaket baru. Berapa jumlah jaket Bima?", "Bima has {a} thick jackets. His father buys him {b} new jackets. How many jackets does Bima have?"], ["Ibu mencuci {a} piring kotor bekas makan, lalu mencuci {b} piring lagi. Berapa jumlah piring yang dicuci ibu?", "Mother washes {a} dirty plates from eating, then washes {b} more plates. How many plates does mother wash?"], ["Rara merapikan {a} pasang sepatu sekolah dan {b} pasang sepatu main di rak sepatu. Berapa pasang sepatu yang dirapikan Rara?", "Rara organizes {a} pairs of school shoes and {b} pairs of play shoes on the shoe rack. How many pairs of shoes does Rara organize?"], ["Ani merapikan {a} bantal di atas kasur, lalu merapikan {b} bantal di sofa. Berapa bantal yang dirapikan Ani?", "Ani arranges {a} pillows on the bed, then arranges {b} pillows on the sofa. How many pillows does Ani arrange?"], ["Siti menyiram {a} pot bunga melati. Adik membantunya menyiram {b} pot bunga mawar. Berapa pot bunga yang disiram mereka?", "Siti waters {a} pots of jasmine flowers. Her younger sibling helps her water {b} pots of rose flowers. How many flower pots do they water?"], ["Udin menyetrika {a} celana panjang dan {b} celana pendek seragam. Berapa celana yang disetrika Udin?", "Udin irons {a} long pants and {b} short uniform pants. How many pants does Udin iron?"]], "pengurangan": [["Ani membeli {a} permen manis. Ia membagikan {b} permen kepada temannya. Berapa sisa permen Ani?", "Ani bought {a} sweet candies. She gave {b} candies to her friend. How many candies does Ani have left?"], ["Sinta memiliki {a} keping cokelat. Ia memberikan {b} keping kepada adiknya. Berapa keping cokelat Sinta sekarang?", "Sinta has {a} pieces of chocolate. She gave {b} pieces to her younger sibling. How many pieces of chocolate does Sinta have now?"], ["Budi membawa {a} donat ke sekolah. Budi memakan {b} donat. Berapa sisa donat Budi?", "Budi brought {a} donuts to school. Budi ate {b} donuts. How many donuts does Budi have left?"], ["Ibu membuat {a} potong kue cokelat. Adik memakan {b} potong. Berapa sisa kue cokelat ibu?", "Mother made {a} slices of chocolate cake. My younger sibling ate {b} slices. How many slices of chocolate cake does Mother have left?"], ["Paman membelikan {a} es krim. Ternyata {b} es krim mencair karena panas. Berapa es krim yang masih beku?", "Uncle bought {a} ice creams. It turns out {b} ice creams melted from the heat. How many frozen ice creams are left?"], ["Ibu punya {a} apel manis. Ayah memakan {b} apel. Berapa sisa apel ibu?", "Mother has {a} sweet apples. Father ate {b} apples. How many apples does Mother have left?"], ["Edo mencuci {a} stroberi. Adiknya memakan {b} stroberi. Berapa sisa stroberi Edo?", "Edo washed {a} strawberries. His younger sibling ate {b} strawberries. How many strawberries does Edo have left?"], ["Edo punya {a} biskuit. Ia memakan {b} biskuit. Berapa sisa biskuit Edo?", "Edo has {a} biscuits. He ate {b} biscuits. How many biscuits does Edo have left?"], ["Siti dibuatkan {a} gelas susu. Siti meminum {b} gelas. Berapa sisa gelas susu Siti?", "Siti was made {a} glasses of milk. Siti drank {b} glass. How many full glasses of milk are left?"], ["Di kotak bekal ada {a} potong roti. Budi memakan {b} potong saat istirahat. Berapa sisa roti di kotak bekal?", "In the lunchbox, there are {a} slices of bread. Budi ate {b} slices during recess. How many slices of bread are left in the lunchbox?"], ["Lani memetik {a} buah jeruk di kebun. Ia memberikan {b} jeruk kepada kakek. Berapa sisa jeruk Lani?", "Lani picked {a} oranges in the garden. She gave {b} oranges to Grandpa. How many oranges does Lani have left?"], ["Di keranjang ada {a} mangga. Ternyata {b} mangga membusuk. Berapa mangga yang masih bagus?", "In the basket, there are {a} mangoes. It turns out {b} mango is rotten. How many good mangoes are left?"], ["Di kulkas ada {a} buah anggur. Adik memakan {b} anggur. Berapa sisa anggur di kulkas?", "In the fridge, there are {a} grapes. My younger sibling ate {b} grapes. How many grapes are left in the fridge?"], ["Ayah memanen {a} pisang. Ibu menggoreng {b} pisang. Berapa sisa pisang yang belum digoreng?", "Father harvested {a} bananas. Mother fried {b} bananas. How many unfried bananas are left?"], ["Ada {a} rambutan di atas meja. Ayah memakan {b} rambutan. Berapa sisa rambutan di meja?", "There are {a} rambutans on the table. Father ate {b} rambutans. How many rambutans are left on the table?"], ["Udin memetik {a} jambu air. Ia memakan {b} jambu air bersama temannya. Berapa sisa jambu Udin?", "Udin picked {a} water apples. He ate {b} water apples with his friend. How many water apples does Udin have left?"], ["Rio membawa {a} potong melon. Ia memakan {b} potong melon. Berapa sisa melon Rio?", "Rio brought {a} slices of melon. He ate {b} slices of melon. How many slices of melon does Rio have left?"], ["Dina memotong {a} buah naga. Ibu membuat jus dari {b} buah naga. Berapa sisa buah naga Dina?", "Dina cut {a} dragon fruits. Mother made juice out of {b} dragon fruits. How many dragon fruits does Dina have left?"], ["Ibu mengupas {a} jeruk bali. Adik memakan {b} jeruk bali. Berapa sisa jeruk bali ibu?", "Mother peeled {a} pomelos. My younger sibling ate {b} pomelos. How many pomelos does Mother have left?"], ["Nenek merebus {a} butir telur. Kakek memakan {b} telur rebus. Berapa sisa telur rebus nenek?", "Grandma boiled {a} eggs. Grandpa ate {b} boiled eggs. How many boiled eggs does Grandma have left?"], ["Ayah menggoreng {a} tempe. Saat makan siang, {b} tempe habis dimakan. Berapa sisa tempe goreng?", "Father fried {a} tempeh. During lunch, {b} tempeh were eaten. How many fried tempeh are left?"], ["Rio membeli {a} butir bakso. Ia memakan {b} bakso. Berapa sisa bakso di mangkok Rio?", "Rio bought {a} meatballs. He ate {b} meatballs. How many meatballs are left in Rio's bowl?"], ["Di piring ada {a} potong martabak manis. Ayah memakan {b} potong. Berapa sisa martabak di piring?", "On the plate, there are {a} slices of sweet martabak. Father ate {b} slices. How many slices of martabak are left on the plate?"], ["Bibi membawa {a} bolu kukus. Ibu memakan {b} bolu kukus. Berapa sisa bolu kukus?", "Aunt brought {a} steamed sponges. Mother ate {b} steamed sponges. How many steamed sponges are left?"], ["Di toples ada {a} kue nastar. Kakak memakan {b} kue nastar. Berapa kue nastar di dalam toples sekarang?", "In the jar, there are {a} nastar cookies. My older sibling ate {b} nastar cookies. How many nastar cookies are in the jar now?"], ["Dina membeli {a} bungkus kerupuk. Di jalan, {b} bungkus kerupuk jatuh dan tumpah. Berapa sisa kerupuk Dina?", "Dina bought {a} packs of crackers. On the way, {b} packs of crackers fell and spilled. How many packs of crackers does Dina have left?"], ["Budi punya {a} kelereng. Saat bermain, {b} kelereng Budi hilang. Berapa sisa kelereng Budi sekarang?", "Budi has {a} marbles. While playing, {b} of Budi's marbles got lost. How many marbles does Budi have left now?"], ["Dina meniup {a} balon. Tiba-tiba {b} balon meletus. Berapa sisa balon Dina?", "Dina blew {a} balloons. Suddenly {b} balloons popped. How many balloons does Dina have left?"], ["Ani memiliki {a} boneka. Ani memberikan {b} boneka kepada panti asuhan. Berapa sisa boneka Ani?", "Ani has {a} dolls. Ani gave {b} dolls to the orphanage. How many dolls does Ani have left?"], ["Di kotak mainan ada {a} blok lego. Adik mengambil {b} blok lego untuk dimainkan. Berapa sisa lego di kotak?", "In the toy box, there are {a} lego blocks. My younger sibling took {b} lego blocks to play with. How many lego blocks are left in the box?"], ["Rudi punya {a} robot mainan. Ayah membuang {b} robot yang sudah rusak. Berapa robot Rudi sekarang?", "Rudi has {a} toy robots. Father threw away {b} broken robots. How many robots does Rudi have now?"], ["Nisa memiliki {a} boneka beruang. Ia meminjamkan {b} boneka kepada adiknya. Berapa boneka Nisa sekarang?", "Nisa has {a} teddy bears. She lent {b} teddy bears to her younger sibling. How many teddy bears does Nisa have now?"], ["Sinta memiliki {a} botol gelembung sabun. Ia menumpahkan {b} botol. Berapa sisa gelembung sabun Sinta?", "Sinta has {a} bottles of soap bubbles. She spilled {b} bottles. How many bottles of soap bubbles does Sinta have left?"], ["Doni menerbangkan {a} layang-layang. Ada {b} layang-layang yang talinya putus. Berapa layang-layang Doni yang tersisa?", "Doni flew {a} kites. The strings of {b} kites snapped. How many kites does Doni have left?"], ["Tono punya {a} kartu bergambar. Ia membagikan {b} kartu kepada temannya. Berapa sisa kartu Tono?", "Tono has {a} picture cards. He shared {b} cards with his friend. How many cards does Tono have left?"], ["Di meja ada {a} mainan rubik. Kakak meminjam {b} rubik. Berapa sisa rubik di meja?", "On the table, there are {a} rubik's cube toys. My older sibling borrowed {b} rubik's cubes. How many rubik's cubes are left on the table?"], ["Ani punya {a} pensil. Saat menulis, {b} pensil patah. Berapa sisa pensil Ani yang masih bagus?", "Ani has {a} pencils. While writing, {b} pencils broke. How many good pencils does Ani have left?"], ["Di tempat pensil ada {a} penghapus. Ada {b} penghapus yang hilang di kelas. Berapa sisa penghapus?", "In the pencil case, there are {a} erasers. {b} eraser got lost in class. How many erasers are left?"], ["Siti punya {a} krayon. Ada {b} krayon yang patah menjadi dua. Berapa krayon yang masih utuh?", "Siti has {a} crayons. {b} crayons broke in half. How many intact crayons are left?"], ["Edo membawa {a} spidol warna. Ternyata {b} spidol tintanya habis. Berapa spidol yang masih bisa dipakai?", "Edo brought {a} colored markers. It turns out {b} markers ran out of ink. How many markers can still be used?"], ["Ani memiliki {a} buku gambar. Ia sudah mencoret-coret {b} buku. Berapa buku gambar yang masih kosong?", "Ani has {a} drawing books. She already scribbled in {b} books. How many drawing books are still empty?"], ["Guru membagikan {a} kertas lipat origami. Anak-anak memakai {b} kertas. Berapa sisa kertas guru?", "The teacher distributed {a} origami papers. The children used {b} papers. How many papers does the teacher have left?"], ["Sinta membawa {a} lembar kertas warna. Ia menggunting {b} lembar kertas. Berapa sisa kertas Sinta?", "Sinta brought {a} sheets of colored paper. She cut {b} sheets of paper. How many sheets of paper does Sinta have left?"], ["Budi memiliki {a} buku tulis. Temannya meminjam {b} buku. Berapa buku tulis Budi sekarang?", "Budi has {a} notebooks. His friend borrowed {b} notebooks. How many notebooks does Budi have now?"], ["Beni meminjam {a} buku cerita. Ia mengembalikan {b} buku ke perpustakaan. Berapa sisa buku yang dipinjam Beni?", "Beni borrowed {a} storybooks. He returned {b} books to the library. How many borrowed books does Beni have left?"], ["Udin punya {a} buku cerita dongeng. Ia sudah selesai membaca {b} buku. Berapa buku yang belum dibaca Udin?", "Udin has {a} fairytale storybooks. He has finished reading {b} books. How many books has Udin not read yet?"], ["Rara memiliki {a} penggaris. Ia memberikan {b} penggaris kepada temannya. Berapa sisa penggaris Rara?", "Rara has {a} rulers. She gave {b} rulers to her friend. How many rulers does Rara have left?"], ["Tono memiliki {a} pulpen. Ada {b} pulpen yang tintanya macet. Berapa pulpen yang masih bisa dipakai?", "Tono has {a} pens. {b} pens got clogged ink. How many pens can still be used?"], ["Rini memiliki {a} sampul buku. Ia menyampul {b} bukunya. Berapa sisa sampul Rini?", "Rini has {a} book covers. She covered {b} of her books. How many book covers does Rini have left?"], ["Kucing Budi melahirkan {a} anak kucing. Budi memberikan {b} anak kucing kepada temannya. Berapa sisa anak kucing Budi?", "Budi's cat gave birth to {a} kittens. Budi gave {b} kitten to his friend. How many kittens does Budi have left?"], ["Di kolam ada {a} ikan mas. Ternyata {b} ikan mati. Berapa sisa ikan yang hidup di kolam?", "In the pond, there are {a} goldfish. It turns out {b} fish died. How many living fish are left in the pond?"], ["Rara mempunyai {a} ikan cupang. Ia memindahkan {b} ikan ke wadah lain. Berapa sisa ikan di wadah pertama?", "Rara has {a} betta fish. She moved {b} fish to another container. How many fish are left in the first container?"], ["Di dahan pohon ada {a} burung. Tiba-tiba {b} burung terbang kaget. Berapa sisa burung di dahan?", "On the tree branch, there are {a} birds. Suddenly {b} birds flew away startled. How many birds are left on the branch?"], ["Udin memberi makan {a} burung merpati. Setelah kenyang, {b} burung terbang. Berapa merpati yang masih makan?", "Udin fed {a} pigeons. After getting full, {b} birds flew away. How many pigeons are still eating?"], ["Lani memelihara {a} kelinci. Suatu hari {b} kelinci kabur dari kandang. Berapa sisa kelinci Lani?", "Lani keeps {a} rabbits. One day {b} rabbit escaped from the cage. How many rabbits does Lani have left?"], ["Peternak memiliki {a} ekor ayam. Ia menjual {b} ayam ke pasar. Berapa sisa ayam di peternakan?", "The farmer has {a} chickens. He sold {b} chickens to the market. How many chickens are left on the farm?"], ["Kakek punya {a} ekor bebek. Ada {b} bebek yang berenang ke sungai. Berapa sisa bebek di kandang?", "Grandpa has {a} ducks. {b} ducks swam to the river. How many ducks are left in the pen?"], ["Ada {a} kura-kura sedang berjemur. Lalu {b} kura-kura masuk ke dalam air. Berapa sisa kura-kura yang berjemur?", "There are {a} turtles basking. Then {b} turtles went into the water. How many turtles are still basking?"], ["Edo melihat {a} lalat hinggap di meja. Tiba-tiba {b} lalat terbang menjauh. Berapa sisa lalat di meja?", "Edo saw {a} flies land on the table. Suddenly {b} flies flew away. How many flies are left on the table?"], ["Di taman ada {a} bunga mawar mekar. Sore harinya, {b} bunga mawar layu. Berapa sisa mawar yang masih mekar?", "In the garden, there are {a} blooming roses. In the afternoon, {b} roses withered. How many blooming roses are left?"], ["Dina menanam {a} bibit bunga mawar. Ternyata {b} bibit layu dan mati. Berapa bibit bunga yang berhasil tumbuh?", "Dina planted {a} rose seedlings. It turns out {b} seedling withered and died. How many seedlings grew successfully?"], ["Di kebun paman ada {a} pohon mangga. Paman menebang {b} pohon karena sudah tua. Berapa sisa pohon mangga paman?", "In Uncle's garden, there are {a} mango trees. Uncle cut down {b} trees because they were old. How many mango trees does Uncle have left?"], ["Ada {a} ranting di pohon jambu. Burung menginjak {b} ranting sampai patah. Berapa ranting yang masih utuh?", "There are {a} branches on the guava tree. Birds stepped on {b} branches until they broke. How many intact branches are left?"], ["Ayah menemukan {a} jamur di hutan. Ayah memetik {b} jamur untuk dimasak. Berapa sisa jamur di tanah?", "Father found {a} mushrooms in the forest. Father picked {b} mushrooms to cook. How many mushrooms are left on the ground?"], ["Lani punya {a} jepit rambut. Ia menghilangkan {b} jepit rambutnya di sekolah. Berapa sisa jepit rambut Lani?", "Lani has {a} hair clips. She lost {b} hair clips at school. How many hair clips does Lani have left?"]], "jumlah_kurang": [["Budi punya {a} kelereng. Ayah memberi {b} kelereng, lalu Budi memberikan {c} kelereng kepada adiknya. Berapa sisa kelereng Budi?", "Budi has {a} marbles. Father gives him {b} more, then Budi gives {c} marbles to his younger sibling. How many marbles does Budi have left?"], ["Ani punya {a} boneka. Ia membeli {b} boneka baru, tetapi {c} bonekanya rusak. Berapa sisa boneka Ani?", "Ani has {a} dolls. She buys {b} new dolls, but {c} of her dolls are broken. How many dolls does Ani have left?"], ["Di kotak ada {a} balok lego. Adik memasukkan {b} balok lego, lalu ayah mengambil {c} balok. Berapa sisa balok di kotak?", "In the box, there are {a} lego blocks. My younger sibling adds {b} lego blocks, then father takes {c} blocks. How many blocks are left in the box?"], ["Doni memiliki {a} layang-layang. Kakak membuatkan {b} layang-layang, namun {c} layang-layang talinya putus. Berapa sisa layang-layang Doni?", "Doni has {a} kites. His older sibling makes him {b} more, but the strings of {c} kites snap. How many kites does Doni have left?"], ["Rudi punya {a} robot mainan. Ibu membelikan {b} robot lagi, lalu {c} robot diberikan kepada sepupunya. Berapa sisa robot Rudi?", "Rudi has {a} toy robots. Mother buys him {b} more, then {c} robots are given to his cousin. How many robots does Rudi have left?"], ["Dina meniup {a} balon. Ayah meniupkan {b} balon lagi, tetapi {c} balon meletus. Berapa sisa balon Dina?", "Dina blows {a} balloons. Father blows {b} more, but {c} balloons pop. How many balloons does Dina have left?"], ["Tono punya {a} kartu bergambar. Teman memberi {b} kartu, lalu Tono kehilangan {c} kartu. Berapa sisa kartu Tono?", "Tono has {a} picture cards. A friend gives him {b} cards, then Tono loses {c} cards. How many cards does Tono have left?"], ["Ibu punya {a} apel. Ayah membawa {b} apel lagi, lalu {c} apel dimakan adik. Berapa sisa apel ibu?", "Mother has {a} apples. Father brings {b} more, then {c} apples are eaten by my younger sibling. How many apples does Mother have left?"], ["Lani punya {a} jeruk. Kakek memberi {b} jeruk, kemudian Lani memakan {c} jeruk. Berapa sisa jeruk Lani?", "Lani has {a} oranges. Grandpa gives her {b} more, then Lani eats {c} oranges. How many oranges does Lani have left?"], ["Di keranjang ada {a} mangga. Ibu menambah {b} mangga, tapi {c} mangga ternyata busuk. Berapa sisa mangga yang bagus?", "In the basket, there are {a} mangoes. Mother adds {b} more, but {c} mangoes turn out to be rotten. How many good mangoes are left?"], ["Edo punya {a} stroberi. Ia memetik {b} stroberi lagi, lalu memberikan {c} stroberi ke teman. Berapa sisa stroberi Edo?", "Edo has {a} strawberries. He picks {b} more, then gives {c} strawberries to a friend. How many strawberries does Edo have left?"], ["Ayah memanen {a} pisang. Paman memberikan {b} pisang lagi, lalu ibu menggoreng {c} pisang. Berapa sisa pisang mentah yang belum digoreng?", "Father harvests {a} bananas. Uncle gives {b} more, then Mother fries {c} bananas. How many raw bananas are left?"], ["Udin punya {a} jambu air. Ibu memberi {b} jambu, lalu {c} jambu dimakan bersama teman. Berapa sisa jambu Udin?", "Udin has {a} water apples. Mother gives him {b} more, then {c} water apples are eaten with friends. How many water apples does Udin have left?"], ["Di kulkas ada {a} anggur. Kakak menaruh {b} anggur lagi, lalu {c} anggur dimakan adik. Berapa sisa anggur di kulkas?", "In the fridge, there are {a} grapes. Older sibling puts {b} more, then {c} grapes are eaten by my younger sibling. How many grapes are left in the fridge?"], ["Dina punya {a} buah naga. Ia membeli {b} lagi, kemudian {c} buah naga dibuat jus. Berapa sisa buah naga yang masih utuh?", "Dina has {a} dragon fruits. She buys {b} more, then {c} dragon fruits are made into juice. How many whole dragon fruits are left?"], ["Ada {a} rambutan di meja. Ayah menaruh {b} rambutan, lalu {c} rambutan dimakan. Berapa sisa rambutan?", "There are {a} rambutans on the table. Father puts {b} more, then {c} rambutans are eaten. How many rambutans are left?"], ["Rio punya {a} potong melon. Ia mendapat {b} potong lagi, tapi {c} potong melon dimakan. Berapa sisa melon Rio?", "Rio has {a} slices of melon. He gets {b} more, but {c} slices are eaten. How many slices does Rio have left?"], ["Ani punya {a} pensil. Ibu memberi {b} pensil, tapi {c} pensil patah. Berapa sisa pensil Ani yang masih bagus?", "Ani has {a} pencils. Mother gives her {b} more, but {c} pencils break. How many good pencils does Ani have left?"], ["Budi punya {a} buku tulis. Ayah membelikan {b} buku, lalu {c} buku dipinjam teman. Berapa sisa buku Budi?", "Budi has {a} notebooks. Father buys him {b} more, then {c} notebooks are borrowed by a friend. How many notebooks does Budi have left?"], ["Di tempat pensil ada {a} penghapus. Kakak memasukkan {b} penghapus, tapi {c} penghapus hilang di sekolah. Berapa sisa penghapus?", "In the pencil case, there are {a} erasers. Older sibling adds {b} more, but {c} erasers are lost at school. How many erasers are left?"], ["Edo punya {a} spidol. Ibu membeli {b} spidol lagi, namun {c} spidol tintanya habis. Berapa sisa spidol yang bisa dipakai?", "Edo has {a} markers. Mother buys {b} more, but {c} markers run out of ink. How many usable markers are left?"], ["Siti punya {a} krayon. Teman memberi {b} krayon, lalu {c} krayon patah. Berapa sisa krayon Siti yang utuh?", "Siti has {a} crayons. A friend gives her {b} more, then {c} crayons break. How many intact crayons does Siti have left?"], ["Rara punya {a} penggaris. Ia membeli {b} penggaris, lalu memberikan {c} penggaris ke temannya. Berapa sisa penggaris Rara?", "Rara has {a} rulers. She buys {b} more, then gives {c} to a friend. How many rulers does Rara have left?"], ["Guru punya {a} kertas lipat. Ia menambah {b} kertas, lalu murid memakai {c} kertas. Berapa sisa kertas guru?", "The teacher has {a} origami papers. She adds {b} more, then students use {c} papers. How many papers does the teacher have left?"], ["Tono punya {a} pulpen. Ayah membelikan {b} pulpen, tapi {c} pulpen tintanya macet. Berapa sisa pulpen Tono yang lancar?", "Tono has {a} pens. Father buys {b} more, but {c} pens get clogged. How many working pens does Tono have left?"], ["Beni meminjam {a} buku cerita dari perpustakaan. Paman memberi {b} buku cerita lagi, lalu Beni mengembalikan {c} buku ke perpustakaan. Berapa sisa buku cerita yang ada di rumah Beni?", "Beni borrows {a} storybooks from the library. Uncle gives him {b} more, then Beni returns {c} books to the library. How many storybooks are left at Beni's house?"], ["Sinta punya {a} lembar kertas warna. Ia membeli {b} lembar kertas, lalu menggunting {c} lembar untuk tugas. Berapa sisa kertas Sinta?", "Sinta has {a} sheets of colored paper. She buys {b} more sheets, then cuts {c} sheets for an assignment. How many sheets of colored paper does Sinta have left?"], ["Di kolam ada {a} ikan hias. Paman memasukkan {b} ikan, lalu {c} ikan mati. Berapa sisa ikan di kolam?", "In the pond, there are {a} ornamental fish. Uncle adds {b} more fish, then {c} fish die. How many fish are left in the pond?"], ["Kucing Budi memiliki {a} anak. Lahir {b} anak kucing lagi, tapi {c} anak kucing diadopsi tetangga. Berapa sisa anak kucing Budi?", "Budi's cat has {a} kittens. {b} more kittens are born, but {c} kittens are adopted by a neighbor. How many kittens does Budi have left?"], ["Di dahan pohon ada {a} burung. Datang {b} burung lagi, lalu {c} burung terbang pergi. Berapa sisa burung di dahan?", "On the tree branch, there are {a} birds. {b} more birds arrive, then {c} birds fly away. How many birds are left on the branch?"], ["Peternak memiliki {a} ayam. Kemudian menetas {b} anak ayam lagi, lalu {c} ayam dijual ke pasar. Berapa sisa ayam peternak sekarang?", "The farmer has {a} chickens. Then {b} more chicks hatch, and {c} chickens are sold to the market. How many chickens does the farmer have left?"], ["Lani memelihara {a} kelinci. Kakek membelikan {b} kelinci, tapi {c} kelinci kabur dari kandang. Berapa sisa kelinci Lani?", "Lani keeps {a} rabbits. Grandpa buys her {b} more, but {c} rabbits escape from the cage. How many rabbits does Lani have left?"], ["Udin memelihara {a} burung merpati. Ia membeli {b} merpati lagi, lalu {c} merpati terbang dan tidak kembali. Berapa sisa merpati Udin?", "Udin keeps {a} pigeons. He buys {b} more, then {c} pigeons fly away and do not return. How many pigeons does Udin have left?"], ["Ada {a} kura-kura berjemur. Datang {b} kura-kura ikut berjemur, lalu {c} kura-kura masuk ke dalam air. Berapa sisa kura-kura di darat?", "There are {a} turtles basking. {b} more turtles come to bask, then {c} turtles go into the water. How many turtles are left on land?"], ["Edo melihat {a} lalat di meja. Datang {b} lalat lagi, tapi {c} lalat terbang diusir ibu. Berapa sisa lalat di meja?", "Edo sees {a} flies on the table. {b} more flies arrive, but {c} flies fly away after being shooed by mother. How many flies are left on the table?"], ["Ibu membuat {a} potong kue. Ibu memanggang {b} potong kue lagi, tapi {c} kue dimakan saat tamu datang. Berapa sisa kue ibu?", "Mother makes {a} slices of cake. She bakes {b} more slices, but {c} slices are eaten when guests arrive. How many slices of cake does Mother have left?"], ["Ani punya {a} permen. Ayah membelikan {b} permen, lalu {c} permen dibagikan ke teman-temannya. Berapa sisa permen Ani?", "Ani has {a} candies. Father buys {b} more, then {c} candies are shared with her friends. How many candies does Ani have left?"], ["Di kotak bekal ada {a} lembar roti. Ibu menambah {b} roti, tapi {c} roti dimakan Budi saat jam istirahat. Berapa sisa roti di kotak?", "In the lunchbox, there are {a} slices of bread. Mother adds {b} more, but {c} slices are eaten by Budi during recess. How many slices of bread are left in the box?"], ["Edo punya {a} biskuit. Ia membeli {b} biskuit lagi, tapi {c} biskuit dimakan saat menonton TV. Berapa sisa biskuit Edo?", "Edo has {a} biscuits. He buys {b} more, but {c} biscuits are eaten while watching TV. How many biscuits does Edo have left?"], ["Ayah menggoreng {a} tempe. Ayah menggoreng {b} tempe lagi, tapi {c} tempe dimakan keluarga saat makan siang. Berapa sisa tempe goreng?", "Father fries {a} tempeh. He fries {b} more, but {c} tempeh are eaten by the family during lunch. How many fried tempeh are left?"], ["Siti disiapkan {a} gelas susu. Ibu membuatkan {b} gelas susu lagi, tapi {c} gelas susu diminum. Berapa sisa gelas susu utuh?", "Siti is prepared {a} glasses of milk. Mother makes {b} more glasses, but {c} glasses are drunk. How many full glasses of milk are left?"], ["Paman membeli {a} es krim. Paman membeli {b} es krim lagi, tapi {c} es krim mencair karena panas. Berapa sisa es krim yang beku?", "Uncle buys {a} ice creams. He buys {b} more, but {c} ice creams melt because of the heat. How many frozen ice creams are left?"], ["Budi membawa {a} donat. Teman memberinya {b} donat, tapi {c} donat dimakan bersama. Berapa sisa donat Budi?", "Budi brings {a} donuts. A friend gives him {b} more, but {c} donuts are eaten together. How many donuts does Budi have left?"], ["Nenek merebus {a} telur. Nenek merebus {b} telur lagi, tapi {c} telur dimakan untuk sarapan. Berapa sisa telur rebus nenek?", "Grandma boils {a} eggs. She boils {b} more eggs, but {c} eggs are eaten for breakfast. How many boiled eggs does Grandma have left?"], ["Dina membeli {a} bungkus kerupuk. Ia membeli {b} bungkus lagi, tetapi {c} bungkus kerupuk tumpah dan kotor. Berapa sisa bungkus kerupuk yang masih bisa dimakan?", "Dina buys {a} packs of crackers. She buys {b} more packs, but {c} packs spill and get dirty. How many edible packs of crackers are left?"], ["Di toples ada {a} nastar. Ibu memasukkan {b} nastar, lalu {c} nastar dimakan kakak. Berapa sisa kue nastar di toples?", "In the jar, there are {a} nastars. Mother puts in {b} more nastars, then {c} nastars are eaten by older sibling. How many nastar cookies are left in the jar?"], ["Sinta memiliki {a} keping cokelat. Kakak memberinya {b} cokelat, lalu {c} cokelat diberikan kepada adiknya. Berapa sisa cokelat Sinta?", "Sinta has {a} pieces of chocolate. Older sibling gives her {b} more, then {c} chocolates are given to her younger sibling. How many pieces of chocolate does Sinta have left?"], ["Rio membeli {a} butir bakso. Ia membeli {b} butir bakso lagi, lalu {c} bakso dimakan. Berapa sisa bakso Rio?", "Rio buys {a} meatballs. He buys {b} more meatballs, then {c} meatballs are eaten. How many meatballs does Rio have left?"], ["Di parkiran ada {a} mobil. Datang {b} mobil baru parkir, lalu {c} mobil keluar dari parkiran. Berapa sisa mobil di sana?", "In the parking lot, there are {a} cars. {b} more cars arrive to park, then {c} cars exit the parking lot. How many cars are left there?"], ["Lita melihat {a} taksi kuning berjejer. Datang {b} taksi ikut berjejer, lalu {c} taksi melaju membawa tamu. Berapa sisa taksi yang berjejer?", "Lita sees {a} yellow taxis lined up. {b} more taxis arrive to line up, then {c} taxis drive away carrying guests. How many lined-up taxis are left?"]], "perkalian": [["Ibu membeli {a} kantong beras di pasar. Jika setiap kantong beras memiliki berat {b} kilogram, berapa total berat beras yang dibeli Ibu?", "Mother bought {a} bags of rice at the market. If each bag of rice weighs {b} kilograms, what is the total weight of the rice she bought?"], ["Adik menabung selama {a} hari penuh. Jika setiap hari ia memasukkan uang sebesar {b} rupiah ke celengannya, berapa jumlah uang tabungan Adik sekarang?", "Younger sibling has been saving for {a} full days. If they put {b} rupiah into their piggy bank every day, how much is their total savings now?"], ["Ayah membeli {a} bungkus roti tawar untuk sarapan. Setiap bungkus berisi {b} lembar roti. Berapa lembar roti seluruhnya?", "Father bought {a} packs of white bread for breakfast. Each pack contains {b} slices of bread. How many slices of bread are there in total?"], ["Ibu membuat kue bolu pandan sebanyak {a} loyang. Jika setiap loyang dipotong menjadi {b} bagian, berapa banyak potongan kue bolu seluruhnya?", "Mother made {a} pans of pandan sponge cake. If each pan is cut into {b} pieces, how many pieces of sponge cake are there in total?"], ["Doni membeli {a} kotak pensil untuk dibagikan kepada teman-temannya. Jika di dalam satu kotak terdapat {b} batang pensil, berapa banyak pensil Doni seluruhnya?", "Doni bought {a} pencil boxes to distribute to his friends. If there are {b} pencils in one box, how many pencils does Doni have in total?"], ["Di atas meja makan terdapat {a} piring gorengan. Di setiap piring diletakkan {b} buah gorengan. Berapa total gorengan yang disajikan?", "On the dining table, there are {a} plates of fried snacks. On each plate, {b} fried snacks are placed. How many fried snacks are served in total?"], ["Tukang sate membakar {a} porsi sate ayam. Jika setiap porsi berisi {b} tusuk sate, berapa total tusuk sate yang dibakar?", "The satay vendor grills {a} portions of chicken satay. If each portion contains {b} skewers of satay, how many skewers of satay are grilled in total?"], ["Ayah membeli {a} kotak lampu LED untuk mengganti lampu yang rusak. Tiap kotak berisi {b} buah bola lampu. Berapa lampu LED yang dibeli Ayah?", "Father bought {a} boxes of LED bulbs to replace broken lights. Each box contains {b} light bulbs. How many LED lights did Father buy?"], ["Kakak menyusun pakaian ke dalam lemari sebanyak {a} tumpuk. Jika setiap tumpuk berisi {b} potong pakaian, berapa total pakaian yang dirapikan Kakak?", "Older sibling arranged clothes into the wardrobe in {a} stacks. If each stack contains {b} pieces of clothing, how many clothes did they tidy up in total?"], ["Sinta membagikan {a} kotak bingkisan makanan ringan pada hari ulang tahunnya. Di dalam setiap kotak ada {b} bungkus biskuit cokelat. Berapa banyak bungkus biskuit yang dibagikan?", "On her birthday, Sinta distributed {a} gift boxes of snacks. Inside each box, there are {b} packs of chocolate biscuits. How many packs of biscuits were distributed?"], ["Di sebuah toko kue, terdapat {a} toples nastar yang dipajang. Jika masing-masing toples berisi {b} kue nastar, berapa total kue nastar di toko itu?", "In a cake shop, there are {a} jars of nastar (pineapple tarts) on display. If each jar contains {b} nastar cakes, what is the total number of nastar cakes in the shop?"], ["Seorang pedagang buah memiliki {a} keranjang mangga. Jika setiap keranjang berisi {b} buah mangga, berapa jumlah seluruh mangga milik pedagang tersebut?", "A fruit trader has {a} baskets of mangoes. If each basket contains {b} mangoes, what is the total number of mangoes owned by the trader?"], ["Ibu mencuci pakaian menggunakan mesin cuci sebanyak {a} kali siklus putaran. Jika tiap putaran memuat maksimal {b} potong pakaian, berapa total pakaian yang dicuci Ibu?", "Mother washed clothes using the washing machine for {a} cycles. If each cycle holds a maximum of {b} pieces of clothing, how many clothes did Mother wash in total?"], ["Di dalam sebuah kelas terdapat {a} baris meja siswa. Jika setiap baris diisi oleh {b} siswa, berapa jumlah seluruh siswa di kelas tersebut?", "In a classroom, there are {a} rows of student desks. If each row is filled by {b} students, what is the total number of students in the classroom?"], ["Pak Guru membawa {a} kotak kapur tulis ke ruang kelas. Setiap kotak berisi {b} batang kapur. Berapa total kapur tulis yang dibawa Pak Guru?", "The teacher brought {a} boxes of chalk to the classroom. Each box contains {b} sticks of chalk. How many pieces of chalk did the teacher bring in total?"], ["Kakak membeli {a} sisir pisang di pasar. Jika setiap sisir terdiri dari {b} buah pisang, berapa banyak buah pisang yang dibeli Kakak?", "Older sibling bought {a} bunches of bananas at the market. If each bunch consists of {b} bananas, how many bananas did they buy?"], ["Di rak sepatu terdapat {a} susun laci. Jika setiap susun memuat {b} pasang sepatu, berapa banyak pasang sepatu yang ada di rak tersebut?", "On the shoe rack, there are {a} tiers of drawers. If each tier holds {b} pairs of shoes, how many pairs of shoes are on the rack?"], ["Ayah membeli {a} dus mi instan untuk persediaan di rumah. Jika setiap dus berisi {b} bungkus mi instan, berapa banyak mi instan yang dibeli Ayah?", "Father bought {a} boxes of instant noodles for stock at home. If each box contains {b} packs of instant noodles, how many instant noodles did Father buy?"], ["Dalam satu set cangkir teh terdapat {a} buah tatakan piring kecil. Jika Ibu membeli {b} set cangkir teh, berapa banyak tatakan piring kecil seluruhnya?", "In one teacup set, there are {a} small saucers. If Mother buys {b} teacup sets, how many small saucers are there in total?"], ["Ibu memotong gulungan kain untuk membuat tirai jendela sebanyak {a} helai. Jika tiap helai kain panjangnya {b} meter, berapa meter total kain yang digunakan?", "Mother cut rolls of fabric to make window curtains into {a} sheets. If each sheet of fabric is {b} meters long, how many meters of fabric were used in total?"], ["Sebuah rumah makan menyediakan {a} meja makan. Jika setiap meja dilengkapi dengan {b} buah kursi, berapa kapasitas total kursi di rumah makan tersebut?", "A restaurant provides {a} dining tables. If each table is equipped with {b} chairs, what is the total capacity of chairs in the restaurant?"], ["Budi memesan {a} kotak piza ukuran besar. Jika masing-masing kotak berisi {b} potong piza, berapa total potong piza seluruhnya?", "Budi ordered {a} large pizza boxes. If each box contains {b} slices of pizza, how many total slices of pizza are there?"], ["Petugas kebersihan kompleks mengambil air menggunakan {a} ember penuh. Jika volume setiap ember adalah {b} liter, berapa liter air yang digunakan?", "The complex janitor fetched water using {a} full buckets. If the volume of each bucket is {b} liters, how many liters of water were used?"], ["Kakek harus meminum suplemen vitamin rutin selama {a} hari. Jika dalam satu hari ia disarankan minum {b} butir kapsul, berapa butir kapsul yang dihabiskan Kakek?", "Grandfather has to take routine vitamin supplements for {a} days. If he is advised to take {b} capsules in one day, how many capsules will Grandfather finish?"], ["Seorang anak membeli {a} bungkus permen. Jika setiap bungkus berisi {b} butir permen, berapa jumlah seluruh permen yang dibeli anak tersebut?", "A child bought {a} packs of candy. If each pack contains {b} candies, what is the total number of candies bought by the child?"], ["Ibu membeli {a} ikat bayam di tukang sayur. Jika setiap ikat bayam harganya {b} rupiah, berapa total uang yang harus dibayar Ibu?", "Mother bought {a} bunches of spinach from the vegetable vendor. If each bunch of spinach costs {b} rupiah, how much money does Mother have to pay in total?"], ["Kakak merapikan koleksi buku ceritanya ke dalam {a} rak buku. Jika masing-masing rak dapat memuat {b} buku, berapa kapasitas maksimal buku yang bisa ditampung?", "Older sibling neatly arranged their collection of storybooks into {a} bookshelves. If each shelf can hold {b} books, what is the maximum capacity of books that can be accommodated?"], ["Di sebuah minimarket, petugas merapikan {a} baris sabun mandi di etalase. Setiap baris terdiri dari {b} sabun mandi. Berapa jumlah sabun mandi yang dirapikan?", "In a minimarket, the staff organized {a} rows of bath soap on the display window. Each row consists of {b} bars of soap. How many bars of soap were organized?"], ["Di tempat parkir minimarket, terdapat {a} baris khusus sepeda motor. Jika setiap baris maksimal bisa menampung {b} sepeda motor, berapa kapasitas total parkir motor tersebut?", "In the minimarket parking lot, there are {a} rows designated for motorcycles. If each row can accommodate a maximum of {b} motorcycles, what is the total capacity of the motorcycle parking?"], ["Guru olahraga memerintahkan siswa untuk berlari mengelilingi lapangan sebanyak {a} putaran. Jika panjang lintasan satu putaran adalah {b} meter, berapa meter jarak total lari tersebut?", "The sports teacher ordered the students to run around the field for {a} laps. If the length of one lap is {b} meters, how many meters is the total running distance?"], ["Seorang kurir mengirimkan {a} paket ke sebuah alamat rumah. Jika setiap paket memiliki berat {b} kilogram, berapa berat total paket yang dibawa kurir?", "A courier delivered {a} packages to a home address. If each package weighs {b} kilograms, what is the total weight of the packages carried by the courier?"], ["Sebuah toko alat tulis menjual {a} pak buku tulis. Jika satu pak berisi {b} buku, berapa banyak buku tulis seluruhnya?", "A stationery shop sells {a} packs of notebooks. If one pack contains {b} books, how many notebooks are there in total?"], ["Panitia arisan keluarga menyediakan {a} kotak kue kotak (snack box). Jika setiap kotak berisi {b} macam kue, berapa total kue yang disediakan?", "The family gathering committee provided {a} snack boxes. If each box contains {b} types of cakes, how many cakes are provided in total?"], ["Barista kedai kopi meracik {a} gelas es kopi susu. Setiap gelas membutuhkan {b} mililiter sirup gula. Berapa mililiter sirup yang digunakan seluruhnya?", "The coffee shop barista mixed {a} glasses of iced coffee milk. Each glass requires {b} milliliters of sugar syrup. How many milliliters of syrup were used in total?"], ["Ibu membeli {a} papan telur ayam di supermarket. Jika setiap papan berisi {b} butir telur, berapa banyak telur ayam yang dibeli Ibu?", "Mother bought {a} trays of chicken eggs at the supermarket. If each tray contains {b} eggs, how many chicken eggs did Mother buy?"], ["Untuk acara makan malam keluarga, Bibi memasak {a} ekor ayam goreng. Jika setiap ekor ayam dipotong menjadi {b} bagian, berapa banyak potongan ayam goreng yang tersedia?", "For a family dinner, Aunt cooked {a} fried chickens. If each chicken is cut into {b} pieces, how many pieces of fried chicken are available?"], ["Kakak menempelkan prangko pada {a} buah amplop surat. Jika setiap amplop membutuhkan {b} lembar prangko, berapa banyak prangko yang digunakan Kakak?", "Older sibling stuck stamps on {a} mailing envelopes. If each envelope requires {b} stamps, how many stamps did they use?"], ["Sebuah bus kota dapat mengangkut {a} baris kursi penumpang. Jika setiap baris terdiri dari {b} kursi, berapa jumlah total kursi penumpang di dalam bus tersebut?", "A city bus can accommodate {a} rows of passenger seats. If each row consists of {b} seats, what is the total number of passenger seats inside the bus?"], ["Di sebuah ruang pertemuan, panitia menyusun {a} baris kursi untuk peserta. Setiap baris disediakan {b} buah kursi. Berapa banyak kursi seluruhnya?", "In a meeting room, the committee arranged {a} rows of chairs for participants. Each row is provided with {b} chairs. How many chairs are there in total?"], ["Adik menyusun balok mainan menjadi {a} menara. Jika setiap menara terdiri dari {b} balok kecil, berapa jumlah seluruh balok mainan yang digunakan Adik?", "Younger sibling assembled toy blocks into {a} towers. If each tower consists of {b} small blocks, what is the total number of toy blocks used?"]], "pembagian": [["Ibu membagikan uang sebanyak {a} rupiah secara merata kepada {b} anaknya untuk uang jajan. Berapa rupiah uang jajan yang diterima oleh setiap anak?", "Mother distributed {a} rupiah evenly among her {b} children for pocket money. How many rupiah of pocket money did each child receive?"], ["Adik membeli {a} buah permen dan ingin membagikannya sama banyak kepada {b} orang temannya. Berapa butir permen yang didapatkan oleh setiap teman Adik?", "Younger sibling bought {a} candies and wants to distribute them equally among {b} friends. How many candies does each friend get?"], ["Di dalam sebuah kardus terdapat {a} buah mangga. Jika semua mangga tersebut akan dimasukkan sama rata ke dalam {b} buah keranjang, berapa buah mangga di setiap keranjang?", "There are {a} mangoes in a cardboard box. If all the mangoes are to be placed equally into {b} baskets, how many mangoes are in each basket?"], ["Ayah membeli {a} lembar roti tawar untuk sarapan {b} orang anggota keluarga. Jika setiap orang mendapat bagian yang sama, berapa lembar roti yang dimakan setiap orang?", "Father bought {a} slices of white bread for breakfast for {b} family members. If each person gets an equal share, how many slices of bread does each person eat?"], ["Sebuah tali jemuran yang panjangnya {a} meter dipotong menjadi {b} bagian yang sama panjang. Berapa meter panjang setiap potongan tali tersebut?", "A clothesline with a length of {a} meters is cut into {b} equal parts. How many meters long is each piece of the rope?"], ["Kakak memiliki {a} butir kelereng yang ingin disimpan ke dalam {b} kotak kecil dengan jumlah yang sama. Berapa butir kelereng yang ada di setiap kotak?", "Older sibling has {a} marbles and wants to store them equally in {b} small boxes. How many marbles are in each box?"], ["Ibu membuat kue bolu yang kemudian dipotong-potong menjadi {a} bagian sama besar. Kue tersebut diletakkan merata di atas {b} buah piring. Berapa potong kue di setiap piring?", "Mother made a sponge cake which was then cut into {a} equal pieces. The cake pieces were placed equally on {b} plates. How many pieces of cake are on each plate?"], ["Sebuah dispenser berisi {a} liter air matang. Air tersebut akan dituang habis ke dalam {b} buah botol minum berukuran sama sampai penuh. Berapa liter kapasitas setiap botol minum?", "A dispenser contains {a} liters of drinking water. The water will be poured completely into {b} identical water bottles until they are full. What is the capacity in liters of each water bottle?"], ["Seorang pedagang buah menyusun {a} buah apel secara merata ke dalam {b} baris di etalase tokonya. Berapa buah apel yang ada pada setiap baris?", "A fruit trader arranges {a} apples evenly into {b} rows on the shop display window. How many apples are there in each row?"], ["Panitia arisan menyediakan {a} buah gorengan yang akan disajikan merata di atas {b} buah piring saji. Berapa total gorengan yang ada di setiap piring?", "The social gathering committee provided {a} fried snacks to be served equally on {b} serving plates. What is the total number of fried snacks on each plate?"], ["Ayah membeli persediaan {a} bungkus mi instan untuk konsumsi selama {b} minggu. Jika setiap minggu menghabiskan jumlah yang sama, berapa bungkus mi instan yang dimasak per minggu?", "Father bought a supply of {a} packs of instant noodles to be consumed over {b} weeks. If they consume the same amount each week, how many packs of instant noodles are cooked per week?"], ["Sinta membagikan {a} potong kue ulang tahun kepada {b} orang sahabatnya sama banyak. Berapa potong kue yang diterima oleh setiap sahabat Sinta?", "Sinta distributed {a} pieces of birthday cake equally among her {b} close friends. How many pieces of cake did each of Sinta's friends receive?"], ["Di sebuah tempat parkir, terdapat {a} sepeda motor yang diparkir rapi dalam {b} barisan sama panjang. Berapa banyak sepeda motor di setiap barisnya?", "In a parking lot, there are {a} motorcycles parked neatly in {b} rows of equal length. How many motorcycles are in each row?"], ["Pak Guru membawa {a} batang kapur tulis dan membagikannya secara merata kepada {b} ketua kelas. Berapa batang kapur tulis yang didapat oleh setiap ketua kelas?", "The teacher brought {a} sticks of chalk and distributed them evenly to {b} class captains. How many sticks of chalk did each class captain get?"], ["Sebuah bus kota mengangkut {a} orang penumpang. Di dalam bus terdapat {b} baris kursi kosong yang diisi penumpang dengan jumlah yang sama tiap barisnya. Berapa orang yang duduk di setiap baris?", "A city bus carries {a} passengers. Inside the bus, there are {b} rows of empty seats filled by passengers in equal numbers per row. How many people are sitting in each row?"], ["Budi memesan piza yang berisikan {a} potongan. Piza tersebut akan dimakan bersama oleh {b} orang temannya secara adil. Berapa potong piza yang didapatkan oleh setiap orang?", "Budi ordered a pizza containing {a} slices. The pizza will be shared equally among {b} friends. How many slices of pizza does each person get?"], ["Petugas kebersihan menyiram tanaman menggunakan {a} liter air yang diambil dari {b} buah ember penuh berkapasitas sama. Berapa liter air yang ada di dalam setiap ember?", "The janitor waters the plants using {a} liters of water taken from {b} full buckets of equal capacity. How many liters of water are inside each bucket?"], ["Kakek membeli {a} butir kapsul vitamin untuk dihabiskan selama {b} hari secara teratur. Berapa butir kapsul yang harus diminum Kakek setiap harinya?", "Grandfather bought {a} vitamin capsules to be taken regularly over {b} days. How many capsules must Grandfather take each day?"], ["Ibu membeli {a} ikat bayam di pasar seharga total {b} rupiah. Jika setiap ikat bayam memiliki harga yang sama, berapa rupiah harga satu ikat bayam tersebut?", "Mother bought {a} bunches of spinach at the market for a total of {b} rupiah. If each bunch of spinach costs the same, how many rupiah is the price of one bunch of spinach?"], ["Kakak menata {a} buah buku cerita miliknya ke dalam {b} susun rak buku sama banyak. Berapa kapasitas buku yang bisa ditampung pada setiap susun rak?", "Older sibling arranged {a} storybooks onto {b} tiers of bookshelves equally. What is the book capacity that can be accommodated on each tier?"], ["Di sebuah minimarket, petugas menyusun {a} sabun mandi secara merata ke dalam {b} baris di etalase. Berapa jumlah sabun mandi pada setiap barisnya?", "In a minimarket, the staff organized {a} bars of bath soap evenly into {b} rows on the display window. What is the number of bath soaps in each row?"], ["Seorang kurir membawa paket dengan berat total {a} kilogram. Paket tersebut dibagi ke dalam {b} buah kantong pengiriman sama berat. Berapa kilogram berat setiap kantong pengiriman?", "A courier carries packages with a total weight of {a} kilograms. The packages are divided into {b} delivery bags of equal weight. How many kilograms does each delivery bag weigh?"], ["Sebuah toko alat tulis menjual satu pak buku tulis berisi {a} buah buku dengan harga total {b} rupiah. Berapa rupiah harga untuk satu buah buku tulis tersebut?", "A stationery shop sells a pack of notebooks containing {a} books for a total price of {b} rupiah. How many rupiah is the price for one notebook?"], ["Panitia bakti sosial menyediakan {a} kilogram beras untuk dibagikan merata kepada {b} kepala keluarga yang membutuhkan. Berapa kilogram beras yang didapat setiap kepala keluarga?", "The charity committee provided {a} kilograms of rice to be distributed evenly to {b} families in need. How many kilograms of rice did each family get?"], ["Barista menggunakan {a} mililiter sirup gula untuk meracik {b} gelas es kopi susu dengan takaran yang sama. Berapa mililiter sirup gula yang digunakan untuk setiap gelas kopi?", "The barista used {a} milliliters of sugar syrup to mix {b} glasses of iced coffee milk with the same measurement. How many milliliters of sugar syrup were used for each glass of coffee?"], ["Untuk acara makan malam keluarga, Bibi memotong beberapa ekor ayam menjadi {a} potongan ayam goreng. Potongan ayam tersebut disajikan merata pada {b} buah wadah. Berapa potongan ayam di setiap wadah?", "For a family dinner, Aunt cut some chickens into {a} pieces of fried chicken. The chicken pieces were served equally in {b} containers. How many pieces of chicken are in each container?"], ["Kakak menempelkan {a} lembar prangko secara merata pada {b} buah amplop surat yang akan dikirim. Berapa lembar prangko yang ditempelkan pada setiap amplop?", "Older sibling stuck {a} stamps evenly onto {b} mailing envelopes to be sent. How many stamps were stuck on each envelope?"], ["Adik menyusun {a} balok mainan kayu menjadi {b} buah menara dengan tinggi yang sama. Berapa jumlah balok mainan yang digunakan pada setiap menara?", "Younger sibling assembled {a} wooden toy blocks into {b} towers of equal height. What is the number of toy blocks used in each tower?"], ["Sebuah keluarga menghabiskan {a} kg beras dalam waktu {b} hari. Berapa kilogram rata-rata konsumsi beras keluarga tersebut per harinya?", "A family consumes {a} kg of rice within {b} days. What is the average daily rice consumption of the family in kilograms?"], ["Seorang anak memiliki {a} buah koin kuno dan ingin menyimpannya ke dalam {b} buah album koin sama banyak. Berapa koin yang ada di setiap album?", "A child has {a} ancient coins and wants to store them equally into {b} coin albums. How many coins are in each album?"], ["Petani memanen sawi dan memasukkan total {a} ikat sawi ke dalam {b} buah keranjang bambu sama banyak. Berapa ikat sawi yang ada di dalam setiap keranjang?", "A farmer harvested spinach and put a total of {a} bunches of spinach into {b} bamboo baskets equally. How many bunches of spinach are inside each basket?"], ["Dalam sebuah ujian, seorang siswa harus menjawab {a} butir soal dalam waktu {b} menit. Jika waktu untuk setiap soal dibagi rata, berapa menit waktu yang dialokasikan untuk satu soal?", "In an exam, a student must answer {a} questions within {b} minutes. If the time for each question is divided equally, how many minutes are allocated for one question?"], ["Ibu membeli {a} buah telur ayam yang dikemas dalam {b} papan telur dengan isi yang sama. Berapa banyak telur ayam yang ada di setiap papan?", "Mother bought {a} chicken eggs packaged in {b} egg trays with equal contents. How many chicken eggs are there on each tray?"], ["Sebuah perusahaan membagikan {a} stel seragam kerja baru kepada {b} divisi operasionalnya sama rata. Berapa stel seragam yang didapatkan oleh setiap divisi?", "A company distributed {a} sets of new work uniforms equally to its {b} operational divisions. How many sets of uniforms did each division get?"], ["Sekretaris mencetak laporan bulanan sebanyak {a} halaman yang dibagi habis ke dalam {b} buah map dokumen sama tebal. Berapa halaman laporan di setiap map?", "The secretary printed a monthly report of {a} pages which was divided completely into {b} document folders of equal thickness. How many pages of the report are in each folder?"], ["Sebuah mesin printer dapat mencetak {a} lembar kertas dokumen dalam waktu {b} menit. Berapa lembar kertas yang dapat dicetak printer tersebut dalam satu menit?", "A printer machine can print {a} sheets of document paper within {b} minutes. How many sheets of paper can the printer print in one minute?"], ["Tukang jahit membutuhkan {a} buah kancing untuk dipasang secara merata pada {b} helai kemeja seragam. Berapa buah kancing yang dijahit pada setiap kemeja?", "A tailor needs {a} buttons to be attached evenly onto {b} uniform shirts. How many buttons are sewn onto each shirt?"], ["Panitia maraton menyediakan {a} botol air mineral yang didistribusikan sama banyak ke {b} titik pos minum. Berapa botol air minum yang tersedia di setiap pos?", "The marathon committee provided {a} bottles of mineral water distributed equally to {b} hydration stations. How many bottles of water are available at each station?"], ["Seorang programer menulis {a} baris kode program yang dibagi secara merata ke dalam {b} buah modul aplikasi. Berapa baris kode yang ada di setiap modul?", "A programmer wrote {a} lines of code divided evenly into {b} application modules. How many lines of code are in each module?"], ["Dalam sebuah kompetisi catur, panitia menyediakan {a} buah bidak catur untuk diletakkan sama banyak di atas {b} meja pertandingan. Berapa buah bidak catur yang ada di setiap meja?", "In a chess competition, the committee provided {a} chess pieces to be placed equally on {b} match tables. How many chess pieces are on each match table?"]], "kali_bagi": [["Ibu membeli {a} kotak kue untuk acara keluarga. Jika setiap kotak berisi {b} potong kue, dan kue tersebut akan dibagikan sama rata kepada {c} orang tamu, berapa potong kue yang didapat setiap tamu?", "Mother bought {a} boxes of cakes for a family event. If each box contains {b} pieces of cake, and the cakes are to be distributed equally among {c} guests, how many pieces of cake does each guest get?"], ["Adik menabung selama {a} hari berturut-turut. Setiap hari ia memasukkan uang sebesar {b} rupiah ke celengannya. Jika total uang tabungan tersebut kemudian dibagi rata untuk dibelikan {c} buah buku tulis, berapa rupiah harga satu buku tulisnya?", "Younger sibling saved money for {a} consecutive days. Every day they put {b} rupiah into their piggy bank. If the total savings are then divided equally to buy {c} notebooks, how many rupiah is the price of one notebook?"], ["Ayah membeli {a} dus mi instan untuk stok dapur. Setiap dus berisi {b} bungkus mi instan. Jika seluruh mi instan tersebut habis dikonsumsi bersama oleh keluarga dalam waktu {c} minggu dengan jumlah yang sama tiap minggunya, berapa bungkus mi instan yang dihabiskan per minggu?", "Father bought {a} boxes of instant noodles for kitchen stock. Each box contains {b} packs of instant noodles. If all the instant noodles are consumed equally by the family over {c} weeks, how many packs of instant noodles are consumed per week?"], ["Sebuah warung makan memesan {a} krat telur ayam. Jika setiap krat berisi {b} butir telur, dan telur-telur tersebut akan dibagi habis untuk bahan membuat {c} loyang martabak besar dengan porsi telur yang sama, berapa butir telur yang dibutuhkan untuk satu loyang martabak?", "A food stall ordered {a} crates of chicken eggs. If each crate contains {b} eggs, and the eggs are to be used completely to make {c} pans of large martabak with the same portion of eggs, how many eggs are needed for one pan of martabak?"], ["Di sebuah acara ulang tahun, panitia menyediakan {a} meja panjang untuk anak-anak. Di setiap meja diletakkan {b} buah gorengan. Jika seluruh gorengan itu dibagikan sama banyak kepada {c} anak yang hadir, berapa buah gorengan yang didapatkan setiap anak?", "At a birthday party, the committee provided {a} long tables for children. On each table, {b} fried snacks were placed. If all the fried snacks are distributed equally among the {c} children present, how many fried snacks does each child get?"], ["Kakak membeli {a} pack pulpen untuk keperluan kantor. Satu pack berisi {b} batang pulpen. Pulpen tersebut akan dibagikan merata kepada {c} orang karyawan baru. Berapa batang pulpen yang diterima oleh setiap karyawan?", "Older sibling bought {a} packs of pens for office needs. One pack contains {b} pens. The pens are to be distributed equally to {c} new employees. How many pens does each employee receive?"], ["Sebuah toko kue memajang {a} toples nastar. Masing-masing toples berisi {b} kue nastar. Jika semua kue nastar tersebut ingin dikemas ulang secara merata ke dalam {c} buah kotak bingkisan kecil, berapa kue nastar yang ada di setiap kotak?", "A cake shop displays {a} jars of nastar (pineapple tarts). Each jar contains {b} nastar cakes. If all the nastar cakes are to be repackaged equally into {c} small gift boxes, how many nastar cakes will be in each box?"], ["Seorang pedagang buah memiliki {a} keranjang mangga. Setiap keranjang berisi {b} buah mangga. Pedagang tersebut ingin membagi seluruh mangga ke dalam {c} buah kantong plastik sama banyak untuk dijual eceran. Berapa buah mangga isi setiap kantong plastik?", "A fruit trader has {a} baskets of mangoes. Each basket contains {b} mangoes. The trader wants to divide all the mangoes equally into {c} plastic bags for retail sale. How many mangoes are inside each plastic bag?"], ["Ibu mencuci pakaian menggunakan mesin cuci sebanyak {a} kali siklus putaran dalam seminggu. Jika tiap putaran memuat maksimal {b} potong pakaian, dan seluruh pakaian tersebut setelah bersih ditata merata ke dalam {c} susun laci lemari, berapa potong pakaian di setiap susun laci?", "Mother washes clothes using the washing machine {a} times a week. If each cycle holds a maximum of {b} pieces of clothing, and all the clean clothes are arranged equally into {c} wardrobe drawers, how many pieces of clothing are in each drawer?"], ["Di dalam sebuah sekolah terdapat {a} ruang kelas baru. Setiap kelas disediakan {b} unit meja siswa. Jika seluruh meja tersebut dikirim menggunakan {c} unit mobil boks logistik dengan muatan yang sama rata, berapa unit meja yang diangkut oleh setiap mobil boks?", "In a school, there are {a} new classrooms. Each classroom is provided with {b} student desks. If all the desks are delivered using {c} logistics box trucks with equal loads, how many desks are carried by each box truck?"], ["Pak Guru membawa {a} kotak kapur tulis ke sekolah. Setiap kotak berisi {b} batang kapur. Jika kapur-kapur tersebut dibagikan sama banyak kepada {c} orang guru kelas, berapa batang kapur tulis yang didapat oleh setiap guru?", "The teacher brought {a} boxes of chalk to school. Each box contains {b} sticks of chalk. If the chalks are distributed equally to {c} classroom teachers, how many sticks of chalk does each teacher get?"], ["Kakak membeli {a} sisir pisang di pasar untuk dibagikan. Jika setiap sisir terdiri dari {b} buah pisang, dan pisang-pisang tersebut dibagikan merata kepada {c} ekor monyet di kebun binatang, berapa buah pisang yang didapatkan setiap monyet?", "Older sibling bought {a} bunches of bananas at the market to share. If each bunch consists of {b} bananas, and the bananas are distributed equally to {c} monkeys at the zoo, how many bananas does each monkey get?"], ["Di sebuah rumah makan terdapat {a} buah meja makan besar. Jika setiap meja dilengkapi dengan {b} buah kursi penonton, dan seluruh kursi tersebut akan disusun ulang secara merata ke dalam {c} barisan ruang pertemuan, berapa kursi yang ada di setiap barisnya?", "In a restaurant, there are {a} large dining tables. If each table is equipped with {b} chairs, and all the chairs are to be rearranged equally into {c} rows in a meeting room, how many chairs will be in each row?"], ["Budi memesan {a} kotak piza ukuran besar untuk pesta kecil. Masing-masing kotak berisi {b} potong piza. Piza tersebut akan dimakan bersama secara merata oleh {c} orang temannya yang datang. Berapa potong piza yang didapatkan oleh setiap orang?", "Budi ordered {a} large pizza boxes for a small party. Each box contains {b} slices of pizza. The pizza will be eaten together equally by the {c} friends who come. How many slices of pizza does each person get?"], ["Petugas kebersihan kompleks menyiram taman dengan mengambil air menggunakan {a} ember penuh. Volume setiap ember adalah {b} liter. Jika seluruh air tersebut habis digunakan untuk menyiram {c} petak tanaman bunga sama rata, berapa liter air yang didapatkan oleh setiap petak tanaman?", "The complex janitor waters the garden by fetching water using {a} full buckets. The volume of each bucket is {b} liters. If all the water is used up to water {c} plots of flower plants equally, how many liters of water does each plant plot get?"], ["Kakek membeli suplemen vitamin sebanyak {a} botol. Setiap botol berisi {b} butir kapsul. Jika Kakek berniat menghabiskan seluruh suplemen tersebut dalam waktu {c} hari dengan dosis harian yang sama, berapa butir kapsul yang harus diminum Kakek setiap harinya?", "Grandfather bought {a} bottles of vitamin supplements. Each bottle contains {b} capsules. If Grandfather intends to finish all the supplements within {c} days with the same daily dose, how many capsules must Grandfather take each day?"], ["Seorang anak membeli {a} bungkus permen. Setiap bungkus berisi {b} butir permen. Permen-permen tersebut kemudian dimasukkan dan dibagi rata ke dalam {c} buah kantong kecil untuk dibagikan saat bermain. Berapa butir permen yang ada di setiap kantong kecil?", "A child bought {a} packs of candy. Each pack contains {b} candies. The candies are then put and divided equally into {c} small bags to be distributed while playing. How many candies are in each small bag?"], ["Ibu membeli {a} ikat bayam di tukang sayur dengan harga setiap ikatnya {b} rupiah. Jika Ibu membayar menggunakan {c} lembar uang kertas pecahan yang sama nilainya dan tidak ada kembalian, berapa rupiah nilai nominal satu lembar uang kertas yang digunakan Ibu?", "Mother bought {a} bunches of spinach from the vegetable vendor at a price of {b} rupiah per bunch. If Mother pays using {c} paper banknotes of the exact same value and there is no change, how many rupiah is the nominal value of one banknote used by Mother?"], ["Kakak merapikan koleksi buku ceritanya yang berjumlah {a} tumpuk. Masing-masing tumpuk terdiri dari {b} buku. Jika Kakak ingin menyusun semua buku tersebut secara merata ke dalam {c} tingkatan rak buku, berapa kapasitas buku di setiap tingkatan rak?", "Older sibling tidied up their collection of storybooks which consists of {a} stacks. Each stack contains {b} books. If they want to arrange all the books equally into {c} tiers of bookshelves, what is the book capacity on each tier?"], ["Di sebuah etalase minimarket, petugas merapikan {a} lusin sabun mandi. Satu lusin berisi {b} buah sabun. Sabun-sabun tersebut dipajang merata pada {c} baris etalase. Berapa buah sabun mandi yang ada di setiap baris?", "In a minimarket window, the staff organized {a} dozen bars of bath soap. One dozen contains {b} bars of soap. The soaps are displayed equally on {c} display rows. How many bars of bath soap are in each row?"], ["Di tempat parkir pusat perbelanjaan, terdapat {a} baris khusus sepeda motor. Setiap baris maksimal bisa menampung {b} sepeda motor. Jika seluruh sepeda motor yang parkir tersebut dipindahkan merata ke {c} area parkir darurat yang baru, berapa motor kapasitas setiap area darurat?", "In the shopping center parking lot, there are {a} rows designated for motorcycles. Each row can hold a maximum of {b} motorcycles. If all the parked motorcycles are moved equally to {c} new emergency parking areas, what is the motorcycle capacity of each emergency area?"], ["Guru olahraga memerintahkan muridnya melakukan lompat tali. Jika ada {a} kelompok siswa yang masing-masing melakukan lompatan sebanyak {b} kali, dan akumulasi seluruh lompatan tersebut dibagi rata kepada {c} orang siswa sebagai nilai rata-rata, berapa kali lompatan nilai rata-rata satu orang siswa?", "The sports teacher ordered the students to do jump rope. If there are {a} groups of students, each performing the jump {b} times, and the accumulation of all jumps is divided equally among {c} students as an average score, how many jumps is the average score for one student?"], ["Seorang kurir mengirimkan {a} koli paket ke sebuah gudang logistik. Setiap koli memiliki berat {b} kilogram. Jika seluruh paket tersebut diangkut secara merata menggunakan {c} buah gerobak dorong, berapa kilogram beban paket pada setiap gerobak?", "A courier delivered {a} packages to a logistics warehouse. Each package weighs {b} kilograms. If all the packages are transported equally using {c} handcarts, how many kilograms is the package load on each handcart?"], ["Sebuah toko alat tulis menjual {a} pak buku tulis. Satu pak berisi {b} buku. Jika seluruh buku tulis tersebut dibeli secara kolektif oleh {c} orang siswa dengan iuran sama banyak, berapa buah buku tulis yang diperoleh setiap siswa?", "A stationery shop sells {a} packs of notebooks. One pack contains {b} books. If all the notebooks are bought collectively by {c} students with equal contributions, how many notebooks does each student get?"], ["Panitia arisan keluarga menyediakan {a} kotak makanan (snack box). Setiap kotak berisi {b} macam kue. Jika semua kue dikeluarkan dan dibagi merata ke dalam {c} piring besar di atas meja, berapa macam kue yang ada di setiap piring?", "The family gathering committee provided {a} snack boxes. Each box contains {b} types of cakes. If all the cakes are taken out and divided equally into {c} large plates on the table, how many types of cakes are on each plate?"], ["Barista kedai kopi meracik {a} teko besar es kopi susu. Setiap teko membutuhkan {b} mililiter sirup gula aren. Jika seluruh kopi dari teko tersebut dituangkan sama rata ke dalam {c} gelas pesanan pelanggan, berapa mililiter sirup gula yang terkandung dalam setiap gelas?", "The coffee shop barista mixed {a} large pots of iced coffee milk. Each pot requires {b} milliliters of palm sugar syrup. If all the coffee from the pots is poured equally into {c} glasses ordered by customers, how many milliliters of sugar syrup are contained in each glass?"], ["Ibu membeli {a} papan telur ayam di supermarket. Setiap papan berisi {b} butir telur. Telur-telur tersebut digunakan habis untuk membuat kue sebanyak {c} adonan dengan takaran yang sama. Berapa butir telur yang dibutuhkan untuk setiap adonan kue?", "Mother bought {a} trays of chicken eggs at the supermarket. Each tray contains {b} eggs. The eggs are completely used to make {c} batches of cake batter with the same measurement. How many eggs are needed for each cake batter?"], ["Untuk acara makan malam bersama, Bibi memasak {a} ekor ayam utuh. Setiap ekor ayam dipotong menjadi {b} bagian. Jika seluruh potongan ayam goreng tersebut disajikan merata di atas {c} piring saji, berapa banyak potongan ayam yang tersedia di setiap piring?", "For a dinner gathering, Aunt cooked {a} whole chickens. Each chicken is cut into {b} pieces. If all the fried chicken pieces are served equally on {c} serving plates, how many pieces of chicken are available on each plate?"], ["Kakak menempelkan prangmo pada {a} lembar surat koleksi. Setiap lembar membutuhkan {b} buah prangmo. Jika seluruh prangmo tersebut diambil merata dari {c} buah lembar lembar koleksi prangmo baru (sheet), berapa buah prangmo yang diambil dari setiap sheet?", "Older sibling stuck stamps on {a} sheets of collection letters. Each sheet requires {b} stamps. If all the stamps are taken equally from {c} sheets of new stamp collection sheets, how many stamps are taken from each sheet?"], ["Sebuah bus kota memiliki {a} baris kursi penumpang. Setiap baris terdiri dari {b} kursi. Jika seluruh kapasitas kursi tersebut dibagi merata untuk {c} rombongan studi banding, berapa kursi jatah untuk masing-masing rombongan?", "A city bus has {a} rows of passenger seats. Each row consists of {b} seats. If the entire seat capacity is divided equally for {c} study tour groups, how many seats are allotted for each group?"], ["Di sebuah ruang pertemuan, panitia menyusun {a} deret kursi untuk peserta. Setiap deret disediakan {b} buah kursi. Jika seluruh kursi itu akan dipindahkan merata ke dalam {c} ruangan kelas yang lebih kecil, berapa kursi yang didapat setiap kelas?", "In a meeting room, the committee arranged {a} rows of chairs for participants. Each row is provided with {b} chairs. If all the chairs are to be moved equally into {c} smaller classrooms, how many chairs does each class get?"], ["Adik menyusun balok mainan menjadi {a} buah menara. Setiap menara terdiri dari {b} balok kecil. Jika adik ingin membongkar seluruh menara tersebut dan menyusun baloknya kembali menjadi {c} buah robot mainan sama besar, berapa balok kecil yang dibutuhkan untuk membuat satu robot?", "Younger sibling assembled toy blocks into {a} towers. Each tower consists of {b} small blocks. If they want to dismantle all the towers and reassemble the blocks into {c} identical toy robots, how many small blocks are needed to make one robot?"], ["Petani memanen sawi dan memasukkannya ke dalam {a} keranjang bambu. Tiap keranjang memuat {b} ikat sawi. Seluruh hasil panen tersebut dibeli merata oleh {c} orang pedagang sayur keliling. Berapa ikat sawi yang dibeli oleh setiap pedagang sayur?", "A farmer harvested spinach and put them into {a} bamboo baskets. Each basket holds {b} bunches of spinach. The entire harvest was bought equally by {c} mobile vegetable vendors. How many bunches of spinach were bought by each vendor?"], ["Seorang penjahit menerima pesanan pembuatan {a} kemeja seragam sekolah. Setiap kemeja membutuhkan {b} buah kancing baju. Kancing-kancing tersebut diambil habis secara merata dari {c} kotak penyimpanan kancing. Berapa buah kancing yang diambil dari setiap kotak?", "A tailor received an order to make {a} school uniform shirts. Each shirt requires {b} clothing buttons. The buttons are taken completely and equally from {c} button storage boxes. How many buttons are taken from each box?"], ["Paman menaikkan {a} tumpuk genteng baru ke atas atap rumah. Setiap tumpuk berisi {b} buah genteng tanah liat. Genteng tersebut dipasang rata pada {c} sisi atap rumah. Berapa buah genteng yang terpasang di setiap sisi atap?", "Uncle raised {a} stacks of new roof tiles onto the house roof. Each stack contains {b} clay roof tiles. The tiles are installed equally on {c} sides of the house roof. How many roof tiles are installed on each side?"], ["Tante membuat bingkisan parsel sebanyak {a} keranjang untuk hari raya. Setiap keranjang diisi dengan {b} botol sirup rasa jeruk. Jika seluruh botol sirup tersebut dibeli merata dari {c} buah grosir toko kelontong, berapa botol sirup yang dibeli dari setiap grosir?", "Aunt made {a} gift baskets for the holiday. Each basket is filled with {b} bottles of orange-flavored syrup. If all the syrup bottles were bought equally from {c} grocery wholesalers, how many bottles of syrup were bought from each wholesaler?"], ["Bibi menata koleksi sepatunya ke dalam {a} buah rak sepatu. Setiap rak memiliki {b} susun laci yang masing-masing memuat satu pasang sepatu. Jika seluruh pasang sepatu itu ingin ditata ulang merata ke dalam {c} lemari kaca yang baru, berapa pasang sepatu yang muat di setiap lemari kaca?", "Aunt arranged her shoe collection into {a} shoe racks. Each rack has {b} tiers of drawers, each holding one pair of shoes. If all the pairs of shoes are to be rearranged equally into {c} new glass cabinets, how many pairs of shoes will fit in each glass cabinet?"], ["Sebuah perkebunan kelapa sawit memanen {a} blok lahan. Setiap blok menghasilkan {b} tandan buah segar. Jika seluruh tandan buah sawit dipindahkan menggunakan {c} armada truk logistik dengan muatan yang sama, berapa tandan buah sawit yang diangkut setiap truk?", "A palm oil plantation harvested {a} blocks of land. Each block produces {b} fresh fruit bunches. If all the palm fruit bunches are moved using {c} fleets of logistics trucks with equal loads, how many palm fruit bunches are carried by each truck?"], ["Koki di restoran memesan {a} krat telur ayam matang. Setiap krat berisi {b} butir telur. Telur-telur tersebut dialokasikan sama rata untuk hidangan pendamping {c} porsi nasi goreng spesial. Berapa butir telur yang menjadi hiasan di setiap porsi nasi goreng?", "The chef at the restaurant ordered {a} crates of cooked chicken eggs. Each crate contains {b} eggs. The eggs are allocated equally as side dishes for {c} portions of special fried rice. How many eggs garnish each portion of fried rice?"], ["Perusahaan membagikan paket sembako kepada {a} divisi operasional. Setiap divisi rata-rata mempekerjakan {b} karyawan yang masing-masing mendapat satu paket. Jika seluruh paket tersebut disiapkan merata oleh {c} orang staf HRD, berapa paket sembako yang harus disiapkan oleh setiap staf?", "The company distributed basic food packages to {a} operational divisions. Each division employs an average of {b} employees, each receiving one package. If all the packages are prepared equally by {c} HRD staff members, how many packages must be prepared by each staff member?"]]};

// Helper: ambil soal cerita random dari bank, substitusi {a},{b},{c} dengan angka
function genStoryQuestion(catId, range) {
  // range: {aMin, aMax, bMin, bMax, cMin, cMax, distinct, noMult10, resultGt0, resultGt1} - cMin/cMax optional
  var bank = STORY_BANK[catId] || [];
  if (bank.length === 0) return null;
  var story = bank[Math.floor(Math.random() * bank.length)];
  var idText = story[0], enText = story[1];
  var a, b, c;
  a = ri(range.aMin, range.aMax);
  b = ri(range.bMin, range.bMax);
  if (range.cMin !== undefined && range.cMax !== undefined) {
    c = ri(range.cMin, range.cMax);
  }
  // Ensure distinct if required
  if(range.distinct && c !== undefined){
    var dAtt = 0;
    while(dAtt < 100 && (a === b || a === c || b === c)){
      a = ri(range.aMin, range.aMax);
      b = ri(range.bMin, range.bMax);
      c = ri(range.cMin, range.cMax);
      dAtt++;
    }
  } else if(range.distinct){
    var dAtt2 = 0;
    while(dAtt2 < 100 && a === b){
      b = ri(range.bMin, range.bMax);
      dAtt2++;
    }
  }
  // Untuk pengurangan: pastikan a > b
  if (catId === 'pengurangan' && a <= b) {
    var tmp = a; a = b; b = tmp;
  }
  // Untuk jumlah_kurang: pastikan a+b > c
  if (catId === 'jumlah_kurang' && c !== undefined && (a + b) <= c) {
    c = Math.min(a + b - 1, range.cMax);
    if (c < range.cMin) c = range.cMin;
  }
  // Hitung jawaban
  var answer;
  if (catId === 'penjumlahan') answer = a + b;
  else if (catId === 'pengurangan') answer = a - b;
  else if (catId === 'jumlah_kurang') answer = a + b - c;
  else if (catId === 'perkalian') answer = a * b;
  else if (catId === 'pembagian') answer = Math.floor(a / b);
  else if (catId === 'kali_bagi') answer = Math.floor((a * b) / c);
  // Untuk kali_bagi: pastikan (a*b) habis dibagi c, c >= 2, hasil >= 2, distinct, noMult10
  if (catId === 'kali_bagi' && c !== undefined) {
    var kbProduct = a * b;
    var kbMinC = Math.max(2, range.cMin);
    var kbMaxC = Math.min(range.cMax, Math.floor(kbProduct / 2));
    var kbDivisors = [];
    for (var d = kbMinC; d <= kbMaxC; d++) {
      if (kbProduct % d === 0) {
        // Filter distinct if required
        if(range.distinct && (d === a || d === b)) continue;
        // Filter multiples of 10 if noMult10
        if(range.noMult10 && d % 10 === 0) continue;
        kbDivisors.push(d);
      }
    }
    if (kbDivisors.length > 0) {
      c = kbDivisors[Math.floor(Math.random() * kbDivisors.length)];
    } else {
      return null;  // No valid divisor, let sg() retry
    }
    answer = Math.floor((a * b) / c);
    if (answer < 2) return null;
  }
  // Untuk pembagian: generate agar a habis dibagi b, b >= 2, quotient >= 2, distinct, noMult10
  if (catId === 'pembagian') {
    var pemMinB = Math.max(2, range.bMin);
    var pMaxQ = Math.max(2, Math.floor(range.aMax / pemMinB));
    var pQ = ri(2, pMaxQ);
    var pBMax = Math.floor(range.aMax / pQ);
    if (pBMax < pemMinB) {
      pQ = Math.max(2, Math.floor(range.aMax / pemMinB));
      pBMax = Math.floor(range.aMax / pQ);
      if (pBMax < pemMinB) pBMax = pemMinB;
    }
    var pB = ri(pemMinB, Math.max(pemMinB, pBMax));
    if(range.noMult10){
      var nmAtt = 0;
      while(pB % 10 === 0 && nmAtt < 50){ pB = ri(pemMinB, Math.max(pemMinB, pBMax)); nmAtt++; }
      if(pB % 10 === 0) pB = pB + 1;
    }
    var pA = pB * pQ;
    // Check distinct if required
    if(range.distinct && pA === pB){
      pQ = pQ + 1;
      pA = pB * pQ;
      if(pA > range.aMax) return null;
    }
    a = pA; b = pB; answer = pQ;
  }
  // Simpan template & values untuk language toggle
  return {
    isStory: true,
    storyTemplate: {id: idText, en: enText},
    storyValues: {a: a, b: b, c: c},
    storyKey: idText,  // Dedup by template only - no similar stories
    answer: answer,
    emojiDisplay: ''
  };
}

// Helper: render story question text based on current language
function renderStoryText(q) {
  var tmpl = (currentLang === 'en') ? q.storyTemplate.en : q.storyTemplate.id;
  var v = q.storyValues;
  var text = tmpl.replace(/\{a\}/g, v.a);
  if (v.b !== undefined && v.b !== null) text = text.replace(/\{b\}/g, v.b);
  if (v.c !== undefined && v.c !== null) text = text.replace(/\{c\}/g, v.c);
  return text;
}

// Generate 10 story questions for a story level
function genStoryQuiz(catId, range) {
  var qs = [], used = {}, att = 0;
  while (qs.length < 10 && att < 1000) {
    var q = genStoryQuestion(catId, range);
    if (q && !used[q.storyKey]) { used[q.storyKey] = true; qs.push(q); }
    att++;
  }
  while (qs.length < 10) { qs.push(genStoryQuestion(catId, range)); }
  return qs;
}

// Generate mixed quiz: combine story questions from multiple categories
function genMixedQuiz(ranges) {
  var qs = [], used = {}, att = 0;
  for (var i = 0; i < ranges.length; i++) {
    var r = ranges[i];
    var count = 0;
    var localAtt = 0;
    while (count < r.count && localAtt < 500) {
      var q = genStoryQuestion(r.cat, r.range);
      if (q && !used[q.storyKey]) {
        used[q.storyKey] = true;
        qs.push(q);
        count++;
      }
      localAtt++;
    }
    // Fill if not enough unique
    while (count < r.count) {
      qs.push(genStoryQuestion(r.cat, r.range));
      count++;
    }
  }
  // Shuffle the mixed questions
  for (var i = qs.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = qs[i]; qs[i] = qs[j]; qs[j] = tmp;
  }
  return qs;
}
var MSG_LU=['Luar biasa, {nama}!','Hebat sekali, {nama}!','Kamu menakjubkan, {nama}!','Fantastis, {nama}!','Keren banget, {nama}!'];
var MSG_CD=['Juara Matematika, {nama}!','Master sejati, {nama}!','Luar biasa hebat, {nama}!','Luar biasa pintar, {nama}!'];
var MSG_G=['Bagus sekali, {nama}!','Kerja kerasmu membuahkan hasil, {nama}!','Terus semangat, {nama}!','Hampir sampai, {nama}!'];
var MSG_TA=['Jangan menyerah, {nama}!','Kamu pasti bisa, {nama}!','Terus berlatih ya, {nama}!','Semangat terus, {nama}!'];

// (defProg & progress loading ditangani oleh loadAllUsers di atas)
loadAllUsers();
progress = getCurrentUser() ? getCurrentUser().progress : null;

function ri(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function pk(a){return a[ri(0,a.length-1)];}
function getName() {
  if (!progress) return (currentLang === 'en' ? 'You' : 'Kamu');
  var u = getCurrentUser();
  return (u && u.name) ? u.name : (currentLang === 'en' ? 'You' : 'Kamu');
}
function pkN(arr) { return pk(arr).replace(/{nama}/g, getName()); }
// Helper baru: ambil pesan motivasi sesuai bahasa aktif
function pkMsg(key) { return pk(tMsgArr(key)).replace(/{nama}/g, getName()); }
function comp(a,op,b){if(op==='+')return a+b;if(op==='\u2212'||op==='-')return a-b;if(op==='\u00D7'||op==='*')return a*b;if(op==='\u00F7'||op==='/')return b!==0?a/b:NaN;return NaN;}
function isPI(n){return typeof n==='number'&&isFinite(n)&&n>0&&Number.isInteger(n);}
function sg(fn,mt){mt=mt||200;for(var i=0;i<mt;i++){try{var r=fn();if(r&&typeof r.answer==='number'&&isPI(r.answer)&&r.question)return r;}catch(e){}}return{question:'1 + 1',answer:2};}

function eRow(e,c,pl){var s='';for(var i=0;i<c;i++)s+=e+' ';return s;}
// Helper HTML khusus untuk mengelompokkan emoji (agar tidak bertumpuk)
function eRowHTML(e, c) {
  var s = '';
  for(var i=0; i<c; i++) s += e + ' ';
  return '<span class="emoji-group">'+s+'</span>';
}
function fmtT(s){var m=Math.floor(s/60),sec=s%60;return(m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;}

function genMencacah(lv){var mx=lv===1?10:25;var c=ri(1,mx);var e=pk(FRUIT_E.concat(ANIMAL_E));return{question:eRow(e,c,lv===1?10:15),answer:c,isEmoji:true,emojiOnly:true};}

function genPenjumlahan(lv){return sg(function(){
  if(lv===1){var a=ri(1,5),b=ri(1,5);var e=pk(FRUIT_E);return{question:a+' + '+b,answer:a+b,isEmoji:true,emojiDisplay:eRowHTML(e,a)+'<span class="emoji-op">+</span>'+eRowHTML(e,b)};}
  if(lv<=8){var R=[[1,5],[1,10],[1,50],[10,50],[10,100],[10,99,100,999],[100,999],[100,999,1000,9999]];var r=R[lv-1];var a,b;if(r.length===4){a=ri(r[0],r[1]);b=ri(r[2],r[3]);}else{a=ri(r[0],r[1]);b=ri(r[0],r[1]);}return{question:a+' + '+b,answer:a+b};}
  var ops=ri(2,3),nums=[];for(var i=0;i<=ops;i++)nums.push(ri(1,200));var ans=nums.reduce(function(a,b){return a+b;},0);if(ans>9999)return null;return{question:nums.join(' + '),answer:ans};
});}

function genPengurangan(lv){return sg(function(){
  if(lv===1){var a=ri(2,5),b=ri(1,a-1);var e=pk(ANIMAL_E);return{question:a+' \u2212 '+b,answer:a-b,isEmoji:true,emojiDisplay:eRowHTML(e,a)+'<span class="emoji-op">\u2212</span>'+eRowHTML(e,b)};}
  if(lv<=8){var R=[[1,5],[1,10],[1,50],[10,50],[10,100],[100,999,10,99],[100,999],[1000,9999,100,999]];var r=R[lv-1];var a,b;
  if(r.length===4){a=ri(r[0],r[1]);b=ri(r[2],r[3]);if(a<b){var t=a;a=b;b=t;}}else{a=ri(r[0],r[1]);b=ri(r[0],r[1]);if(a<=b)a=b+ri(1,Math.max(1,r[1]-r[0]));}var ans=a-b;if(ans<=0)return null;return{question:a+' \u2212 '+b,answer:ans};}
  var ops=ri(2,3),total=ri(100,500),nums=[total],rem=total;for(var i=1;i<=ops;i++){var mx=rem-(ops-i);if(mx<1)return null;nums.push(ri(1,Math.min(mx,200)));rem-=nums[nums.length-1];}if(rem<=0)return null;return{question:nums.join(' \u2212 '),answer:rem};
});}

function genJumlahKurang(lv){return sg(function(){
  if(lv===1){var s=ri(1,9),p=ri(10,99);if(Math.random()<.5)return{question:s+' + '+p,answer:s+p};return{question:p+' + '+s,answer:p+s};}
  if(lv===2){var p=ri(11,99),s=ri(1,9);return{question:p+' \u2212 '+s,answer:p-s};}
  if(lv===3){var op=Math.random()<.5?'+':'\u2212';var a=ri(1,9),b=ri(1,9);if(op==='\u2212'&&a<=b){var t=a;a=b;b=t;}var ans=comp(a,op,b);if(ans<=0)return null;return{question:a+' '+op+' '+b,answer:ans};}
  var op=Math.random()<.5?'+':'\u2212';var a=ri(10,99),b=ri(10,99);if(op==='\u2212'&&a<=b){var t=a;a=b;b=t;}var ans=comp(a,op,b);if(ans<=0)return null;return{question:a+' '+op+' '+b,answer:ans};
});}

function genPerkalian(lv){return sg(function(){
  if(lv<=8){var R=[[1,5],[1,10],[1,50],[10,50],[10,100],[10,99,100,999],[100,999],[100,999,1000,9999]];var r=R[lv-1];var a,b;if(r.length===4){a=ri(r[0],r[1]);b=ri(r[2],r[3]);}else{a=ri(r[0],r[1]);b=ri(r[0],r[1]);}return{question:a+' \u00D7 '+b,answer:a*b};}
  var ops=ri(2,3),mx=ops===2?25:10,nums=[];for(var i=0;i<=ops;i++)nums.push(ri(2,mx));var ans=nums.reduce(function(a,b){return a*b;},1);if(ans>50000)return null;return{question:nums.join(' \u00D7 '),answer:ans};
});}

function genPembagian(lv){return sg(function(){
  // New 8-level structure: divisor > 1, result > 1, avoid mult of 10 for lv > 3
  var R = [
    {aMin:2, aMax:20, bMin:2, bMax:9},        // old1 -> L1: 2-20 / satuan
    {aMin:2, aMax:99, bMin:2, bMax:9},         // old2 -> L3: 2-99 / satuan
    {aMin:10, aMax:250, bMin:2, bMax:9},       // old3 -> L5: 10-250 / satuan
    {aMin:99, aMax:999, bMin:2, bMax:9},       // old4 -> L6: 99-999 / satuan
    {aMin:99, aMax:999, bMin:11, bMax:99},     // old5 -> L7: 99-999 / 11-99
    {aMin:999, aMax:9999, bMin:2, bMax:9},     // old6 -> L8: 999-9999 / 2-9
    {aMin:999, aMax:9999, bMin:9, bMax:99},    // old7 -> L9: 999-9999 / 9-99
    {aMin:999, aMax:9999, bMin:99, bMax:999}   // old8 -> L10: 999-9999 / 99-999
  ];
  if(lv < 1 || lv > R.length) return null;
  var r = R[lv-1];
  var b = ri(r.bMin, r.bMax);
  // Avoid multiples of 10 for levels > 3 (old4-old8)
  if(lv > 3){
    var att = 0;
    while(b % 10 === 0 && att < 50){ b = ri(r.bMin, r.bMax); att++; }
    if(b % 10 === 0) { b = b + 1; if(b > r.bMax) b = r.bMax - 1; }
  }
  if(b < 2) b = 2;
  // Pick quotient >= 2 (result > 1)
  var maxQ = Math.max(2, Math.floor(r.aMax / b));
  var minQ = Math.max(2, Math.ceil(r.aMin / b));
  if(minQ > maxQ) return null;
  var q = ri(minQ, maxQ);
  var a = b * q;
  if(a < r.aMin || a > r.aMax) return null;
  return {question: a+' \u00F7 '+b, answer: q};
});}

function genKaliBagi(lv){return sg(function(){
  if(lv===1){var s=ri(2,9),p=ri(10,99);if(Math.random()<.5)return{question:s+' \u00D7 '+p,answer:s*p};return{question:p+' \u00D7 '+s,answer:p*s};}
  if(lv===2){var s=ri(2,9);var qm=Math.floor(99/s);if(qm<2)return null;var q=ri(2,qm);var p=s*q;if(p<10)return null;return{question:p+' \u00F7 '+s,answer:q};}
  if(lv===3){var op=Math.random()<.5?'\u00D7':'\u00F7';if(op==='\u00D7'){var a=ri(1,9),b=ri(1,9);return{question:a+' \u00D7 '+b,answer:a*b};}var b=ri(2,9);var qm=Math.floor(9/b);if(qm<1)return null;var q=ri(1,qm);var a=b*q;if(a<1||a>9)return null;return{question:a+' \u00F7 '+b,answer:q};}
  var op=Math.random()<.5?'\u00D7':'\u00F7';if(op==='\u00D7'){var a=ri(10,99),b=ri(10,99);return{question:a+' \u00D7 '+b,answer:a*b};}var b=ri(2,49);var qm=Math.floor(99/b);if(qm<1)return null;var q=ri(1,qm);var a=b*q;if(a<10||a>99)return null;return{question:a+' \u00F7 '+b,answer:q};
},300);}

function genAdvance(lv){return sg(function(){
  var rng={1:[10,99],2:[10,99],3:[1,9],4:[10,99]};var ops={1:['+','\u2212'],2:['\u00D7','\u00F7'],3:['+','\u2212','\u00D7','\u00F7'],4:['+','\u2212','\u00D7','\u00F7']};
  var mn=rng[lv][0],mx=rng[lv][1],os=ops[lv];var o1=pk(os),o2=pk(os);if(o1==='\u00F7'&&o2==='\u00F7')return null;var hd=(o1==='\u00F7'||o2==='\u00F7');
  if(!hd){var a=ri(mn,mx),b=ri(mn,mx),c=ri(mn,mx);var inner=comp(a,o1,b);if(!isPI(inner))return null;var res=comp(inner,o2,c);if(!isPI(res))return null;var np=(o1==='+'||o1==='\u2212')&&(o2==='\u00D7');return{question:np?'('+a+' '+o1+' '+b+') '+o2+' '+c:a+' '+o1+' '+b+' '+o2+' '+c,answer:res};}
  if(o1==='\u00F7'){var bm=(lv===3)?9:30;var b=ri(Math.max(mn,2),Math.min(mx,bm));var qm=(lv===3)?Math.floor(9/b):Math.floor(mx/b);if(qm<1)return null;var q=ri(1,qm);var a=b*q;if(a<mn||a>mx)return null;
  if(o2==='+'){var c=ri(mn,mx);return{question:a+' \u00F7 '+b+' + '+c,answer:q+c};}
  if(o2==='\u2212'){var cm=Math.min(mx,q-1);if(cm<mn)return null;var c=ri(mn,cm);var r=q-c;if(r<=0)return null;return{question:a+' \u00F7 '+b+' \u2212 '+c,answer:r};}
  if(o2==='\u00D7'){var cm2=(lv===3)?Math.min(mx,Math.floor(500/Math.max(1,q))):Math.min(mx,Math.floor(5000/Math.max(1,q)));if(cm2<mn)return null;var c=ri(mn,cm2);var r=q*c;if(!isPI(r))return null;return{question:a+' \u00F7 '+b+' \u00D7 '+c,answer:r};}return null;}
  if(o2==='\u00F7'){var a,b,inner,c;
  if(o1==='+'){a=ri(mn,mx);b=ri(mn,mx);inner=a+b;var dv=[];for(var d=Math.max(mn,1);d<=Math.min(mx,inner-1);d++){if(inner%d===0)dv.push(d);}if(!dv.length)return null;c=pk(dv);return{question:'('+a+' + '+b+') \u00F7 '+c,answer:inner/c};}
  if(o1==='\u2212'){a=ri(mn,mx);b=ri(mn,mx);if(a<=b){var t=a;a=b;b=t;}inner=a-b;if(inner<=0)return null;var dv=[];for(var d=Math.max(mn,1);d<=Math.min(mx,inner);d++){if(inner%d===0)dv.push(d);}if(!dv.length)return null;c=pk(dv);return{question:'('+a+' \u2212 '+b+') \u00F7 '+c,answer:inner/c};}
  if(o1==='\u00D7'){a=ri(mn,mx);b=ri(mn,mx);inner=a*b;if(inner>100000)return null;var dv=[];for(var d=Math.max(mn,1);d<=Math.min(mx,inner-1);d++){if(inner%d===0)dv.push(d);}if(!dv.length)return null;c=pk(dv);return{question:a+' \u00D7 '+b+' \u00F7 '+c,answer:inner/c};}return null;}
  return null;
},600);}

// Ujian: generate dari SEMUA level (regular + story + mixed) sesuai struktur level baru
function genUjianQ(catId, maxLv){
  var qs=[],used={},att=0;
  while(qs.length<10&&att<2000){
    var lv=ri(1,maxLv);
    var def=getLevelDef(catId,lv);
    var q=null;
    if(def.type==='story'){var sCat=def.cat||catId;var sR=Object.assign({},def.range,{distinct:def.distinct||def.range.distinct,noMult10:def.noMult10||def.range.noMult10,resultGt0:def.resultGt0||def.range.resultGt0,resultGt1:def.resultGt1||def.range.resultGt1});q=genStoryQuestion(sCat,sR);q=q||null;}
    else if(def.type==='twop'){q=genTwoOp(def);q=q||null;}
    else if(def.type==='mixed'){
      // Pick random from mixed ranges
      var r=def.ranges[ri(0,def.ranges.length-1)];
      q=genStoryQuestion(r.cat,r.range);
    } else {
      var oldLv=def.old||lv;
      q=genQ(catId,oldLv);
    }
    if(q){
      var key=q.isStory ? q.storyKey : q.question;
      if(!used[key]){used[key]=true;q.level=lv;qs.push(q);}
    }
    att++;
  }
  while(qs.length<10){
    var lv=ri(1,maxLv);
    var def=getLevelDef(catId,lv);
    var q=null;
    if(def.type==='story'){var sCat2=def.cat||catId;var sR2=Object.assign({},def.range,{distinct:def.distinct||def.range.distinct,noMult10:def.noMult10||def.range.noMult10});q=genStoryQuestion(sCat2,sR2);}
    else if(def.type==='twop'){q=genTwoOp(def);}
    else if(def.type==='mixed'){var r=def.ranges[ri(0,def.ranges.length-1)];q=genStoryQuestion(r.cat,r.range);}
    else {var oldLv=def.old||lv;q=genQ(catId,oldLv);}
    if(q){q.level=lv;qs.push(q);}
  }
  return qs;
}
// Generate two-operation question (a+b-c or a*b/c)
function genTwoOp(def) {
  var r = def.range;
  var op = def.op;
  return sg(function(){
    var a = ri(r.aMin, r.aMax);
    var b = ri(r.bMin, r.bMax);
    var c = ri(r.cMin, r.cMax);
    // Ensure distinct if required
    if(def.distinct){
      var att = 0;
      while(att < 100 && (a === b || a === c || b === c)){
        a = ri(r.aMin, r.aMax);
        b = ri(r.bMin, r.bMax);
        c = ri(r.cMin, r.cMax);
        att++;
      }
    }
    if(op === 'addsub'){
      // a + b - c, result must be > 0
      var result = a + b - c;
      if(def.resultGt0 && result <= 0){
        // Swap to make result positive: ensure a+b > c
        var maxabc = Math.max(a, b, c);
        if(c === maxabc){
          // c is largest, swap with a or b
          var tmp = c; c = a; a = tmp;
        }
        result = a + b - c;
        if(result <= 0){
          // Adjust c down
          c = Math.max(r.cMin, a + b - 1);
          if(c < r.cMin) c = r.cMin;
          result = a + b - c;
        }
      }
      if(result <= 0) return null;
      return {question: a + ' + ' + b + ' \u2212 ' + c, answer: result};
    } else if(op === 'muldiv'){
      // a * b / c, c > 1, result > 1, must be integer
      // Strategy: pick a, b, compute product, then pick c as divisor of product
      var product = a * b;
      // Find valid divisors of product
      var mDivisors = [];
      var mMinC = Math.max(2, r.cMin);
      var mMaxC = Math.min(r.cMax, Math.floor(product / 2));  // result >= 2
      for(var md = mMinC; md <= mMaxC; md++){
        if(product % md === 0){
          // Check distinct if required
          if(def.distinct && (md === a || md === b)) continue;
          mDivisors.push(md);
        }
      }
      if(mDivisors.length === 0) return null;
      c = mDivisors[Math.floor(Math.random() * mDivisors.length)];
      var result2 = Math.floor(product / c);
      if(result2 < 2) return null;
      return {question: a + ' \u00D7 ' + b + ' \u00F7 ' + c, answer: result2};
    }
    return null;
  }, 500);
}

function genQ(catId,lv){if(catId==='mencacah')return genMencacah(lv);var fn={penjumlahan:genPenjumlahan,pengurangan:genPengurangan,jumlah_kurang:genJumlahKurang,perkalian:genPerkalian,pembagian:genPembagian,kali_bagi:genKaliBagi,advance:genAdvance};return(fn[catId]||function(){return{question:'1+1',answer:2};})(lv);}

var curCat=null,curLv=null,quizQ=[],quizIdx=0,quizAns=[],quizLock=false;
var timerInt=null,timeLeft=0,totalTime=0,isUjian=false,ujSecIdx=-1,examIntroIntv=null;

function sw(id){var s=document.querySelectorAll('.screen');for(var i=0;i<s.length;i++)s[i].classList.remove('active');document.getElementById(id).classList.add('active');window.scrollTo(0,0);}

function startApp() {
  // Multi-user: jika ada user aktif, langsung ke home. Jika tidak, ke welcome.
  if (getCurrentUser()) {
    renderHome();
  } else {
    showAccessScreen();
  }
}

function showAccessScreen() {
  var ov = document.getElementById('overlay');
  var h = '<div class="celeb-card" style="max-width:380px; text-align:center;">';
  h += '<div class="home-title" style="font-size:2rem; margin-bottom:20px; -webkit-text-fill-color: var(--accent); background: none;">MathKu</div>';
  h += '<div style="font-size:.9rem; color:var(--text-light); margin-bottom:14px;">'+t('access_welcome')+'</div>';
  h += '<input type="text" id="access-name" class="quiz-input" placeholder="'+t('access_name_ph')+'" style="margin-bottom:12px; width:100%; max-width:280px; height:48px; font-size:1.1rem;">';
  h += '<div id="access-error" style="color:var(--danger); font-size:.85rem; height:18px; margin-bottom:8px;"></div>';
  h += '<button class="btn btn-primary" id="access-btn" style="width:100%; max-width:280px;">'+t('access_btn')+'</button>';
  h += '</div>';
  ov.innerHTML = h;
  ov.classList.add('show');

  document.getElementById('access-btn').addEventListener('click', function() {
    var name = document.getElementById('access-name').value.trim();
    if (!name) {
      document.getElementById('access-error').textContent = t('access_err_name');
      document.getElementById('access-name').classList.add('anim-shake');
      setTimeout(function(){ document.getElementById('access-name').classList.remove('anim-shake'); }, 400);
      return;
    }

    // Tambah user pertama
    addUser(name);
    snd('accessGranted');

    ov.innerHTML = '<div class="celeb-card" style="max-width:380px; text-align:center;">' +
                   '<div class="celeb-trophy" style="background:#E8F5E9"><svg width="40" height="40" viewBox="0 0 24 24" fill="#4CAF50"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>' +
                   '<div class="celeb-title" style="color:#4CAF50">'+t('access_granted_title')+'</div>' +
                   '<div class="celeb-desc">'+t('access_granted_desc',{name:name})+'</div>' +
                   '<button class="btn btn-primary" id="access-continue" style="width:100%">'+t('access_continue')+'</button></div>';

    document.getElementById('access-continue').addEventListener('click', function() {
      ov.classList.remove('show');
      renderHome();
    });
  });
}

/* ================================================================
   GATE KODE AKSES - Muncul saat user ingin akses Level 2+ atau tambah user
   Setelah kode benar, accessGranted=true & gate nonaktif untuk semua kategori
   ================================================================ */
function showAccessGate(onSuccess, gateMode) {
  // gateMode: 'level' (default) atau 'adduser'
  gateMode = gateMode || 'level';
  var ov = document.getElementById('overlay');
  var titleKey = gateMode === 'adduser' ? 'gate_adduser_title' : 'gate_title';
  var descKey = gateMode === 'adduser' ? 'gate_adduser_desc' : 'gate_desc';
  var btnKey = gateMode === 'adduser' ? 'gate_adduser_btn' : 'gate_btn';
  var h = '<div class="celeb-card" style="max-width:380px; text-align:center;">';
  h += '<div class="celeb-trophy" style="background:#FFF3E0"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FF7043" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>';
  h += '<div class="celeb-title" style="color:#FF7043">'+t(titleKey)+'</div>';
  h += '<div class="celeb-desc">'+t(descKey)+'</div>';
  h += '<a href="https://lynk.id/qafstudio/1nl20ng051gn" target="_blank" rel="noopener noreferrer" class="access-request-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;flex-shrink:0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'+t('access_request_link')+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;flex-shrink:0"><path d="M7 17L17 7"/><polyline points="7 7 17 7 17 17"/></svg></a>';
  h += '<input type="text" id="gate-code" class="quiz-input" placeholder="'+t('access_code_ph')+'" inputmode="numeric" maxlength="6" style="margin-bottom:12px; width:100%; max-width:280px; height:48px; font-size:1.1rem; text-align:center; letter-spacing:4px;">';
  h += '<div id="gate-error" style="color:var(--danger); font-size:.85rem; height:18px; margin-bottom:8px;"></div>';
  h += '<button class="btn btn-primary" id="gate-btn" style="width:100%; max-width:280px; margin-bottom:8px;">'+t(btnKey)+'</button>';
  h += '<button class="btn btn-secondary" id="gate-cancel" style="width:100%; max-width:280px;">'+t('gate_cancel')+'</button>';
  h += '</div>';
  ov.innerHTML = h;
  ov.classList.add('show');
  snd('click');

  setTimeout(function(){ var inp = document.getElementById('gate-code'); if(inp) inp.focus(); }, 100);

  function verify() {
    var code = document.getElementById('gate-code').value.trim();
    if (!code) return;
    if (code !== DEV_CODE) {
      document.getElementById('gate-error').textContent = t('gate_err_code');
      document.getElementById('gate-code').classList.add('anim-shake');
      setTimeout(function(){ document.getElementById('gate-code').classList.remove('anim-shake'); }, 400);
      snd('wrong');
      return;
    }
    accessGranted = true;
    saveAllUsers();
    snd('accessGranted');

    var toast = document.getElementById('save-toast');
    if(toast){
      toast.textContent = t('gate_success');
      toast.classList.add('show');
      setTimeout(function(){
        toast.classList.remove('show');
        toast.textContent = t('toast_saved');
      }, 2500);
    }

    ov.classList.remove('show');
    setTimeout(function(){ if(typeof onSuccess === 'function') onSuccess(); }, 300);
  }

  document.getElementById('gate-btn').addEventListener('click', verify);
  document.getElementById('gate-code').addEventListener('keydown', function(e){ if(e.key === 'Enter') verify(); });
  document.getElementById('gate-code').addEventListener('input', function(){ this.value = this.value.replace(/[^0-9]/g,''); });
  document.getElementById('gate-cancel').addEventListener('click', function(){
    snd('click');
    ov.classList.remove('show');
  });
}

/* ================================================================
   USER MANAGER - Pilih/ganti/hapus user, tambah user (dengan gate)
   ================================================================ */
function showUserManager() {
  var ov = document.getElementById('overlay');
  var h = '<div class="celeb-card" style="max-width:380px; text-align:center;">';
  h += '<div class="celeb-title" style="color:var(--accent); margin-bottom:16px;">'+t('user_manager_title')+'</div>';
  h += '<div id="user-list" style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">';
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    var isCurrent = (u.id === currentUserId);
    h += '<div class="user-item'+(isCurrent?' current':'')+'" data-uid="'+u.id+'" style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border:2px solid '+(isCurrent?'var(--accent)':'var(--border)')+'; border-radius:12px; background:'+(isCurrent?'#FFF3E0':'var(--card)')+'; cursor:'+(isCurrent?'default':'pointer')+';">';
    h += '<div style="display:flex; align-items:center; gap:10px; flex:1;">';
    h += '<div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#FF7043,#EC407A); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:.95rem;">'+u.name.charAt(0).toUpperCase()+'</div>';
    h += '<span style="font-weight:600; color:var(--text);">'+u.name+'</span>';
    if (isCurrent) h += '<span style="font-size:.7rem; padding:2px 8px; background:var(--accent); color:#fff; border-radius:10px; font-weight:700;">'+t('user_active')+'</span>';
    h += '</div>';
    if (!isCurrent) {
      h += '<button class="user-del-btn" data-uid="'+u.id+'" style="background:none; border:none; color:var(--danger); font-size:1.1rem; cursor:pointer; padding:4px 8px; border-radius:6px;" title="'+t('user_delete')+'">&times;</button>';
    }
    h += '</div>';
  }
  h += '</div>';
  // Tombol tambah user
  if (users.length < MAX_USERS) {
    h += '<button class="btn btn-secondary" id="add-user-btn" style="width:100%; margin-bottom:8px;">+ '+t('user_add')+'</button>';
  } else {
    h += '<div style="font-size:.8rem; color:var(--text-light); margin-bottom:8px; padding:8px; background:var(--bg-alt); border-radius:8px;">'+t('user_max_reached')+'</div>';
  }
  h += '<button class="btn btn-primary" id="um-close" style="width:100%;">'+t('user_close')+'</button>';
  h += '</div>';
  ov.innerHTML = h;
  ov.classList.add('show');
  snd('click');

  // Klik user (ganti)
  var items = ov.querySelectorAll('.user-item');
  for (var i = 0; i < items.length; i++) {
    items[i].addEventListener('click', function(e){
      if (e.target.classList.contains('user-del-btn')) return;
      var uid = this.getAttribute('data-uid');
      if (uid === currentUserId) return;
      snd('click');
      switchUser(uid);
      ov.classList.remove('show');
      renderHome();
    });
  }
  // Hapus user
  var delBtns = ov.querySelectorAll('.user-del-btn');
  for (var i = 0; i < delBtns.length; i++) {
    delBtns[i].addEventListener('click', function(e){
      e.stopPropagation();
      var uid = this.getAttribute('data-uid');
      var uname = '';
      for (var j = 0; j < users.length; j++) { if (users[j].id === uid) { uname = users[j].name; break; } }
      if (!confirm(t('user_delete_confirm',{name:uname}))) return;
      snd('click');
      deleteUser(uid);
      if (users.length === 0) {
        ov.classList.remove('show');
        showAccessScreen();
      } else {
        showUserManager();
        renderHome();
      }
    });
  }
  // Tambah user
  var addBtn = ov.querySelector('#add-user-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function(){
      snd('click');
      // Jika belum accessGranted, tampilkan gate dulu
      if (!accessGranted) {
        showAccessGate(function(){ showAddUserDialog(); }, 'adduser');
      } else {
        showAddUserDialog();
      }
    });
  }
  // Tutup
  ov.querySelector('#um-close').addEventListener('click', function(){
    snd('click');
    ov.classList.remove('show');
  });
}

function showAddUserDialog() {
  var ov = document.getElementById('overlay');
  var h = '<div class="celeb-card" style="max-width:380px; text-align:center;">';
  h += '<div class="celeb-title" style="color:var(--accent); margin-bottom:16px;">'+t('user_add_title')+'</div>';
  h += '<input type="text" id="new-user-name" class="quiz-input" placeholder="'+t('access_name_ph')+'" style="margin-bottom:12px; width:100%; max-width:280px; height:48px; font-size:1.1rem;">';
  h += '<div id="new-user-error" style="color:var(--danger); font-size:.85rem; height:18px; margin-bottom:8px;"></div>';
  h += '<button class="btn btn-primary" id="new-user-confirm" style="width:100%; max-width:280px; margin-bottom:8px;">'+t('user_add_confirm')+'</button>';
  h += '<button class="btn btn-secondary" id="new-user-cancel" style="width:100%; max-width:280px;">'+t('gate_cancel')+'</button>';
  h += '</div>';
  ov.innerHTML = h;
  setTimeout(function(){ var inp = document.getElementById('new-user-name'); if(inp) inp.focus(); }, 100);

  document.getElementById('new-user-confirm').addEventListener('click', function(){
    var name = document.getElementById('new-user-name').value.trim();
    if (!name) {
      document.getElementById('new-user-error').textContent = t('access_err_name');
      document.getElementById('new-user-name').classList.add('anim-shake');
      setTimeout(function(){ document.getElementById('new-user-name').classList.remove('anim-shake'); }, 400);
      return;
    }
    var result = addUser(name);
    if (!result.ok) {
      document.getElementById('new-user-error').textContent = t('user_max_reached');
      return;
    }
    snd('accessGranted');
    ov.classList.remove('show');
    renderHome();
  });
  document.getElementById('new-user-name').addEventListener('keydown', function(e){ if(e.key === 'Enter') document.getElementById('new-user-confirm').click(); });
  document.getElementById('new-user-cancel').addEventListener('click', function(){
    snd('click');
    showUserManager();
  });
}

function renderHome(){
  if(!progress){ showAccessScreen(); return; }
  var el=document.getElementById('screen-home');
  // Sambutan ringan saat tiba di home (jika baru saja login)
  if(!renderHome._welcomed){renderHome._welcomed=true;setTimeout(function(){snd('welcome');},300);}
  var h='<header class="home-header"><div class="home-logo"><svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="hl" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" stop-color="#FFFFFF"/><stop offset="100%25" stop-color="#FFE0B2"/></linearGradient></defs><text x="32" y="44" font-family="Arial,sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="url(#hl)">1+2</text></svg></div><div class="home-title">MathKu</div><div class="home-subtitle">'+t('home_subtitle',{name:getName()})+'</div><button class="btn-user-switch" id="btn-user-switch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>'+getName()+'</span><span class="user-count-badge">'+users.length+'/'+MAX_USERS+'</span></button><button class="btn-install" id="btn-install"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'+t('home_install_btn')+'</button><div class="save-indicator" id="save-ind">'+t('home_save_indicator')+'</div></header><div class="cat-grid">';
  for(var i=0;i<CATS.length;i++){
    var c=CATS[i],p=progress[c.id],ts=0;
    for(var j=1;j<=c.maxLv;j++)ts+=Math.min(p.stars[j],3);
    var pct=Math.round((ts/(c.maxLv*3))*100);
    var done=p.unlocked>c.maxLv;
    var ic=c.isEmoji?'cat-icon cat-icon-emoji':'cat-icon';
    h+='<div class="cat-card'+(done?' completed':'')+'" data-cat="'+c.id+'">';
    h+='<div class="'+ic+'" style="background:'+c.color+'">'+c.icon+'</div>';
    h+='<div class="cat-name">'+tCat(c.id)+'</div>';
    if(c.id==='ujian')h+='<div class="cat-progress">'+t('home_ujian_count')+'</div>';
    else if(done)h+='<div class="cat-progress">'+t('home_all_done')+'</div>';
    else h+='<div class="cat-progress">'+t('result_level',{lv:p.unlocked})+' / '+c.maxLv+'</div>';
    h+='<div class="cat-bar"><div class="cat-bar-fill" style="width:'+pct+'%;background:'+c.color+'"></div></div></div>';
  }
  h+='</div><footer class="home-footer"><button class="btn-about" id="btn-about">ℹ️ '+t('about_link')+'</button><button class="btn-reset" id="btn-reset">'+t('home_reset_btn')+'</button><div id="reset-area"></div><div style="margin-top: 20px; font-size: 0.7rem; color: var(--text-light); text-align: center; line-height: 1.5; opacity: 0.8;">'+t('home_footer')+'</div></footer>';
  el.innerHTML=h;
  var cards=el.querySelectorAll('.cat-card');
  for(var i=0;i<cards.length;i++){(function(cd){cd.addEventListener('click',function(){var id=cd.getAttribute('data-cat');if(id==='ujian')openUjLevels();else openLevels(id);});})(cards[i]);}
  document.getElementById('btn-about').addEventListener('click',function(){
    snd('click');
    var m=document.getElementById('about-modal');if(m)m.classList.add('show');
  });
  document.getElementById('btn-install').addEventListener('click',function(){
    snd('click');
    // Coba picu prompt install native browser terlebih dahulu
    if(window._deferredInstallPrompt){
      window._deferredInstallPrompt.prompt();
      window._deferredInstallPrompt.userChoice.then(function(choice){
        console.log('[PWA] Install choice:', choice.outcome);
        window._deferredInstallPrompt = null;
        // Update tampilan tombol install setelah dipilih
        var btn = document.getElementById('btn-install');
        if(btn) btn.style.display = 'none';
        if(choice.outcome === 'accepted'){
          // Tampilkan toast sukses
          var toast = document.getElementById('save-toast');
          if(toast){toast.textContent=t('toast_installed');toast.classList.add('show');setTimeout(function(){toast.classList.remove('show');toast.textContent=t('toast_saved');},3000);}
        }
      }).catch(function(e){console.warn('[PWA] Install prompt error:', e);});
    } else {
      // Browser tidak mendukung beforeinstallprompt (iOS Safari / desktop tertentu)
      // -> tampilkan modal panduan manual
      var m=document.getElementById('install-modal');if(m)m.classList.add('show');
    }
  });
  document.getElementById('btn-user-switch').addEventListener('click',function(){
    snd('click');
    showUserManager();
  });
  document.getElementById('btn-reset').addEventListener('click',function(){
    document.getElementById('reset-area').innerHTML='<div class="reset-confirm"><span>'+t('home_reset_confirm')+'</span><button id="ry">'+t('home_reset_yes')+'</button><button class="btn-cancel" id="rn">'+t('home_reset_no')+'</button></div>';
    document.getElementById('ry').addEventListener('click',function(){
      // Reset hanya progress user aktif
      var u = getCurrentUser();
      if (u) {
        u.progress = defProg();
        progress = u.progress;
        saveAllUsers();
      }
      renderHome();
    });
    document.getElementById('rn').addEventListener('click',function(){document.getElementById('reset-area').innerHTML='';});
  });
  sw('screen-home');
}

function openLevels(catId){
  var co=null;for(var i=0;i<CATS.length;i++){if(CATS[i].id===catId){co=CATS[i];break;}}if(!co)return;
  curCat=co;var el=document.getElementById('screen-levels'),p=progress[catId];
  var h='<div class="level-header"><button class="btn-back" id="bbl">\u2190</button>';
  h+='<div class="level-title" style="color:'+co.color+'">'+tCat(catId)+'</div></div>';
  h+='<div class="level-desc">'+t('level_desc')+'</div><div class="level-grid">';
  // Untuk kategori mencacah, tambah node Pengenalan di awal
  if(catId==='mencacah'){
    h+='<div class="level-node" data-level="0" data-intro="1"><div class="level-circle" style="background:'+co.color+';width:60px;height:60px;"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="#fff" stroke="none"/></svg></div><div class="level-stars" style="visibility:hidden">\u2605\u2605\u2605</div><div class="level-label">'+t('intro_label')+'</div></div>';
  }
  for(var i=1;i<=co.maxLv;i++){
    var ul=i<=p.unlocked,st=p.stars[i]||0,ic=i===p.unlocked&&st<3;
    var storyLv = isStoryLevel(catId, i);
    var cls='level-node'+(ul?'':' locked')+(ic?' current':'')+(storyLv?' story-level':'');
    // Story/mixed level: tampilkan ikon buku, warna sama seperti level reguler (category color, abu jika locked)
    if(storyLv){
      h+='<div class="'+cls+'" data-level="'+i+'"><div class="level-circle" style="background:'+(ul?co.color:'')+'"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div><div class="level-stars">';
    } else {
      h+='<div class="'+cls+'" data-level="'+i+'"><div class="level-circle" style="background:'+(ul?co.color:'')+'">'+i+'</div><div class="level-stars">';
    }
    if(ul){for(var s=0;s<3;s++)h+=s<st?'\u2605':'\u2606';}else h+='\u2606\u2606\u2606';
    h+='</div><div class="level-label">'+(storyLv?(currentLang==='en'?'Story':'Cerita'):'')+'</div></div>';
  }
  h+='</div>';el.innerHTML=h;sw('screen-levels');
  document.getElementById('bbl').addEventListener('click',function(){renderHome();});
  // Bind intro node (khusus mencacah)
  var introNode=el.querySelector('.level-node[data-intro="1"]');
  if(introNode){
    introNode.addEventListener('click',function(){
      snd('click');
      startIntroQuiz(catId);
    });
  }
  var nodes=el.querySelectorAll('.level-node:not(.locked):not([data-intro])');
  for(var i=0;i<nodes.length;i++){(function(n){n.addEventListener('click',function(){
    var lv=parseInt(n.getAttribute('data-level'));
    if(lv>=2 && !accessGranted){
      showAccessGate(function(){ startQuiz(catId,lv); });
    } else {
      startQuiz(catId,lv);
    }
  });})(nodes[i]);}
}

function openUjLevels(){
  var co=null;for(var i=0;i<CATS.length;i++){if(CATS[i].id==='ujian'){co=CATS[i];break;}}
  curCat=co;var el=document.getElementById('screen-levels'),p=progress['ujian'];
  var h='<div class="level-header"><button class="btn-back" id="bbl">\u2190</button>';
  h+='<div class="level-title" style="color:'+co.color+'">'+tCat('ujian')+'</div></div>';
  h+='<div class="level-desc">'+t('ujian_level_desc')+'</div>';
  h+='<div class="level-grid" style="grid-template-columns:repeat(auto-fill,minmax(100px,1fr))">';
  for(var i=0;i<UJ_SEC.length;i++){
    var sec=UJ_SEC[i],st=p.stars[i+1]||0;
    h+='<div class="level-node'+(st>=3?' current':'')+'" data-ujidx="'+i+'">';
    h+='<div class="level-circle" style="background:'+sec.color+'">'+(i+1)+'</div>';
    h+='<div class="level-stars">';for(var s=0;s<3;s++)h+=s<st?'\u2605':'\u2606';h+='</div>';
    h+='<div class="level-label" style="color:'+sec.color+';font-weight:600">'+tCat(sec.id)+' ('+sec.time+'m)</div></div>';
  }
  h+='</div>';el.innerHTML=h;sw('screen-levels');
  document.getElementById('bbl').addEventListener('click',function(){renderHome();});
  var nodes=el.querySelectorAll('.level-node');
  for(var i=0;i<nodes.length;i++){(function(n){n.addEventListener('click',function(){
    var ujIdx=parseInt(n.getAttribute('data-ujidx'));
    if(ujIdx>=1 && !accessGranted){
      showAccessGate(function(){ startUjian(ujIdx); });
    } else {
      startUjian(ujIdx);
    }
  });})(nodes[i]);}
}

/* ================================================================
   INTRO QUIZ - Pengenalan angka 1-10 dengan emoji (kategori berhitung)
   ================================================================ */
var introIdx = 0;
var introActive = false;

function startIntroQuiz(catId) {
  var co=null;
  for(var i=0;i<CATS.length;i++){if(CATS[i].id===catId){co=CATS[i];break;}}
  if(!co)return;
  curCat=co;
  curLv=0; // Level 0 = intro
  introIdx=0;
  introActive=true;
  isUjian=false;
  clrT();
  renderIntroSlide();
  sw('screen-quiz');
}

function renderIntroSlide() {
  var el=document.getElementById('screen-quiz');
  var n = introIdx + 1; // 1..10
  var emoji = INTRO_EMOJIS[introIdx];
  var word = numWord(n);
  var totalSlides = 10;
  // Buat emoji berulang sesuai jumlah
  var emojiDisplay = '';
  for(var i=0;i<n;i++) emojiDisplay += emoji + ' ';
  emojiDisplay = emojiDisplay.trim();
  var h='<div class="quiz-top"><div class="quiz-top-left"><button class="btn-back" id="bqq">\u2190</button>';
  h+='<span class="quiz-progress-text">'+t('intro_label')+' ('+n+'/'+totalSlides+')</span></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+='<span class="quiz-cat-badge" style="background:'+curCat.color+'">'+t('intro_label')+'</span>';
  h+='</div></div>';
  h+='<div class="quiz-dots" style="margin-bottom:8px">';
  for(var i=0;i<totalSlides;i++){
    var cls='quiz-dot';
    if(i<introIdx) cls+=' done';
    else if(i===introIdx) cls+=' current';
    h+='<div class="'+cls+'"></div>';
  }
  h+='</div>';
  h+='<div class="quiz-card" id="qc" style="gap:18px;min-height:auto;padding-bottom:30px;">';
  // Text "ini ada {word}"
  h+='<div style="font-size:1.3rem;font-weight:700;color:var(--accent);">'+t('intro_count_word',{word:word})+'</div>';
  // Angka besar
  h+='<div style="font-size:5rem;font-weight:900;color:var(--text);line-height:1;">'+n+'</div>';
  // Emoji display
  h+='<div class="quiz-emoji-area" style="font-size:2.2rem;min-height:60px;align-items:center;">'+emojiDisplay+'</div>';
  // Tombol ulangi/lanjut
  h+='<div style="display:flex;gap:10px;width:100%;max-width:320px;flex-direction:column;">';
  if(introIdx < totalSlides-1){
    h+='<button class="btn btn-secondary" id="intro-repeat" style="width:100%;">'+t('intro_repeat')+'</button>';
    h+='<button class="btn btn-primary" id="intro-next" style="width:100%;">'+t('intro_next')+'</button>';
  } else {
    h+='<button class="btn btn-secondary" id="intro-repeat" style="width:100%;">'+t('intro_repeat')+'</button>';
    h+='<button class="btn btn-primary" id="intro-next" style="width:100%;">'+t('intro_finish')+'</button>';
  }
  h+='</div>';
  h+='</div>';
  el.innerHTML=h;
  snd('click');
  document.getElementById('bqq').addEventListener('click',function(){
    snd('click');
    introActive=false;
    openLevels(curCat.id);
  });
  document.getElementById('intro-repeat').addEventListener('click',function(){
    snd('click');
    // Re-render slide yang sama (ulangi)
    renderIntroSlide();
  });
  document.getElementById('intro-next').addEventListener('click',function(){
    snd('correct');
    introIdx++;
    if(introIdx>=10){
      // Selesai, mulai kuis level 1
      introActive=false;
      startQuiz(curCat.id,1);
    } else {
      renderIntroSlide();
    }
  });
}

function startQuiz(catId,lv){
  var co=null;for(var i=0;i<CATS.length;i++){if(CATS[i].id===catId){co=CATS[i];break;}}if(!co)return;
  curCat=co;curLv=lv;quizQ=[];quizIdx=0;quizAns=[];quizLock=false;isUjian=false;ujSecIdx=-1;clrT();
  // Tandai intro selesai (stars[0]=1) saat user masuk ke level 1 mencacah
  if(catId==='mencacah' && lv===1 && progress.mencacah && (!progress.mencacah.stars[0] || progress.mencacah.stars[0]<1)){
    progress.mencacah.stars[0]=1; saveAllUsers();
  }
  // Cek apakah level ini adalah story level, mixed level, twop level, atau regular level
  var def = getLevelDef(catId, lv);
  if (def.type === 'story') {
    // Advance story levels may specify a different category for story bank
    var storyCat = def.cat || catId;
    // Merge def-level flags into range for genStoryQuestion
    var storyRange = Object.assign({}, def.range, {
      distinct: def.distinct || def.range.distinct,
      noMult10: def.noMult10 || def.range.noMult10,
      resultGt0: def.resultGt0 || def.range.resultGt0,
      resultGt1: def.resultGt1 || def.range.resultGt1
    });
    quizQ = genStoryQuiz(storyCat, storyRange);
  } else if (def.type === 'mixed') {
    quizQ = genMixedQuiz(def.ranges);
  } else if (def.type === 'twop') {
    var qs = [], used = {}, att = 0;
    while(qs.length < 10 && att < 1000){
      var tq = genTwoOp(def);
      if(tq && !used[tq.question]){ used[tq.question] = true; qs.push(tq); }
      att++;
    }
    while(qs.length < 10) qs.push(genTwoOp(def));
    quizQ = qs;
  } else {
    // Regular level: gunakan old level number untuk genQ
    var oldLv = def.old || lv;
    var used={};var att=0;
    while(quizQ.length<10&&att<500){var q=genQ(catId,oldLv);if(!used[q.question]){used[q.question]=true;quizQ.push(q);}att++;}
    while(quizQ.length<10)quizQ.push(genQ(catId,oldLv));
  }
  renderQuiz();sw('screen-quiz');
}

function startUjian(si){
  var sec=UJ_SEC[si];var co=null;for(var i=0;i<CATS.length;i++){if(CATS[i].id==='ujian'){co=CATS[i];break;}}
  curCat=co;curLv=si+1;quizQ=[];quizIdx=0;quizAns=[];quizLock=false;isUjian=true;ujSecIdx=si;clrT();
  // Advance tidak punya LEVEL_DEFS, gunakan genFn lama
  if(sec.gen){
    quizQ=genUjianQOld(sec.gen,sec.maxLv);
  } else {
    quizQ=genUjianQ(sec.id,sec.maxLv);
  }
  totalTime=sec.time*60;timeLeft=totalTime;
  
  showExamIntro(si);
}

// Legacy ujian generator untuk kategori tanpa LEVEL_DEFS (advance)
function genUjianQOld(genFn,maxLv){var qs=[],used={},att=0;while(qs.length<10&&att<1000){var lv=ri(1,maxLv);var q=genFn(lv);if(q&&!used[q.question]){used[q.question]=true;q.level=lv;qs.push(q);}att++;}while(qs.length<10){var q=genFn(ri(1,maxLv));q.level=ri(1,maxLv);qs.push(q);}return qs;}

function showExamIntro(si){
  clrT();
  if(examIntroIntv) clearInterval(examIntroIntv);
  var sec = UJ_SEC[si];
  var el = document.getElementById('screen-quiz');
  var secName = tCat(sec.id);
  
  var h = '<div class="quiz-top"><div class="quiz-top-left"><button class="btn-back" id="bqq">\u2190</button>';
  h+='<span class="quiz-progress-text">'+t('quiz_prepare')+'</span></div></div>';
  h+='<div class="quiz-card" style="text-align:center; justify-content:center;">';
  h+='<div style="font-size:2.5rem; margin-bottom:10px;">\uD83D\uDCDD</div>';
  h+='<div class="result-msg" style="margin-bottom:16px; font-size:1.3rem;">'+t('quiz_exam_title',{name:secName})+'</div>';
  h+='<div style="text-align:left; background:var(--bg-alt); padding:16px; border-radius:12px; max-width:340px; margin-bottom:20px; font-size:.9rem; line-height:1.6;">';
  h+='<p style="margin-bottom:10px;">'+t('quiz_exam_time',{time:sec.time})+'</p>';
  h+='<p style="margin-bottom:0;">'+t('quiz_exam_pray')+'</p>';
  h+='</div>';
  h+='<div style="font-size:.95rem; color:var(--text-light); margin-bottom:4px;">'+t('quiz_exam_start')+'</div>';
  h+='<div id="countdown-timer" class="anim-pop" style="font-size:4rem; font-weight:900; color:var(--accent); margin:0;">5</div>';
  h+='</div>';
  el.innerHTML = h;
  sw('screen-quiz');

  document.getElementById('bqq').addEventListener('click', function(){
    if(examIntroIntv) clearInterval(examIntroIntv);
    openUjLevels();
  });

  var cd = 5;
  var cdEl = document.getElementById('countdown-timer');
  
  examIntroIntv = setInterval(function(){
    cd--;
    if(cd > 0) {
      cdEl.textContent = cd;
      cdEl.classList.remove('anim-pop');
      void cdEl.offsetWidth;
      cdEl.classList.add('anim-pop');
      // Bunyi tick setiap detik countdown (5,4,3,2,1)
      snd('tick');
    } else if (cd === 0) {
      cdEl.textContent = t('quiz_countdown_go');
      cdEl.style.color = "var(--success)";
      cdEl.classList.remove('anim-pop');
      void cdEl.offsetWidth;
      cdEl.classList.add('anim-pop');
      // Bunyi "go!" saat hitungan mencapai Mulai
      snd('go');
    } else {
      clearInterval(examIntroIntv);
      renderQuiz();
      startT();
    }
  }, 1000);
}

function startT(){clrT();updTD();timerInt=setInterval(function(){timeLeft--;updTD();if(timeLeft<=0){clrT();quizLock=true;while(quizAns.length<quizQ.length)quizAns.push(false);showResult();}else if(timeLeft<=5&&timeLeft>0){snd('tick');}},1000);}
function clrT(){if(timerInt){clearInterval(timerInt);timerInt=null;}}
function updTD(){var el=document.getElementById('qt');if(!el)return;el.textContent=fmtT(timeLeft);if(timeLeft<=60)el.classList.add('urgent');else el.classList.remove('urgent');}

function renderQuiz(){
  quizLock=false;var el=document.getElementById('screen-quiz');var q=quizQ[quizIdx];var tq=quizQ.length;
  var h='<div class="quiz-top"><div class="quiz-top-left"><button class="btn-back" id="bqq">\u2190</button>';
  h+='<span class="quiz-progress-text">'+t('quiz_question',{n:(quizIdx+1),total:tq})+'</span></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  if(isUjian)h+='<span class="quiz-timer" id="qt">'+fmtT(timeLeft)+'</span>';
  h+='<span class="quiz-cat-badge" style="background:'+curCat.color+'">';
  if(isUjian){h+=tCat(UJ_SEC[ujSecIdx].id);if(q.level)h+=' Lv.'+q.level;}else h+='Lv.'+curLv;
  h+='</span></div></div>';
  h+='<div class="quiz-dots" style="margin-bottom:8px">';
  var dotCount=tq<=15?tq:10;for(var i=0;i<dotCount;i++){var cls='quiz-dot';if(i<quizIdx)cls+=quizAns[i]?' done':' wrong';else if(i===quizIdx)cls+=' current';h+='<div class="'+cls+'"></div>';} 
  h+='</div><div class="quiz-card" id="qc">';
  if(q.emojiOnly){h+='<div class="quiz-emoji-area">'+q.question+'</div><div class="quiz-question" style="font-size:1.4rem;">'+t('quiz_count_emoji')+'</div>';}
  else if(q.isStory){var storyText=renderStoryText(q);h+='<div style="font-size:.75rem;color:'+curCat.color+';font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">'+(currentLang==='en'?'Story Problem':'Soal Cerita')+'</div><div style="font-size:1.05rem;color:var(--text);line-height:1.5;text-align:center;padding:12px 8px;background:var(--bg-alt);border-radius:12px;border-left:4px solid '+curCat.color+';max-width:100%;">'+storyText+'</div><div class="quiz-question" style="font-size:1.6rem;margin-top:8px;">= ?</div>';}
  else if(q.isEmoji&&q.emojiDisplay){h+='<div class="quiz-emoji-area">'+q.emojiDisplay+'</div><div class="quiz-question">'+q.question+' = ?</div>';}
  else h+='<div class="quiz-question">'+q.question+' = ?</div>';
  h+='<div class="quiz-input-wrap"><input type="text" class="quiz-input" id="qi" inputmode="numeric" autocomplete="off" placeholder="'+t('quiz_input_placeholder')+'"><button class="btn-submit" id="qs">'+t('quiz_submit')+'</button></div>';
  h+='<div class="quiz-feedback" id="qf"><div class="feedback-icon" id="fi"></div><div class="feedback-text" id="ft"></div><div class="feedback-answer" id="fa"></div></div></div>';
  el.innerHTML=h;
  var inp=document.getElementById('qi'),btn=document.getElementById('qs');
  setTimeout(function(){inp.focus();},150);
  inp.addEventListener('input',function(){this.value=this.value.replace(/[^0-9]/g,'');});
  function sub(){if(quizLock)return;var v=inp.value.trim();if(v==='')return;quizLock=true;var ua=parseInt(v,10),ok=ua===q.answer;quizAns.push(ok);var fb=document.getElementById('qf');
  if(ok){fb.className='quiz-feedback correct show';document.getElementById('fi').textContent='\u2714';document.getElementById('fi').style.color='var(--success)';document.getElementById('ft').textContent=t('quiz_correct',{name:getName()});document.getElementById('ft').style.color='var(--success)';document.getElementById('fa').textContent='';snd('correct');}
  else{fb.className='quiz-feedback wrong show anim-shake';document.getElementById('fi').textContent='\u2718';document.getElementById('fi').style.color='var(--danger)';document.getElementById('ft').textContent=t('quiz_wrong',{name:getName()});document.getElementById('ft').style.color='var(--danger)';document.getElementById('fa').textContent=t('quiz_answer',{ans:q.answer});snd('wrong');}
  inp.disabled=true;btn.disabled=true;setTimeout(function(){quizIdx++;if(quizIdx<quizQ.length)renderQuiz();else{clrT();showResult();}},1000);}
  btn.addEventListener('click',sub);inp.addEventListener('keydown',function(e){if(e.key==='Enter')sub();});
  document.getElementById('bqq').addEventListener('click',function(){clrT();if(isUjian)openUjLevels();else if(curCat)openLevels(curCat.id);});
  if(isUjian)updTD();
}

function showResult(){
  clrT();var cor=0;for(var i=0;i<quizAns.length;i++)if(quizAns[i])cor++;
  var tq=quizQ.length,pct=Math.round((cor/tq)*100),passed=pct>70;
  // Musik hasil kuis
  setTimeout(function(){
    if(passed){
      snd('quizPass');
      // Bintang tambahan jika skor sangat tinggi
      if(pct>=90)setTimeout(function(){snd('star');},900);
    } else {
      snd('quizFail');
    }
  },200);

  var catId=curCat.id,lv=curLv,p=progress[catId],co=curCat;
  var lu=false,cd=false;
  if(passed){
    if(p.stars[lv]<3)p.stars[lv]++;
    if(p.stars[lv]>=3&&p.unlocked<=lv&&lv<co.maxLv){p.unlocked=lv+1;lu=true;}
    if(p.stars[lv]>=3&&lv===co.maxLv)cd=true;
    saveAllUsers();
    showSaveToast();
  }
  var rc=pct>70?'#4CAF50':pct>=50?'#FFA726':'#EF5350';
  var circ=2*Math.PI*54;
  var el=document.getElementById('screen-result');
  var h='<div class="result-wrap"><div class="result-card anim-pop">';
  h+='<div class="score-ring-wrap"><svg class="score-ring" viewBox="0 0 120 120"><circle class="score-ring-bg" cx="60" cy="60" r="54"/>';
  h+='<circle class="score-ring-fg" id="rfg" cx="60" cy="60" r="54" stroke="'+rc+'" stroke-dasharray="'+circ+'" stroke-dashoffset="'+circ+'"/></svg>';
  h+='<div class="score-number"><div class="score-pct" id="sp" style="color:'+rc+'">0%</div><div class="score-label">'+t('result_score_label')+'</div></div></div>';
  h+='<div class="result-detail">'+t('result_correct_count',{cor:cor,total:tq})+'</div>';
  if(isUjian){
    var lm={};for(var i=0;i<quizQ.length;i++){var ql=quizQ[i].level||1;if(!lm[ql])lm[ql]={t:0,c:0};lm[ql].t++;if(quizAns[i])lm[ql].c++;}
    h+='<div style="text-align:left;margin:12px 0;font-size:.85rem">';
    var lvs=Object.keys(lm).sort(function(a,b){return a-b;});
    for(var i=0;i<lvs.length;i++){var lv=lvs[i],d=lm[lv];var lc=d.c>=8?'#4CAF50':d.c>=5?'#FFA726':'#EF5350';
    h+='<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)"><span>'+t('result_level',{lv:lv})+'</span><span style="color:'+lc+';font-weight:700">'+d.c+'/'+d.t+'</span></div>';}
    h+='</div><div class="result-hint">'+t('result_time',{time:fmtT(totalTime-timeLeft)})+'</div>';
  }
  h+='<div class="star-progress-bar">';for(var s=0;s<3;s++){h+='<div class="star-slot '+(s<p.stars[lv]?'earned':'empty')+'">';h+=s<p.stars[lv]?'\u2605':'\u2606';h+='</div>';}h+='</div>';
  if(!isUjian){
    if(p.stars[lv]<3)h+='<div class="result-hint">'+t('result_stars_hint',{n:(3-p.stars[lv])})+'</div>';
    else if(lu)h+='<div class="result-hint" style="background:#E8F5E9;color:#2E7D32">'+t('result_level_unlocked',{lv:(lv+1)})+'</div>';
    else if(cd)h+='<div class="result-hint" style="background:#FFF8E1;color:#F57F17">'+t('result_cat_done',{name:tCat(co.id)})+'</div>';
  }
  var msg='';
  if(passed){if(isUjian)msg=pkMsg('msg_cd')+t('result_msg_exam_done',{name:tCat(UJ_SEC[ujSecIdx].id)});else if(p.stars[lv]>=3&&lv<co.maxLv)msg=pkMsg('msg_g')+t('result_msg_3stars');else if(p.stars[lv]>=3&&lv===co.maxLv)msg=pkMsg('msg_cd');else msg=pkMsg('msg_g')+t('result_msg_stars_left',{n:(3-p.stars[lv])});}
  else msg=pkMsg('msg_ta')+t('result_msg_need_score');
  h+='<div class="result-msg">'+msg+'</div>';
  h+='<div class="result-btns"><button class="btn btn-primary" id="brt">'+t('result_retry')+'</button><button class="btn btn-secondary" id="btl">'+t('result_back')+'</button></div></div></div>';
  el.innerHTML=h;sw('screen-result');
  setTimeout(function(){var r=document.getElementById('rfg');if(r)r.style.strokeDashoffset=circ*(1-pct/100);var pe=document.getElementById('sp');if(pe)animC(pe,0,pct,1000,'%');},150);
  if(passed)launchConf(50);
  document.getElementById('brt').addEventListener('click',function(){if(isUjian)startUjian(ujSecIdx);else startQuiz(catId,lv);});
  document.getElementById('btl').addEventListener('click',function(){
    if(isUjian){openUjLevels();return;}
    if(lu)showCeleb('lu',lv,co);else if(cd)showCeleb('cd',lv,co);else openLevels(catId);
  });
}

function animC(el,f,t,d,sx){var st=performance.now();sx=sx||'';function step(ts){var p=Math.min((ts-st)/d,1);el.textContent=Math.round(f+(t-f)*(1-Math.pow(1-p,3)))+sx;if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}

function showCeleb(type,lv,co){
  // Musik perayaan level unlock atau category complete
  setTimeout(function(){
    if(type==='lu')snd('levelUnlock');
    else snd('categoryComplete');
  },150);
  var ov=document.getElementById('overlay');var h='<div class="celeb-card">';
  if(type==='lu'){h+='<div class="celeb-trophy" style="background:#FBE9E7"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF7043" stroke-width="2.5" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg></div><div class="celeb-title" style="color:#FF7043">'+pkMsg('msg_lu')+'</div><div class="celeb-desc">'+t('celeb_level_up',{lv:(lv+1),name:tCat(co.id)})+'</div>';}
  else{h+='<div class="celeb-trophy" style="background:#FFF8E1"><svg width="44" height="44" viewBox="0 0 24 24" fill="#FFB300" stroke="#F57F17" stroke-width="1"><path d="M5 3h14l-1.5 9h-11zM6.5 12L5 21h14l-1.5-9M9 21h6M10 3V1h4v2"/></svg></div><div class="celeb-title" style="color:#F57F17">'+pkMsg('msg_cd')+'</div><div class="celeb-desc">'+t('celeb_cat_done',{name:tCat(co.id)})+'</div>';}
  h+='<button class="btn btn-primary" id="bcc" style="width:100%">'+t('celeb_continue')+'</button></div>';
  ov.innerHTML=h;ov.classList.add('show');launchConf(type==='cd'?100:70);
  document.getElementById('bcc').addEventListener('click',function(){ov.classList.remove('show');var tid=co.id;setTimeout(function(){if(tid==='ujian')openUjLevels();else openLevels(tid);},400);});
}

function launchConf(n){var c=document.getElementById('confetti');c.innerHTML='';var cols=['#FF7043','#66BB6A','#42A5F5','#AB47BC','#FFA726','#EC407A','#26A69A','#FFD54F','#7E57C2'];for(var i=0;i<n;i++){var p=document.createElement('div');p.className='confetti-p';p.style.left=(Math.random()*100)+'%';p.style.backgroundColor=cols[Math.floor(Math.random()*cols.length)];p.style.width=(Math.random()*8+5)+'px';p.style.height=(Math.random()*12+5)+'px';p.style.borderRadius=Math.random()<.33?'50%':Math.random()<.5?'3px':'0';p.style.animationDelay=(Math.random()*.8)+'s';p.style.animationDuration=(Math.random()*2+2)+'s';p.style.opacity=(Math.random()*.5+.5);c.appendChild(p);}setTimeout(function(){c.innerHTML='';},5000);}

/* ================================================================
   MODAL PANDUAN PASANG APLIKASI PWA
   ================================================================ */
// Fungsi untuk menerapkan terjemahan ke elemen HTML statis (modal install, toast)
function applyTranslations() {
  var setText = function(id, text) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = text;
  };
  setText('i18n-install-title', t('install_title'));
  setText('i18n-install-intro', t('install_intro'));
  setText('i18n-tab-android', t('install_tab_android'));
  setText('i18n-tab-ios', t('install_tab_ios'));
  setText('i18n-tab-desktop', t('install_tab_desktop'));
  setText('i18n-and1', t('and_step1'));
  setText('i18n-and2', t('and_step2'));
  setText('i18n-and3', t('and_step3'));
  setText('i18n-and4', t('and_step4'));
  setText('i18n-and5', t('and_step5'));
  setText('i18n-and-note', t('and_note'));
  setText('i18n-ios1', t('ios_step1'));
  setText('i18n-ios2', t('ios_step2'));
  setText('i18n-ios3', t('ios_step3'));
  setText('i18n-ios4', t('ios_step4'));
  setText('i18n-ios5', t('ios_step5'));
  setText('i18n-ios-note', t('ios_note'));
  setText('i18n-dsk1', t('dsk_step1'));
  setText('i18n-dsk2', t('dsk_step2'));
  setText('i18n-dsk3', t('dsk_step3'));
  setText('i18n-dsk4', t('dsk_step4'));
  setText('i18n-dsk5', t('dsk_step5'));
  setText('i18n-dsk-note', t('dsk_note'));
  // Update aria-label & title sound toggle
  var soundBtn = document.getElementById('sound-toggle');
  if (soundBtn) {
    soundBtn.setAttribute('aria-label', currentLang === 'en' ? 'Enable/Disable music' : 'Aktifkan/Matikan musik');
    soundBtn.setAttribute('title', currentLang === 'en' ? 'Enable/Disable music' : 'Aktifkan/Matikan musik');
  }
  // Update toast default text
  var toast = document.getElementById('save-toast');
  if (toast && !toast.classList.contains('show')) toast.textContent = t('toast_saved');
  // Update install-close aria-label
  var installClose = document.getElementById('install-close');
  if (installClose) installClose.setAttribute('aria-label', t('install_close'));
  // Update html lang
  document.documentElement.lang = currentLang;
  // Update title tag
  document.title = currentLang === 'en' ? 'MathKu - Learning Math' : 'MathKu - Belajar Berhitung';
}

// About MathKu modal
(function initAboutModal(){
  var modal=document.getElementById('about-modal');
  if(!modal)return;
  function close(){modal.classList.remove('show');snd('click');}
  var c1=document.getElementById('about-close');if(c1)c1.addEventListener('click',close);
  var c2=document.getElementById('about-close-btn');if(c2)c2.addEventListener('click',close);
  modal.addEventListener('click',function(e){if(e.target===modal)close();});
})();

(function initInstallModal(){
  var modal=document.getElementById('install-modal');
  if(!modal)return;
  var btnClose=document.getElementById('install-close');
  if(btnClose){btnClose.addEventListener('click',function(){modal.classList.remove('show');snd('click');});}
  modal.addEventListener('click',function(e){if(e.target===modal)modal.classList.remove('show');});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('show'))modal.classList.remove('show');});
  var tabs=modal.querySelectorAll('.install-tab');
  for(var i=0;i<tabs.length;i++){(function(tab){
    tab.addEventListener('click',function(){
      snd('click');
      var platform=tab.getAttribute('data-platform');
      var allTabs=modal.querySelectorAll('.install-tab');
      for(var j=0;j<allTabs.length;j++)allTabs[j].classList.remove('active');
      var allContents=modal.querySelectorAll('.install-content');
      for(var j=0;j<allContents.length;j++)allContents[j].classList.remove('active');
      tab.classList.add('active');
      var content=modal.querySelector('.install-content[data-platform="'+platform+'"]');
      if(content)content.classList.add('active');
    });
  })(tabs[i]);}
})();

/* ================================================================
   INISIALISASI TOGGLE MUSIK & BAHASA
   ================================================================ */
(function initSoundAndLangToggle(){
  // Sound toggle
  var btn=document.getElementById('sound-toggle');
  if(btn){
    if(!SoundEngine.isEnabled())btn.classList.add('muted');
    btn.addEventListener('click',function(){
      SoundEngine.setEnabled(!SoundEngine.isEnabled());
    });
  }
  // Autoplay unlock
  function unlockAudio(){
    SoundEngine.initCtx();
    document.removeEventListener('click',unlockAudio);
    document.removeEventListener('touchstart',unlockAudio);
    document.removeEventListener('keydown',unlockAudio);
  }
  document.addEventListener('click',unlockAudio);
  document.addEventListener('touchstart',unlockAudio);
  document.addEventListener('keydown',unlockAudio);

  // Language toggle
  var langBtn=document.getElementById('lang-toggle');
  var langFlag=document.getElementById('lang-flag');
  if(langFlag) langFlag.textContent = currentLang === 'id' ? 'ID' : 'EN';
  if(langBtn){
    langBtn.addEventListener('click',function(){
      snd('click');
      var newLang = currentLang === 'id' ? 'en' : 'id';
      setLang(newLang);
      applyTranslations();
      // Re-render current screen to update dynamic text
      var activeScreen = document.querySelector('.screen.active');
      if(activeScreen){
        var sid = activeScreen.id;
        if(sid === 'screen-home') renderHome();
        else if(sid === 'screen-levels' && curCat){
          if(curCat.id === 'ujian') openUjLevels();
          else openLevels(curCat.id);
        }
        else if(sid === 'screen-quiz' && introActive) renderIntroSlide();
        else if(sid === 'screen-quiz' && quizQ.length > 0) renderQuiz();
        else if(sid === 'screen-result' && quizQ.length > 0) showResult();
      }
      // Jika di access screen, re-render
      var ov = document.getElementById('overlay');
      if(ov && ov.classList.contains('show') && users.length === 0){
        showAccessScreen();
      }
    });
  }
  // Apply translations on initial load
  applyTranslations();
})();

/* ================================================================
   PWA: TANGKAP beforeinstallprompt & REGISTER SERVICE WORKER
   ================================================================ */
(function initPWA(){
  // 1. Tangkap event beforeinstallprompt agar bisa dipicu dari tombol custom
  window._deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e){
    // Cegah prompt default muncul otomatis
    e.preventDefault();
    window._deferredInstallPrompt = e;
    console.log('[PWA] beforeinstallprompt captured - tombol Pasang Aplikasi siap');
    // Beri indikator visual pada tombol (badge dot)
    var btn = document.getElementById('btn-install');
    if(btn){
      btn.classList.add('install-ready');
      btn.title = 'Klik untuk pasang MathKu di perangkat Anda';
    }
  });

  // 2. Deteksi jika aplikasi sudah terpasang (tombol bisa disembunyikan)
  window.addEventListener('appinstalled', function(){
    console.log('[PWA] App installed successfully');
    window._deferredInstallPrompt = null;
    var btn = document.getElementById('btn-install');
    if(btn) btn.style.display = 'none';
    // Tampilkan toast konfirmasi
    var toast = document.getElementById('save-toast');
    if(toast){
      toast.textContent = t('toast_install_success');
      toast.classList.add('show');
      setTimeout(function(){
        toast.classList.remove('show');
        toast.textContent = t('toast_saved');
      }, 3000);
    }
  });

  // 3. Deteksi mode standalone (sudah dijalankan dari home screen)
  // - android display-mode: standalone
  // - iOS: navigator.standalone
  function isStandalone(){
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
        || window.navigator.standalone === true;
  }
  if(isStandalone()){
    // Sembunyikan tombol install jika sudah berjalan sebagai app
    var btn = document.getElementById('btn-install');
    if(btn) btn.style.display = 'none';
    console.log('[PWA] Running in standalone mode');
  }

  // 4. Register service worker (hanya jika mendukung & protocol https/http localhost)
  if('serviceWorker' in navigator){
    // Register setelah load agar tidak blocking
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js')
        .then(function(reg){
          console.log('[PWA] Service Worker registered:', reg.scope);
        })
        .catch(function(err){
          console.warn('[PWA] SW registration failed:', err.message);
        });
    });
  } else {
    console.warn('[PWA] Service Worker not supported in this browser');
  }
})();

startApp();
