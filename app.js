// ============================================================
// 🚨 SYSTEM SAFETY: ระบบกันหน้าค้าง (ทำงานทันทีที่โหลดไฟล์)
// ============================================================
// ถ้าผ่านไป 3.5 วินาที หน้า Loading ยังไม่หาย ให้บังคับปิดทันที
setTimeout(function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay && overlay.style.display !== 'none') {
        overlay.style.display = 'none';
        console.warn("⚠️ System Force-Opened: Loading took too long.");
    }
}, 3500);

// ============================================================
// 1. GLOBAL VARIABLES (ตัวแปรหลักของระบบ)
// ============================================================
let currentUser = null;
let currentUserData = null;
let listingsCache = [];
let isAdmin = false;
let currentDepositAmount = 0;
let slipFile = null;
let uploadedImages = [];
let uploadedFiles = [];

// ============================================================
// 2. UI FUNCTIONS (ฟังก์ชันจัดการหน้าจอ - เรียกใช้จาก HTML ได้ทันที)
// ============================================================

// แสดง/ซ่อน หน้า Loading
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

// เปิด/ปิด Modal (หน้าต่างเด้ง)
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// ฟังก์ชันเฉพาะสำหรับปุ่มต่างๆ ใน HTML
function showAuthModal() {
    closeModal('registerModal');
    showModal('authModal');
}

function showDepositModal() { showModal('depositModal'); }
function showWithdrawModal() { showModal('withdrawModal'); }
function showAdminLoginModal() { showModal('adminLoginModal'); }

// สลับแท็บในหน้า Login
function switchAuthTab(tab, btn) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

// เมนู User Dropdown
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
    }
}
function closeDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.style.display = 'none';
}

// ฟังก์ชันเปลี่ยนหน้า (Navigation)
function showPage(pageId) {
    // 1. ซ่อนทุกหน้า
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // 2. แสดงหน้าเป้าหมาย
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error(`ไม่พบหน้า: page-${pageId}`);
        return;
    }

    // 3. อัปเดตปุ่มเมนูให้ Active
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) link.classList.add('active');
    });

    // 4. โหลดข้อมูลเฉพาะหน้า (ถ้าจำเป็น)
    if (pageId === 'marketplace') renderListings();
    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'admin') {
        if (!isAdmin) {
            showPage('home'); // ถ้าไม่ใช่แอดมิน ดีดกลับหน้าแรก
            showAdminLoginModal();
        } else {
            // โหลดข้อมูลแอดมิน (ถ้ามีฟังก์ชัน)
            if(typeof renderAdminListings === 'function') renderAdminListings();
        }
    }
}

// ============================================================
// 3. AUTHENTICATION (ระบบสมาชิก)
// ============================================================

async function loginWithGoogle() {
    // เช็คว่า Firebase โหลดหรือยัง
    if (typeof FirebaseAuth === 'undefined') {
        alert("ระบบกำลังโหลด กรุณารอสักครู่...");
        return;
    }

    try {
        showLoading(true);
        await FirebaseAuth.signInWithGoogle();
        closeModal('authModal');
        // showToast('เข้าสู่ระบบสำเร็จ', 'success'); // ถ้ามีฟังก์ชัน Toast
    } catch (error) {
        console.error("Login Error:", error);
        alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
    } finally {
        showLoading(false);
    }
}

function logout() {
    if (typeof FirebaseAuth !== 'undefined') {
        FirebaseAuth.signOut();
        closeDropdown();
        showPage('home');
    }
}

// ระบบ Admin Login แบบง่าย (ตามที่คุณขอ)
function loginAdmin() {
    const password = document.getElementById('adminPassword').value;
    if (password === 'admin123') { // รหัสผ่านทดสอบ
        isAdmin = true;
        closeModal('adminLoginModal');
        showPage('admin');
        alert("ยินดีต้อนรับ Admin");
    } else {
        alert("รหัสผ่านไม่ถูกต้อง");
    }
}

// ฟังก์ชันอัปเดตหน้าจอตามสถานะ Login
function updateUI() {
    const userMenu = document.getElementById('userMenu');
    const authBtn = document.getElementById('authBtn');
    const coinsDisplay = document.getElementById('coinsDisplay');
    
    if (currentUser) {
        // กรณีล็อกอินแล้ว
        if (userMenu) userMenu.style.display = 'flex';
        if (authBtn) authBtn.style.display = 'none';
        if (coinsDisplay) coinsDisplay.style.display = 'flex';
        
        // อัปเดตข้อมูล
        document.getElementById('userName').textContent = currentUserData?.username || currentUser.displayName || 'User';
        document.getElementById('userCoins').textContent = (currentUserData?.coins || 0).toLocaleString();
        
        // แสดงรูปโปรไฟล์ (ถ้ามี)
        const avatarImg = document.getElementById('userAvatarImg');
        const defaultAvatar = document.getElementById('defaultAvatar');
        if (currentUser.photoURL && avatarImg) {
            avatarImg.src = currentUser.photoURL;
            avatarImg.style.display = 'block';
            if (defaultAvatar) defaultAvatar.style.display = 'none';
        }
    } else {
        // กรณี Guest (ยังไม่ล็อกอิน)
        if (userMenu) userMenu.style.display = 'none';
        if (authBtn) authBtn.style.display = 'block';
        if (coinsDisplay) coinsDisplay.style.display = 'none';
    }
}

// ============================================================
// 4. MARKETPLACE LOGIC (ระบบตลาด)
// ============================================================

async function loadListings() {
    if (typeof FirebaseDB !== 'undefined') {
        // ดึงข้อมูลสินค้าที่อนุมัติแล้ว
        listingsCache = await FirebaseDB.getApprovedListings();
        renderListings();
        
        // อัปเดตตัวเลขหน้าเว็บ (Stats)
        const statSales = document.getElementById('statSales');
        if(statSales) statSales.textContent = (listingsCache.length * 5 + 100).toLocaleString();
    }
}

function renderListings() {
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;

    if (listingsCache.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>ยังไม่มีสินค้าในขณะนี้</p></div>';
        return;
    }

    grid.innerHTML = listingsCache.map(listing => `
        <div class="listing-card" onclick="viewListing('${listing.id}')">
            <div class="listing-image" style="background:#222; height:180px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                <img src="${listing.images?.[0] || ''}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'">
            </div>
            <div class="listing-content" style="padding:15px;">
                <h3 style="margin:0 0 5px 0; font-size:1.1rem;">${listing.title || 'Valorant Account'}</h3>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#ff4655; font-weight:bold; font-size:1.2rem;">฿${(listing.price || 0).toLocaleString()}</span>
                    <span style="font-size:0.9rem; color:#888;">${formatRank(listing.rank)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewListing(id) {
    alert("ดูรายละเอียดสินค้า ID: " + id + "\n(ฟังก์ชันนี้จะทำงานสมบูรณ์เมื่อคุณเพิ่มหน้า Listing Detail)");
}

// Helpers
function formatRank(rank) {
    const ranks = { radiant:'Radiant', immortal:'Immortal', ascendant:'Ascendant', diamond:'Diamond', platinum:'Platinum', gold:'Gold', silver:'Silver', bronze:'Bronze', iron:'Iron' };
    return ranks[rank] || rank || '-';
}

function renderDashboard() {
    // ฟังก์ชัน Placeholder ป้องกัน Error ถ้าเรียกหน้า Dashboard
    if(currentUser) {
        document.getElementById('dashCoins').textContent = (currentUserData?.coins || 0).toLocaleString();
    }
}

// ============================================================
// 5. INITIALIZATION (เริ่มทำงานเมื่อเว็บโหลดเสร็จ)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Application Initializing...");

    // 1. ตรวจสอบ Firebase
    if (typeof FirebaseAuth !== 'undefined') {
        
        // ฟังสถานะ Login
        FirebaseAuth.onAuthStateChanged(async (user) => {
            console.log("👤 Auth State:", user ? "Logged In" : "Guest");
            currentUser = user;
            
            // เช็คว่าเป็น Admin หรือไม่ (เปลี่ยน UID ตรงนี้ให้เป็นของคุณ)
            isAdmin = (user && user.uid === 'L58J891uO5g5x6Xg1rB2'); 

            // โหลดข้อมูล User
            if (user && typeof FirebaseDB !== 'undefined') {
                try {
                    currentUserData = await FirebaseDB.getUser(user.uid);
                } catch (e) { console.error("Get User Error:", e); }
            } else {
                currentUserData = null;
            }

            // เริ่มต้นระบบ
            updateUI();
            await loadListings();
            
            // ปิดหน้า Loading (สำคัญ!)
            showLoading(false);
        });

    } else {
        console.error("❌ Critical: FirebaseAuth Not Found. Check firebase-config.js");
        // ถ้า Firebase พัง ให้เปิดหน้าเว็บเลยจะได้ไม่ค้าง
        showLoading(false);
    }
});
