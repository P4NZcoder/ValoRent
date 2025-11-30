// ============================================================
// 🚨 EMERGENCY UNLOCK: บังคับปิดหน้า Loading ภายใน 3 วินาที
// ============================================================
setTimeout(function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay && overlay.style.display !== 'none') {
        overlay.style.display = 'none';
        console.warn("⚠️ Force opened the page because loading took too long.");
    }
}, 3000); // 3000ms = 3 วินาที

// ============================================================
// VALO MARKET - Main Application
// ============================================================

// 1. GLOBAL VARIABLES
let currentUser = null;
let currentUserData = null;
let listingsCache = [];
let isAdmin = false;
let confirmationResult = null; 

// 2. HELPER FUNCTIONS
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function showModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

function showAuthModal() { closeModal('registerModal'); showModal('authModal'); }
function showDepositModal() { showModal('depositModal'); }
function showWithdrawModal() { showModal('withdrawModal'); }
function showAdminLoginModal() { showModal('adminLoginModal'); }
function closeDropdown() { document.getElementById('userDropdown')?.setAttribute('style', 'display: none'); }

function toggleUserDropdown() {
    const d = document.getElementById('userDropdown');
    if(d) d.style.display = (d.style.display === 'block') ? 'none' : 'block';
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`)?.classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-page="${pageId}"]`)?.classList.add('active');

    if(pageId === 'marketplace') renderListings();
}

function showToast(msg, type='info') {
    const box = document.getElementById('toastContainer');
    if(!box) return;
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = `<span>${msg}</span>`;
    box.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// 3. MAIN LOGIC
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 App Started...");

    try {
        // เชื่อมต่อปุ่มต่างๆ (Event Listeners)
        document.querySelectorAll('.nav-link').forEach(btn => {
            btn.addEventListener('click', (e) => showPage(e.target.getAttribute('data-page')));
        });

        const authBtn = document.getElementById('authBtn');
        if(authBtn) authBtn.addEventListener('click', showAuthModal);

        const adminBtn = document.querySelector('.btn-admin');
        if(adminBtn) adminBtn.addEventListener('click', () => {
             isAdmin ? showPage('admin') : showAdminLoginModal();
        });

        // ปุ่ม Login Google
        const googleBtn = document.querySelector('.btn-google');
        if(googleBtn) {
            googleBtn.addEventListener('click', async () => {
                if(typeof FirebaseAuth === 'undefined') {
                    alert("ระบบ Login ยังไม่พร้อม (Firebase Config Error)");
                    return;
                }
                showLoading(true);
                try {
                    await FirebaseAuth.signInWithGoogle();
                    closeModal('authModal');
                } catch(e) {
                    console.error(e);
                    alert("Login Failed");
                }
                showLoading(false);
            });
        }

        // เริ่มต้น Firebase Auth Listener
        if (typeof FirebaseAuth !== 'undefined') {
            FirebaseAuth.onAuthStateChanged(async (user) => {
                currentUser = user;
                isAdmin = (user?.uid === 'L58J891uO5g5x6Xg1rB2'); // แก้ UID แอดมินตรงนี้
                
                // อัปเดต UI ตามสถานะล็อกอิน
                const userMenu = document.getElementById('userMenu');
                const loginBtn = document.getElementById('authBtn');
                
                if(user) {
                    if(userMenu) userMenu.style.display = 'flex';
                    if(loginBtn) loginBtn.style.display = 'none';
                    if(document.getElementById('userName')) {
                        document.getElementById('userName').textContent = user.displayName || 'User';
                    }
                } else {
                    if(userMenu) userMenu.style.display = 'none';
                    if(loginBtn) loginBtn.style.display = 'block';
                }

                // โหลดรายการสินค้า
                if(typeof FirebaseDB !== 'undefined') {
                    listingsCache = await FirebaseDB.getApprovedListings();
                    renderListings();
                }

                // *** ปิดหน้า Loading ทันทีที่โหลดเสร็จ ***
                showLoading(false);
            });
        } else {
            console.error("❌ FirebaseAuth is missing. Check firebase-config.js");
            // ถ้าไม่มี Firebase ให้เปิดหน้าเว็บเลย
            showLoading(false);
        }

    } catch (error) {
        console.error("🔥 Critical Error:", error);
        // ถ้ามี error ร้ายแรง ให้เปิดหน้าเว็บเลย
        showLoading(false);
    }
});

// 4. RENDER FUNCTIONS
function renderListings() {
    const grid = document.getElementById('listingsGrid');
    if(!grid) return;
    if(listingsCache.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%;">ไม่มีสินค้าในขณะนี้</p>';
        return;
    }
    grid.innerHTML = listingsCache.map(l => `
        <div class="listing-card">
            <div class="listing-image" style="background:#333; height:200px;">
                <img src="${l.images?.[0] || ''}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="listing-content" style="padding:10px;">
                <h3>${l.title || 'Valorant ID'}</h3>
                <p>ราคา: ฿${(l.price||0).toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}
// ============================================================
// VALO MARKET - Main Application (COMPLETE VERSION)
// แก้ไขปัญหา: Loading ค้าง และ ปุ่มไม่ทำงาน
// ============================================================

// ------------------------------------------------------------
// PART 1: GLOBAL STATE AND ESSENTIAL HELPERS (CRITICAL)
// ------------------------------------------------------------

// Global State Variables
let currentUser = null;
let currentUserData = null;
let listingsCache = [];
let isAdmin = false;
let currentDepositAmount = 0;
let slipFile = null;
let uploadedImages = [];
let uploadedFiles = [];
let confirmationResult = null; // สำหรับ Phone Auth OTP

// Utility functions ที่จำเป็น
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}
function showModal(modalId) { document.getElementById(modalId)?.classList.add('active'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('active'); }
function showAuthModal() { closeModal('registerModal'); showModal('authModal'); }
function showDepositModal() { showModal('depositModal'); }
function showWithdrawModal() { showModal('withdrawModal'); }
function showAdminLoginModal() { showModal('adminLoginModal'); }
function closeDropdown() { document.getElementById('userDropdown')?.style.display = 'none'; }
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}
function logout() {
    if (typeof AuthService !== 'undefined') {
        AuthService.signOut();
    }
}

// ------------------------------------------------------------
// PART 2: PAGE & UI LOGIC
// ------------------------------------------------------------

// ฟังก์ชันเปลี่ยนหน้า (Page Switching)
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    const pageEl = document.getElementById(`page-${pageId}`);
    if (pageEl) {
        pageEl.classList.add('active');
    } else {
        console.error(`Page element with ID 'page-${pageId}' not found.`);
        return;
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) link.classList.add('active');
    });

    // ตรวจสอบและเรนเดอร์เนื้อหาเฉพาะหน้า
    if (pageId === 'dashboard' && currentUser) renderDashboard();
    if (pageId === 'marketplace') renderListings();
    if (pageId === 'admin') {
        if (isAdmin) {
            // Assume the first admin tab is 'pending'
            const firstAdminTab = document.querySelector('.admin-nav-item[data-tab="pending"]');
            if(firstAdminTab) switchAdminTab('pending', firstAdminTab);
        } else {
            showPage('home'); // Redirect if not admin
            showAdminLoginModal();
        }
    }
}

// ฟังก์ชันอัปเดต UI (แสดง Coins, ปุ่ม Login/User Menu)
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

// ฟังก์ชันโหลด Listings ครั้งแรก
async function loadListings() {
    if (typeof FirebaseDB !== 'undefined') {
        listingsCache = await FirebaseDB.getApprovedListings();
        renderListings();
    }
    // อัปเดต Stats หน้าแรก (อ้างอิงจาก index.html)
    const statSalesEl = document.getElementById('statSales');
    const statUsersEl = document.getElementById('statUsers');
    
    if (statSalesEl) statSalesEl.textContent = (listingsCache.length * 12 + 50).toLocaleString(); 
    if (statUsersEl) statUsersEl.textContent = (2500 + Math.floor(Math.random() * 500)).toLocaleString();
}

// ============================================================
// PART 3: APPLICATION INITIALIZATION & EVENT LISTENERS (THE FIX)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. ตั้งค่า reCAPTCHA สำหรับ Phone Auth
    if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined' && document.getElementById('authBtn')) {
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('authBtn', { 'size': 'invisible' });
        window.recaptchaVerifier.render();
    }
    
    // 2. ฟังการเปลี่ยนแปลงสถานะผู้ใช้ (CRITICAL for Loading Screen)
    if (typeof AuthService !== 'undefined') {
        AuthService.onAuthStateChanged(async (user) => {
            currentUser = user;
            // ตั้งค่า ADMIN UID ของคุณที่นี่
            isAdmin = user && user.uid === 'L58J891uO5g5x6Xg1rB2'; // เปลี่ยนเป็น Admin UID จริงของคุณ

            if (user) {
                if (typeof FirebaseDB !== 'undefined') {
                    currentUserData = await FirebaseDB.getUser(user.uid);
                }
            } else {
                currentUserData = null;
            }
            
            // *** FIX: ซ่อนหน้า Loading เมื่อตรวจสอบสถานะเสร็จแล้ว ***
            showLoading(false); 
            
            // 3. รันโค้ดเริ่มต้น
            updateUI(); 
            await loadListings(); 
            
            // 4. แสดงหน้าแรก (Home)
            showPage('home'); 
        });
    } else {
        // Fallback หาก Firebase โหลดไม่สำเร็จ
        showLoading(false);
        console.error('AuthService is not defined. Firebase loading likely failed.');
        showPage('home');
    }
    
    // ============================================================
    // 5. EVENT LISTENERS (การแก้ไขหลักที่ทำให้ปุ่มทำงาน)
    // ============================================================

    // ปุ่ม Navbar: ใช้ showPage()
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // ปุ่มเปิด Modal เข้าสู่ระบบ (Auth Button)
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.addEventListener('click', () => {
            // ปิด Modal อื่นๆ แล้วเปิด Auth Modal
            document.querySelectorAll('.modal').forEach(m => closeModal(m.id));
            showAuthModal();
        });
    }

    // ปุ่ม Login Google
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn && typeof AuthService !== 'undefined') {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                showLoading(true);
                await AuthService.signInWithGoogle();
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

    // ปุ่มเปิด Admin Login
    const adminLink = document.getElementById('adminLink'); // ตรวจสอบ ID ใน index.html
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAdmin) {
                showPage('admin');
            } else {
                showAdminLoginModal();
            }
        });
    }

    // ปุ่ม Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            closeDropdown();
            showPage('home');
            showToast('ออกจากระบบแล้ว', 'info');
        });
    }

    // ปุ่ม Admin Login Submit (Placeholder for actual logic)
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value;
            // ⚠️ ใช้รหัสผ่านแบบง่ายตาม README (ต้องเปลี่ยนใน Production)
            if (password === 'admin123') { 
                isAdmin = true; // ตั้งค่าสถานะ Admin
                closeModal('adminLoginModal');
                showPage('admin');
                showToast('เข้าสู่ระบบ Admin สำเร็จ', 'success');
                document.getElementById('adminPassword').value = '';
                await updateAdminBadges();
            } else {
                showToast('รหัสผ่าน Admin ไม่ถูกต้อง', 'error');
            }
        });
    }
    
    // ปุ่ม Submit สำหรับ Phone Auth (Placeholder)
    const sendOtpForm = document.getElementById('sendOtpForm');
    if(sendOtpForm) {
        sendOtpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phoneNumber = document.getElementById('phoneNumber').value;
            try {
                showLoading(true);
                confirmationResult = await AuthService.sendOTP(phoneNumber, window.recaptchaVerifier);
                document.getElementById('otpSendSuccess').style.display = 'block';
                document.getElementById('sendOtpForm').style.display = 'none';
                document.getElementById('verifyOtpForm').style.display = 'block';
                showToast('ส่ง OTP แล้ว', 'info');
            } catch (error) {
                console.error("OTP Send Error:", error);
                showToast('ส่ง OTP ล้มเหลว', 'error');
                window.recaptchaVerifier.render(); // รีเซ็ต recaptcha
            } finally {
                showLoading(false);
            }
        });
    }
    
    // ปุ่ม Verify OTP (Placeholder)
    const verifyOtpForm = document.getElementById('verifyOtpForm');
    if(verifyOtpForm) {
        verifyOtpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otpCode = document.getElementById('otpCode').value;
            if(!confirmationResult) {
                showToast('กรุณาส่ง OTP ก่อน', 'warning');
                return;
            }
            try {
                showLoading(true);
                await AuthService.verifyOTP(confirmationResult, otpCode);
                // onAuthStateChanged จะจัดการการเข้าสู่ระบบต่อ
                closeModal('authModal');
                showToast('ยืนยัน OTP สำเร็จ', 'success');
            } catch (error) {
                console.error("OTP Verify Error:", error);
                showToast('OTP ไม่ถูกต้อง', 'error');
            } finally {
                showLoading(false);
            }
        });
    }
    
});

// ============================================================
// PART 4: USER'S EXISTING CODE (Renderings, Submits, Actions)
// ============================================================

// Continue from renderAdminListings...

async function renderAdminListings() {
    const container = document.getElementById('adminListingsTable');
    
    try {
        container.innerHTML = listingsCache.map(listing => `
            <div class="admin-item">
                <div class="admin-item-image"><img src="${listing.images?.[0] || 'https://via.placeholder.com/60'}" alt=""></div>
                <div class="admin-item-info">
                    <h4>${listing.title || 'ไม่มีชื่อ'}</h4>
                    <p>ราคา: ฿${(listing.price || 0).toLocaleString()} | Rank: ${formatRank(listing.rank)}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-sm btn-edit" onclick="openEditImageModal('${listing.id}')"><i class="fas fa-image"></i> แก้ไขรูป</button>
                    <button class="btn-sm btn-reject" onclick="deleteListing('${listing.id}')"><i class="fas fa-trash"></i> ลบ</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering admin listings:', error);
    }
}

function openEditImageModal(listingId) {
    const listing = listingsCache.find(l => l.id === listingId);
    if (!listing) return;
    
    document.getElementById('editImageListingId').value = listingId;
    document.getElementById('currentListingImage').src = listing.images?.[0] || '';
    document.getElementById('newImageUrl').value = '';
    document.getElementById('newImagePreview').style.display = 'none';
    showModal('editImageModal');
}

function previewNewListingImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewNewImage').src = e.target.result;
            document.getElementById('newImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function saveListingImage() {
    const listingId = document.getElementById('editImageListingId').value;
    const newUrl = document.getElementById('newImageUrl').value.trim();
    const fileInput = document.getElementById('newListingImage');
    
    try {
        showLoading(true);
        let imageUrl = newUrl;
        
        if (fileInput.files[0] && typeof FirebaseStorage !== 'undefined') {
            imageUrl = await FirebaseStorage.uploadImage(fileInput.files[0], `listings/${listingId}/main.jpg`);
        }
        
        if (imageUrl && typeof FirebaseDB !== 'undefined') {
            const listing = listingsCache.find(l => l.id === listingId);
            if (listing) {
                const images = listing.images || [];
                images[0] = imageUrl;
                await FirebaseDB.updateListing(listingId, { images });
            }
        }
        
        closeModal('editImageModal');
        await loadListings();
        renderAdminListings();
        showToast('บันทึกรูปภาพแล้ว', 'success');
    } catch (error) {
        console.error('Error saving image:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteListing(id) {
    if (!confirm('ต้องการลบประกาศนี้?')) return;
    
    try {
        showLoading(true);
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.deleteListing(id);
        }
        await loadListings();
        renderAdminListings();
        showToast('ลบแล้ว', 'success');
    } catch (error) {
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

async function renderDepositsList() {
    const container = document.getElementById('depositsList');
    
    try {
        let deposits = [];
        if (typeof FirebaseDB !== 'undefined') {
            deposits = await FirebaseDB.getPendingDeposits();
        }
        
        if (deposits.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>ไม่มีรายการรอตรวจสอบ</p></div>';
            return;
        }
        
        container.innerHTML = deposits.map(deposit => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <h4>฿${(deposit.amount || 0).toLocaleString()}</h4>
                    <p>ช่องทาง: ${getMethodText(deposit.method)} | ผู้เติม: ${deposit.username || 'Unknown'}</p>
                    ${deposit.slipUrl ? `<a href="${deposit.slipUrl}" target="_blank">ดูสลิป</a>` : ''}
                </div>
                <div class="admin-item-actions">
                    <button class="btn-sm btn-approve" onclick="approveDeposit('${deposit.id}')"><i class="fas fa-check"></i> อนุมัติ</button>
                    <button class="btn-sm btn-reject" onclick="rejectDeposit('${deposit.id}')"><i class="fas fa-times"></i> ปฏิเสธ</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering deposits:', error);
    }
}

async function approveDeposit(id) {
    try {
        showLoading(true);
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.approveDeposit(id);
        }
        showToast('อนุมัติการเติมเงินแล้ว', 'success');
        await renderDepositsList();
        await updateAdminBadges();
    } catch (error) {
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

async function rejectDeposit(id) {
    try {
        showLoading(true);
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.rejectDeposit(id);
        }
        showToast('ปฏิเสธการเติมเงิน', 'info');
        await renderDepositsList();
        await updateAdminBadges();
    } catch (error) {
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

async function renderWithdrawalsList() {
    const container = document.getElementById('withdrawalsList');
    
    try {
        let withdrawals = [];
        if (typeof FirebaseDB !== 'undefined') {
            withdrawals = await FirebaseDB.getPendingWithdrawals();
        }
        
        if (withdrawals.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>ไม่มีคำขอถอนเงิน</p></div>';
            return;
        }
        
        container.innerHTML = withdrawals.map(w => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <h4>฿${(w.amount || 0).toLocaleString()}</h4>
                    <p>ช่องทาง: ${getMethodText(w.method)}</p>
                    <p>บัญชี: ${w.account} ${w.bank ? `(${getBankName(w.bank)})` : ''}</p>
                    ${w.accountName ? `<p>ชื่อบัญชี: ${w.accountName}</p>` : ''}
                </div>
                <div class="admin-item-actions">
                    <button class="btn-sm btn-approve" onclick="approveWithdrawal('${w.id}')"><i class="fas fa-check"></i> อนุมัติ</button>
                    <button class="btn-sm btn-reject" onclick="rejectWithdrawal('${w.id}')"><i class="fas fa-times"></i> ปฏิเสธ</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering withdrawals:', error);
    }
}

async function approveWithdrawal(id) {
    try {
        showLoading(true);
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.approveWithdrawal(id);
        }
        showToast('อนุมัติการถอนเงินแล้ว', 'success');
        await renderWithdrawalsList();
        await updateAdminBadges();
    } catch (error) {
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

async function rejectWithdrawal(id) {
    try {
        showLoading(true);
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.rejectWithdrawal(id);
        }
        showToast('ปฏิเสธและคืน Coins แล้ว', 'info');
        await renderWithdrawalsList();
        await updateAdminBadges();
    } catch (error) {
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

async function renderReports() {
    try {
        if (typeof FirebaseDB === 'undefined') return;
        
        const purchases = await FirebaseDB.getAllPurchases();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        let todayRevenue = 0;
        let monthRevenue = 0;
        let totalFees = 0;
        
        purchases.forEach(p => {
            const date = p.createdAt?.toDate?.() || new Date(p.createdAt);
            const amount = p.price || 0;
            const fee = amount * 0.1;
            
            if (date >= today) todayRevenue += amount;
            if (date >= monthStart) monthRevenue += amount;
            totalFees += fee;
        });
        
        document.getElementById('todayRevenue').textContent = `฿${todayRevenue.toLocaleString()}`;
        document.getElementById('monthRevenue').textContent = `฿${monthRevenue.toLocaleString()}`;
        document.getElementById('totalSalesCount').textContent = purchases.length;
        document.getElementById('totalFees').textContent = `฿${totalFees.toLocaleString()}`;
    } catch (error) {
        console.error('Error rendering reports:', error);
    }
}

// ==================== MARKETPLACE ====================
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
                <div class="listing-details">
                    <span><i class="fas fa-palette"></i> ${listing.skins || 0} Skins</span>
                </div>
                <div class="listing-footer">
                    <span class="listing-price">฿${(listing.price || 0).toLocaleString()}</span>
                    <span class="listing-seller"><i class="fas fa-user"></i> ${listing.sellerName || 'Seller'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function filterListings() {
    // ⚠️ ต้องโหลดข้อมูลทั้งหมดใหม่ใน listingsCache ก่อนเรียกฟังก์ชันนี้
    const search = document.getElementById('searchInput')?.value.toLowerCase();
    const priceRange = document.getElementById('filterPrice')?.value;
    const rank = document.getElementById('filterRank')?.value;
    const skinsRange = document.getElementById('filterSkins')?.value;
    
    // ⚠️ ต้องโหลดข้อมูลเริ่มต้นจาก Firebase อีกครั้งก่อน filter
    let filtered = [...listingsCache];
    
    if (search) {
        filtered = filtered.filter(l => 
            (l.title || '').toLowerCase().includes(search) ||
            (l.featuredSkins || '').toLowerCase().includes(search)
        );
    }
    
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filtered = filtered.filter(l => (l.price >= min && l.price <= max));
    }
    
    if (rank) {
        filtered = filtered.filter(l => l.rank === rank);
    }

    if (skinsRange) {
        const [minSkins, maxSkins] = skinsRange.split('-').map(Number);
        filtered = filtered.filter(l => (l.skins >= minSkins && l.skins <= maxSkins));
    }
    
    listingsCache = filtered;
    renderListings();
}

// ============================================================
// PART 5: REMAINING HELPER FUNCTIONS (ที่ถูกใช้ในโค้ดข้างบน)
// ============================================================

// Dummy functions for admin panel UI
async function updateAdminBadges() { 
    if (typeof FirebaseDB !== 'undefined') {
        try {
            const pendingListings = await FirebaseDB.getPendingListings();
            const pendingDeposits = await FirebaseDB.getPendingDeposits();
            const pendingWithdrawals = await FirebaseDB.getPendingWithdrawals();
            
            document.getElementById('pendingBadge').textContent = pendingListings.length;
            document.getElementById('depositsBadge').textContent = pendingDeposits.length;
            document.getElementById('withdrawalsBadge').textContent = pendingWithdrawals.length;
            document.getElementById('totalPendingBadge').textContent = pendingListings.length + pendingDeposits.length + pendingWithdrawals.length;
        } catch (error) {
            console.error("Failed to update admin badges:", error);
        }
    }
}
function switchAdminTab(tab, btn) { 
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`adminTab-${tab}`).style.display = 'block';

    if (tab === 'deposits') renderDepositsList();
    if (tab === 'withdrawals') renderWithdrawalsList();
    if (tab === 'reports') renderReports();
    if (tab === 'pending') renderAdminListings();
}
function openViewUserModal(userId) { /* Dummy implementation */ }

// UI Helpers
function formatRank(rank) {
    const ranks = { radiant: 'Radiant', immortal: 'Immortal', ascendant: 'Ascendant', diamond: 'Diamond', platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze', iron: 'Iron' };
    return ranks[rank] || rank || '-';
}

function getBadgeText(badge) {
    const badges = { new: 'ใหม่', hot: 'ขายดี', featured: 'แนะนำ' };
    return badges[badge] || badge;
}

function getMethodText(method) {
    const methods = { promptpay: 'พร้อมเพย์', truewallet: 'TrueMoney', bank: 'โอนธนาคาร' };
    return methods[method] || method;
}

function getBankName(bank) {
    const banks = { kbank: 'กสิกรไทย', scb: 'ไทยพาณิชย์', bbl: 'กรุงเทพ', ktb: 'กรุงไทย', tmb: 'ทหารไทยธนชาต' };
    return banks[bank] || bank;
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

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
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

function viewListing(id) {
    // Placeholder function, should open a detailed view modal
    showToast(`ดูรายละเอียดประกาศ ID: ${id}`, 'info');
}

// ============================================================
// END OF FILE
// ============================================================
