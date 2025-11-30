// ============================================================
// VALO MARKET - Main Application (FIXED VERSION)
// แก้ไขปัญหา: เปลี่ยน AuthService เป็น FirebaseAuth ให้ตรงกับ Config
// ============================================================

// ------------------------------------------------------------
// PART 1: GLOBAL STATE
// ------------------------------------------------------------

let currentUser = null;
let currentUserData = null;
let listingsCache = [];
let isAdmin = false;
let currentDepositAmount = 0;
let slipFile = null;
let uploadedImages = [];
let uploadedFiles = [];
let confirmationResult = null; 

// ------------------------------------------------------------
// PART 2: UTILITY FUNCTIONS (Helper Functions)
// ------------------------------------------------------------

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showModal(modalId) { 
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) { 
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function showAuthModal() { closeModal('registerModal'); showModal('authModal'); }
function showDepositModal() { showModal('depositModal'); }
function showWithdrawModal() { showModal('withdrawModal'); }
function showAdminLoginModal() { showModal('adminLoginModal'); }

function closeDropdown() { 
    const d = document.getElementById('userDropdown');
    if(d) d.style.display = 'none'; 
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

function logout() {
    // แก้ไข: ใช้ FirebaseAuth แทน AuthService
    if (typeof FirebaseAuth !== 'undefined') {
        FirebaseAuth.signOut();
    } else {
        console.error("FirebaseAuth not found!");
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) link.classList.add('active');
    });

    if (pageId === 'dashboard' && currentUser) renderDashboard();
    if (pageId === 'marketplace') renderListings();
    if (pageId === 'admin') {
        if (!isAdmin) {
            showPage('home');
            showAdminLoginModal();
        } else {
            // โหลดข้อมูล Admin เบื้องต้น
            renderAdminListings();
        }
    }
}

function updateUI() {
    const userCoinsEl = document.getElementById('userCoins');
    const authBtnEl = document.getElementById('authBtn');
    const userMenuEl = document.getElementById('userMenu');
    const coinsDisplayEl = document.getElementById('coinsDisplay');
    const userNameEl = document.getElementById('userName');

    if (currentUser) {
        if (userCoinsEl && currentUserData) userCoinsEl.textContent = (currentUserData.coins || 0).toLocaleString();
        if (authBtnEl) authBtnEl.style.display = 'none';
        if (userMenuEl) userMenuEl.style.display = 'flex';
        if (coinsDisplayEl) coinsDisplayEl.style.display = 'flex';
        if (userNameEl) userNameEl.textContent = currentUserData?.username || 'User';
    } else {
        if (authBtnEl) authBtnEl.style.display = 'block';
        if (userMenuEl) userMenuEl.style.display = 'none';
        if (coinsDisplayEl) coinsDisplayEl.style.display = 'none';
    }
}

async function loadListings() {
    if (typeof FirebaseDB !== 'undefined') {
        listingsCache = await FirebaseDB.getApprovedListings();
        renderListings();
    }
    const statSalesEl = document.getElementById('statSales');
    const statUsersEl = document.getElementById('statUsers');
    if (statSalesEl) statSalesEl.textContent = (listingsCache.length * 12 + 50).toLocaleString(); 
    if (statUsersEl) statUsersEl.textContent = (2500 + Math.floor(Math.random() * 500)).toLocaleString();
}

// ------------------------------------------------------------
// PART 3: APP INITIALIZATION & EVENT LISTENERS
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. ระบบกันหน้าค้าง (Safety Timeout)
    // ถ้าผ่านไป 3 วินาทีแล้ว Firebase ยังไม่ตอบสนอง ให้ปิดหน้า Loading ทันที
    setTimeout(() => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay && overlay.style.display !== 'none') {
            console.warn("Loading timed out. Forcing UI display.");
            showLoading(false);
        }
    }, 3000);

    // 2. ตั้งค่า reCAPTCHA
    if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined' && document.getElementById('authBtn')) {
        try {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('authBtn', { 'size': 'invisible' });
            window.recaptchaVerifier.render();
        } catch (e) { console.error("Recaptcha error:", e); }
    }
    
    // 3. ตรวจสอบสถานะผู้ใช้ (แก้ไขชื่อเป็น FirebaseAuth)
    if (typeof FirebaseAuth !== 'undefined') {
        FirebaseAuth.onAuthStateChanged(async (user) => {
            currentUser = user;
            // ตั้งค่า ADMIN UID (เปลี่ยนเป็น UID ของคุณ)
            isAdmin = user && user.uid === 'L58J891uO5g5x6Xg1rB2'; 

            if (user) {
                if (typeof FirebaseDB !== 'undefined') {
                    currentUserData = await FirebaseDB.getUser(user.uid);
                }
            } else {
                currentUserData = null;
            }
            
            updateUI(); 
            await loadListings();
            showPage('home'); 
            showLoading(false); // ปิดหน้า Loading เมื่อเสร็จสมบูรณ์
        });
    } else {
        console.error('FirebaseAuth is not defined! Check firebase-config.js');
        showLoading(false); // ปิดหน้า Loading แม้มี Error
    }
    
    // ------------------------------------------------------------
    // 4. EVENT LISTENERS (เชื่อมปุ่มต่างๆ)
    // ------------------------------------------------------------

    // ปุ่มเปลี่ยนหน้าใน Navbar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // ปุ่มเปิดหน้า Login
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.addEventListener('click', () => {
            showAuthModal();
        });
    }

    // ปุ่ม Login ด้วย Google (แก้ไขเป็น FirebaseAuth)
    const googleLoginBtn = document.querySelector('.btn-google'); // ใช้ class แทนถ้าไม่มี id
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            if (typeof FirebaseAuth === 'undefined') return;
            try {
                showLoading(true);
                await FirebaseAuth.signInWithGoogle();
                closeModal('authModal');
                showToast('เข้าสู่ระบบสำเร็จ', 'success');
            } catch (error) {
                console.error("Google Login Error:", error);
                showToast('เข้าสู่ระบบล้มเหลว', 'error');
            } finally {
                showLoading(false);
            }
        });
    }

    // ปุ่ม Admin (ใน Navbar)
    const adminBtn = document.querySelector('.btn-admin'); // อ้างอิงจาก index.html
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            if (isAdmin) {
                showPage('admin');
            } else {
                showAdminLoginModal();
            }
        });
    }

    // ปุ่ม Login Admin (ใน Modal)
    const adminLoginBtn = document.querySelector('#adminLoginModal .btn-primary');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            const password = document.getElementById('adminPassword').value;
            if (password === 'admin123') { // รหัสผ่านชั่วคราว
                isAdmin = true;
                closeModal('adminLoginModal');
                showPage('admin');
                showToast('ยินดีต้อนรับแอดมิน', 'success');
            } else {
                showToast('รหัสผ่านผิด', 'error');
            }
        });
    }

    // ปุ่ม Logout (ใน Dropdown)
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', () => {
            logout();
            closeDropdown();
            showPage('home');
            showToast('ออกจากระบบแล้ว', 'info');
        });
    }
});

// ------------------------------------------------------------
// PART 4: DATA RENDERING & HELPERS
// ------------------------------------------------------------

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-circle', info: 'info-circle' };
    toast.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Formatters
function formatRank(rank) {
    const ranks = { radiant: 'Radiant', immortal: 'Immortal', ascendant: 'Ascendant', diamond: 'Diamond', platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze', iron: 'Iron' };
    return ranks[rank] || rank || '-';
}
function getBadgeText(badge) { return { new: 'ใหม่', hot: 'ขายดี', featured: 'แนะนำ' }[badge] || badge; }
function getMethodText(method) { return { promptpay: 'พร้อมเพย์', truewallet: 'TrueMoney', bank: 'โอนธนาคาร' }[method] || method; }
function getBankName(bank) { return { kbank: 'กสิกรไทย', scb: 'ไทยพาณิชย์', bbl: 'กรุงเทพ', ktb: 'กรุงไทย', tmb: 'ทหารไทยธนชาต' }[bank] || bank; }
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Render Listings
function renderListings() {
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;
    if (listingsCache.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-store-slash"></i><p>ไม่พบไอดีที่ต้องการ</p></div>';
        return;
    }
    grid.innerHTML = listingsCache.map(listing => `
        <div class="listing-card" onclick="viewListing('${listing.id}')">
            ${listing.badge ? `<span class="listing-badge ${listing.badge}">${getBadgeText(listing.badge)}</span>` : ''}
            <div class="listing-image"><img src="${listing.images?.[0] || 'https://via.placeholder.com/300x200'}" alt="${listing.title}"></div>
            <div class="listing-content">
                <h3>${listing.title || 'Valorant Account'}</h3>
                <div class="listing-rank ${listing.rank}"><i class="fas fa-trophy"></i> ${formatRank(listing.rank)}</div>
                <div class="listing-details"><span><i class="fas fa-palette"></i> ${listing.skins || 0} Skins</span></div>
                <div class="listing-footer">
                    <span class="listing-price">฿${(listing.price || 0).toLocaleString()}</span>
                    <span class="listing-seller"><i class="fas fa-user"></i> ${listing.sellerName || 'Seller'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ฟังก์ชันอื่นๆ ที่จำเป็น (Filter, Admin Render) - ใส่แบบย่อเพื่อความกระชับแต่ทำงานได้
function filterListings() {
    const search = document.getElementById('searchInput')?.value.toLowerCase();
    const priceRange = document.getElementById('filterPrice')?.value;
    const rank = document.getElementById('filterRank')?.value;
    
    let filtered = [...listingsCache];
    if (search) filtered = filtered.filter(l => (l.title || '').toLowerCase().includes(search));
    if (rank) filtered = filtered.filter(l => l.rank === rank);
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filtered = filtered.filter(l => (l.price >= min && l.price <= max));
    }
    
    // Render เฉพาะ filtered แต่ไม่ทับ cache หลัก
    const tempCache = listingsCache; 
    listingsCache = filtered; 
    renderListings();
    listingsCache = tempCache; // คืนค่า cache
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterPrice').value = '';
    document.getElementById('filterRank').value = '';
    renderListings();
}

// Admin Functions (Placeholder)
async function renderAdminListings() {
    const container = document.getElementById('adminListingsTable');
    if(container && listingsCache.length > 0) {
        container.innerHTML = listingsCache.map(l => `
            <div class="admin-item">
                <h4>${l.title}</h4>
                <button class="btn-sm btn-reject" onclick="deleteListing('${l.id}')">ลบ</button>
            </div>`).join('');
    }
}
function viewListing(id) { showToast('คลิกดูรายละเอียด ID: ' + id, 'info'); }

// ------------------------------------------------------------
// END OF FILE
// ------------------------------------------------------------
