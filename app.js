// ============================================================
// VALO MARKET - Main Application (Firebase Version) - Part 2
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
    const search = document.getElementById('searchInput').value.toLowerCase();
    const priceRange = document.getElementById('filterPrice').value;
    const rank = document.getElementById('filterRank').value;
    const skinsRange = document.getElementById('filterSkins').value;
    
    let filtered = [...listingsCache];
    
    if (search) {
        filtered = filtered.filter(l => 
            (l.title || '').toLowerCase().includes(search) ||
            (l.featuredSkins || '').toLowerCase().includes(search)
        );
    }
    
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filtered = filtered.filter(l => l.price >= min && l.price <= max);
    }
    
    if (rank) {
        filtered = filtered.filter(l => l.rank === rank);
    }
    
    if (skinsRange) {
        const [min, max] = skinsRange.split('-').map(Number);
        filtered = filtered.filter(l => l.skins >= min && l.skins <= max);
    }
    
    // Temporarily update cache for rendering
    const originalCache = listingsCache;
    listingsCache = filtered;
    renderListings();
    listingsCache = originalCache;
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterPrice').value = '';
    document.getElementById('filterRank').value = '';
    document.getElementById('filterSkins').value = '';
    renderListings();
}

function viewListing(id) {
    const listing = listingsCache.find(l => l.id === id);
    if (!listing) return;
    
    currentListing = listing;
    
    const container = document.getElementById('listingDetailContent');
    container.innerHTML = `
        <button class="btn-back" onclick="showPage('marketplace')"><i class="fas fa-arrow-left"></i> กลับ</button>
        <div class="listing-detail-grid">
            <div class="listing-gallery">
                <div class="main-image"><img src="${listing.images?.[0] || 'https://via.placeholder.com/600x400'}" id="mainImage" alt=""></div>
                <div class="thumbnail-row">
                    ${(listing.images || []).map((img, i) => `<img src="${img}" class="thumbnail ${i === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">`).join('')}
                </div>
            </div>
            <div class="listing-info">
                <h1>${listing.title || 'Valorant Account'}</h1>
                <div class="info-grid">
                    <div class="info-item"><span class="label">Rank</span><span class="value rank-badge ${listing.rank}">${formatRank(listing.rank)}</span></div>
                    <div class="info-item"><span class="label">Peak Rank</span><span class="value">${formatRank(listing.peakRank) || '-'}</span></div>
                    <div class="info-item"><span class="label">Skins</span><span class="value">${listing.skins || 0}</span></div>
                    <div class="info-item"><span class="label">ราคา</span><span class="value price">฿${(listing.price || 0).toLocaleString()}</span></div>
                </div>
                ${listing.featuredSkins ? `<div class="featured-skins"><h4><i class="fas fa-star"></i> Skins เด่น</h4><p>${listing.featuredSkins}</p></div>` : ''}
                ${listing.highlights ? `<div class="highlights"><h4><i class="fas fa-info-circle"></i> จุดเด่น</h4><p>${listing.highlights}</p></div>` : ''}
                <div class="seller-card">
                    <div class="seller-info"><i class="fas fa-user-circle"></i><div><span class="seller-name">${listing.sellerName || 'Seller'}</span><span class="seller-rating"><i class="fas fa-star"></i> ${listing.sellerRating || '-'}</span></div></div>
                </div>
                <button class="btn-primary btn-large btn-purchase" onclick="openPurchaseModal()"><i class="fas fa-shopping-cart"></i> ซื้อไอดีนี้</button>
            </div>
        </div>
    `;
    
    showPage('listing-detail');
}

function changeMainImage(src, el) {
    document.getElementById('mainImage').src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

// ==================== SELL FORM ====================
function selectSellOption(type, el) {
    document.querySelectorAll('.sell-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('sellType').value = type;
}

function previewImages(event) {
    const files = Array.from(event.target.files).slice(0, 5);
    const container = document.getElementById('imagePreviews');
    const placeholder = document.getElementById('uploadPlaceholder');
    
    uploadedImages = [];
    uploadedFiles = files;
    container.innerHTML = '';
    
    files.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImages.push(e.target.result);
            container.innerHTML += `<div class="preview-item"><img src="${e.target.result}"><button type="button" class="remove-btn" onclick="removeImage(${i})"><i class="fas fa-times"></i></button></div>`;
        };
        reader.readAsDataURL(file);
    });
    
    placeholder.style.display = files.length > 0 ? 'none' : 'block';
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    uploadedFiles.splice(index, 1);
    
    const container = document.getElementById('imagePreviews');
    container.innerHTML = '';
    
    uploadedImages.forEach((img, i) => {
        container.innerHTML += `<div class="preview-item"><img src="${img}"><button type="button" class="remove-btn" onclick="removeImage(${i})"><i class="fas fa-times"></i></button></div>`;
    });
    
    if (uploadedImages.length === 0) {
        document.getElementById('uploadPlaceholder').style.display = 'block';
    }
}

async function submitListing(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อน', 'warning');
        showAuthModal();
        return;
    }
    
    const type = document.getElementById('sellType').value;
    const rank = document.getElementById('listingRank').value;
    const peakRank = document.getElementById('listingPeakRank').value;
    const skins = parseInt(document.getElementById('listingSkins').value);
    const price = parseInt(document.getElementById('listingPrice').value);
    const featuredSkins = document.getElementById('listingFeaturedSkins').value;
    const highlights = document.getElementById('listingHighlights').value;
    
    const contact = {
        facebook: document.getElementById('contactFacebook').value.trim(),
        line: document.getElementById('contactLine').value.trim(),
        discord: document.getElementById('contactDiscord').value.trim(),
        phone: document.getElementById('contactPhoneSell').value.trim()
    };
    
    // Validate contact
    if (!contact.facebook && !contact.line && !contact.discord && !contact.phone) {
        showToast('กรุณากรอกช่องทางติดต่ออย่างน้อย 1 ช่อง', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        // Upload images if using Firebase Storage
        let imageUrls = uploadedImages;
        if (uploadedFiles.length > 0 && typeof FirebaseStorage !== 'undefined') {
            const tempId = Date.now().toString();
            imageUrls = await FirebaseStorage.uploadListingImages(uploadedFiles, tempId);
        }
        
        const listingData = {
            type,
            rank,
            peakRank,
            skins,
            price,
            featuredSkins,
            highlights,
            images: imageUrls,
            contact,
            title: `${formatRank(rank)} ${skins} Skins`,
            sellerId: currentUser.uid,
            sellerName: currentUserData?.username || 'Seller'
        };
        
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.createListing(listingData);
        }
        
        showToast('ส่งข้อมูลแล้ว รอแอดมินตรวจสอบ', 'success');
        
        // Reset form
        document.getElementById('sellForm').reset();
        document.getElementById('imagePreviews').innerHTML = '';
        document.getElementById('uploadPlaceholder').style.display = 'block';
        uploadedImages = [];
        uploadedFiles = [];
        
        showPage('home');
    } catch (error) {
        console.error('Error submitting listing:', error);
        showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== PURCHASE ====================
function openPurchaseModal() {
    if (!currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อน', 'warning');
        showAuthModal();
        return;
    }
    
    if (!currentListing) return;
    
    selectedInsurance = 3;
    const isFirstPurchase = !currentUserData?.purchases || currentUserData.purchases.length === 0;
    
    document.getElementById('purchaseContent').innerHTML = `
        <button class="modal-close" onclick="closeModal('purchaseModal')"><i class="fas fa-times"></i></button>
        <h2><i class="fas fa-shopping-cart"></i> ยืนยันการซื้อ</h2>
        <div class="purchase-listing">
            <img src="${currentListing.images?.[0] || ''}" alt="">
            <div><h4>${currentListing.title}</h4><p>${formatRank(currentListing.rank)} | ${currentListing.skins} Skins</p></div>
        </div>
        <div class="insurance-section">
            <h4>เลือกประกันไอดี</h4>
            <div class="insurance-options">
                <label class="insurance-option ${isFirstPurchase ? 'free' : ''}"><input type="radio" name="insurance" value="3" checked onchange="selectInsurance(3)"><div class="insurance-card"><span class="days">3 วัน</span><span class="price">${isFirstPurchase ? 'ฟรี!' : '฿50'}</span></div></label>
                <label class="insurance-option"><input type="radio" name="insurance" value="7" onchange="selectInsurance(7)"><div class="insurance-card"><span class="days">7 วัน</span><span class="price">฿100</span></div></label>
                <label class="insurance-option"><input type="radio" name="insurance" value="30" onchange="selectInsurance(30)"><div class="insurance-card"><span class="days">30 วัน</span><span class="price">฿300</span></div></label>
                <label class="insurance-option"><input type="radio" name="insurance" value="60" onchange="selectInsurance(60)"><div class="insurance-card"><span class="days">60 วัน</span><span class="price">฿500</span></div></label>
            </div>
        </div>
        <div class="purchase-summary">
            <div class="summary-row"><span>ราคาไอดี</span><span>฿${currentListing.price.toLocaleString()}</span></div>
            <div class="summary-row"><span>ประกัน ${selectedInsurance} วัน</span><span id="insurancePrice">${isFirstPurchase ? 'ฟรี' : '฿50'}</span></div>
            <div class="summary-row total"><span>รวมทั้งหมด</span><span id="totalPrice">฿${currentListing.price.toLocaleString()}</span></div>
        </div>
        <p class="coins-balance">Coins ของคุณ: <strong>${(currentUserData?.coins || 0).toLocaleString()}</strong></p>
        <button class="btn-primary btn-large" style="width:100%" onclick="confirmPurchase()"><i class="fas fa-check"></i> ยืนยันการซื้อ</button>
    `;
    
    showModal('purchaseModal');
}

function selectInsurance(days) {
    selectedInsurance = days;
    const isFirstPurchase = !currentUserData?.purchases || currentUserData.purchases.length === 0;
    
    const prices = { 3: isFirstPurchase ? 0 : 50, 7: 100, 30: 300, 60: 500 };
    const insurancePrice = prices[days];
    const total = currentListing.price + insurancePrice;
    
    document.getElementById('insurancePrice').textContent = insurancePrice === 0 ? 'ฟรี' : `฿${insurancePrice}`;
    document.getElementById('totalPrice').textContent = `฿${total.toLocaleString()}`;
}

async function confirmPurchase() {
    if (!currentListing || !currentUser) return;
    
    const isFirstPurchase = !currentUserData?.purchases || currentUserData.purchases.length === 0;
    const prices = { 3: isFirstPurchase ? 0 : 50, 7: 100, 30: 300, 60: 500 };
    const insurancePrice = prices[selectedInsurance];
    const total = currentListing.price + insurancePrice;
    
    if ((currentUserData?.coins || 0) < total) {
        showToast('Coins ไม่เพียงพอ กรุณาเติมเงิน', 'error');
        closeModal('purchaseModal');
        showDepositModal();
        return;
    }
    
    try {
        showLoading(true);
        
        // Deduct coins from buyer
        const newBuyerCoins = (currentUserData?.coins || 0) - total;
        
        if (typeof FirebaseDB !== 'undefined') {
            // Update buyer's coins
            await FirebaseDB.updateUser(currentUser.uid, { coins: newBuyerCoins });
            
            // Add coins to seller (90% after 10% fee)
            const sellerAmount = Math.floor(currentListing.price * 0.9);
            const sellerRef = db.collection('users').doc(currentListing.sellerId);
            await sellerRef.update({
                coins: firebase.firestore.FieldValue.increment(sellerAmount),
                totalSales: firebase.firestore.FieldValue.increment(1)
            });
            
            // Create purchase record
            await FirebaseDB.createPurchase({
                listingId: currentListing.id,
                buyerId: currentUser.uid,
                sellerId: currentListing.sellerId,
                price: currentListing.price,
                insurance: selectedInsurance,
                insurancePrice,
                total,
                listingData: currentListing
            });
            
            // Remove listing
            await FirebaseDB.deleteListing(currentListing.id);
        }
        
        // Update local state
        currentUserData.coins = newBuyerCoins;
        updateUI();
        
        closeModal('purchaseModal');
        showSellerContact();
        
        await loadListings();
    } catch (error) {
        console.error('Error processing purchase:', error);
        showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
        showLoading(false);
    }
}

function showSellerContact() {
    if (!currentListing?.contact) return;
    
    const contact = currentListing.contact;
    let html = '';
    
    if (contact.facebook) html += `<div class="contact-item"><i class="fab fa-facebook"></i><span>${contact.facebook}</span></div>`;
    if (contact.line) html += `<div class="contact-item"><i class="fab fa-line"></i><span>${contact.line}</span></div>`;
    if (contact.discord) html += `<div class="contact-item"><i class="fab fa-discord"></i><span>${contact.discord}</span></div>`;
    if (contact.phone) html += `<div class="contact-item"><i class="fas fa-phone"></i><span>${contact.phone}</span></div>`;
    
    document.getElementById('sellerContactDetails').innerHTML = html;
    showModal('contactInfoModal');
    showToast('ซื้อสำเร็จ! ติดต่อผู้ขายเพื่อรับไอดี', 'success');
}

// ==================== DEPOSIT/WITHDRAW ====================
function selectDepositAmount(amount, btn) {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('depositAmount').value = amount;
    currentDepositAmount = amount;
}

function processDeposit() {
    const amount = parseInt(document.getElementById('depositAmount').value) || currentDepositAmount;
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (!amount || amount < 50) {
        showToast('จำนวนขั้นต่ำ 50 บาท', 'error');
        return;
    }
    
    currentDepositAmount = amount;
    
    document.getElementById('paymentAmountDisplay').textContent = `฿${amount.toLocaleString()}`;
    document.getElementById('paymentMethodDisplay').textContent = getMethodText(method);
    
    const accountInfo = {
        promptpay: 'พร้อมเพย์: 081-234-5678 (VALO MARKET)',
        truewallet: 'TrueMoney: 081-234-5678 (VALO MARKET)',
        bank: 'กสิกรไทย: 123-4-56789-0 (VALO MARKET)'
    };
    document.getElementById('bankAccountInfo').textContent = accountInfo[method];
    
    // Reset slip preview
    document.getElementById('slipPreview').innerHTML = '<i class="fas fa-cloud-upload-alt"></i><p>คลิกเพื่ออัพโหลดสลิป</p>';
    slipImage = null;
    slipFile = null;
    
    closeModal('depositModal');
    showModal('paymentQRModal');
}

function previewSlip(event) {
    const file = event.target.files[0];
    if (file) {
        slipFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            slipImage = e.target.result;
            document.getElementById('slipPreview').innerHTML = `<img src="${slipImage}" style="max-height:200px">`;
        };
        reader.readAsDataURL(file);
    }
}

async function submitPaymentSlip() {
    if (!slipImage) {
        showToast('กรุณาอัพโหลดสลิป', 'error');
        return;
    }
    
    if (!currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อน', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        let slipUrl = slipImage;
        const method = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        if (slipFile && typeof FirebaseStorage !== 'undefined') {
            slipUrl = await FirebaseStorage.uploadSlip(slipFile, currentUser.uid);
        }
        
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.createDeposit({
                userId: currentUser.uid,
                username: currentUserData?.username || 'User',
                amount: currentDepositAmount,
                method,
                slipUrl
            });
        }
        
        closeModal('paymentQRModal');
        showToast('ส่งข้อมูลแล้ว รอแอดมินตรวจสอบ', 'success');
    } catch (error) {
        console.error('Error submitting deposit:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

function toggleBankFields() {
    const method = document.getElementById('withdrawMethod').value;
    const bankGroup = document.getElementById('bankNameGroup');
    const nameGroup = document.getElementById('accountNameGroup');
    const label = document.getElementById('accountLabel');
    
    if (method === 'bank') {
        bankGroup.style.display = 'block';
        nameGroup.style.display = 'block';
        label.textContent = 'เลขบัญชี';
    } else {
        bankGroup.style.display = 'none';
        nameGroup.style.display = 'none';
        label.textContent = method === 'promptpay' ? 'เบอร์พร้อมเพย์' : 'เบอร์ TrueMoney';
    }
}

async function processWithdraw() {
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    const method = document.getElementById('withdrawMethod').value;
    const account = document.getElementById('withdrawAccount').value.trim();
    const bank = document.getElementById('withdrawBank')?.value;
    const accountName = document.getElementById('withdrawAccountName')?.value?.trim();
    
    if (!amount || amount < 100) {
        showToast('จำนวนขั้นต่ำ 100 Coins', 'error');
        return;
    }
    
    if ((currentUserData?.coins || 0) < amount) {
        showToast('Coins ไม่เพียงพอ', 'error');
        return;
    }
    
    if (!account) {
        showToast('กรุณากรอกข้อมูลบัญชี', 'error');
        return;
    }
    
    if (method === 'bank' && !accountName) {
        showToast('กรุณากรอกชื่อบัญชี', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.createWithdrawal({
                userId: currentUser.uid,
                username: currentUserData?.username || 'User',
                amount,
                method,
                account,
                bank: method === 'bank' ? bank : null,
                accountName: method === 'bank' ? accountName : null
            });
            
            // Update local state
            currentUserData.coins -= amount;
            updateUI();
        }
        
        closeModal('withdrawModal');
        showToast('ส่งคำขอถอนเงินแล้ว รอแอดมินดำเนินการ', 'success');
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== DASHBOARD ====================
async function renderDashboard() {
    if (!currentUser || !currentUserData) {
        showPage('home');
        showAuthModal();
        return;
    }
    
    document.getElementById('dashCoins').textContent = (currentUserData.coins || 0).toLocaleString();
    document.getElementById('dashSales').textContent = currentUserData.totalSales || 0;
    document.getElementById('dashRating').textContent = currentUserData.rating || '-';
    
    // Count pending listings
    if (typeof FirebaseDB !== 'undefined') {
        try {
            const pending = await FirebaseDB.getPendingListings();
            const userPending = pending.filter(l => l.sellerId === currentUser.uid);
            document.getElementById('dashPending').textContent = userPending.length;
        } catch (error) {
            console.error('Error loading pending count:', error);
        }
    }
}

function switchDashboardTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    if (tab === 'sales') renderSalesList();
    if (tab === 'purchases') renderPurchasesList();
    if (tab === 'transactions') renderTransactionsList();
}

async function renderSalesList() {
    const container = document.getElementById('salesList');
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>กำลังโหลด...</p></div>';
    
    try {
        if (typeof FirebaseDB !== 'undefined') {
            const sales = await FirebaseDB.getUserSales(currentUser.uid);
            if (sales.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-store"></i><p>ยังไม่มีการขาย</p></div>';
            } else {
                container.innerHTML = sales.map(s => `
                    <div class="list-item"><div class="item-info"><h4>${s.listingData?.title || 'ไอดี Valorant'}</h4><p>ขายได้ ฿${(s.price || 0).toLocaleString()}</p></div><span class="item-date">${formatDate(s.createdAt)}</span></div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading sales:', error);
    }
}

async function renderPurchasesList() {
    const container = document.getElementById('purchasesList');
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>กำลังโหลด...</p></div>';
    
    try {
        if (typeof FirebaseDB !== 'undefined') {
            const purchases = await FirebaseDB.getUserPurchases(currentUser.uid);
            if (purchases.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>ยังไม่มีการซื้อ</p></div>';
            } else {
                container.innerHTML = purchases.map(p => `
                    <div class="list-item"><div class="item-info"><h4>${p.listingData?.title || 'ไอดี Valorant'}</h4><p>฿${(p.price || 0).toLocaleString()} | ประกัน ${p.insurance} วัน</p></div><span class="item-date">${formatDate(p.createdAt)}</span></div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading purchases:', error);
    }
}

async function renderTransactionsList() {
    const container = document.getElementById('transactionsList');
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>กำลังโหลด...</p></div>';
    
    try {
        if (typeof FirebaseDB !== 'undefined') {
            const transactions = await FirebaseDB.getUserTransactions(currentUser.uid);
            if (transactions.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>ยังไม่มีธุรกรรม</p></div>';
            } else {
                container.innerHTML = transactions.map(t => `
                    <div class="list-item"><div class="item-info"><h4>${t.description}</h4></div><span class="item-amount ${t.amount >= 0 ? 'positive' : 'negative'}">${t.amount >= 0 ? '+' : ''}${t.amount.toLocaleString()}</span></div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// ==================== MEMBERSHIP ====================
async function buyMembership(tier, price) {
    if (!currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อน', 'warning');
        showAuthModal();
        return;
    }
    
    if ((currentUserData?.coins || 0) < price) {
        showToast('Coins ไม่เพียงพอ', 'error');
        showDepositModal();
        return;
    }
    
    if (!confirm(`สมัครสมาชิก ${tier.toUpperCase()} ราคา ${price} Coins?`)) return;
    
    try {
        showLoading(true);
        
        const newCoins = (currentUserData?.coins || 0) - price;
        
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.updateUser(currentUser.uid, {
                coins: newCoins,
                membership: tier
            });
            
            await db.collection('transactions').add({
                userId: currentUser.uid,
                type: 'membership',
                amount: -price,
                description: `สมัครสมาชิก ${tier.toUpperCase()}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        currentUserData.coins = newCoins;
        currentUserData.membership = tier;
        updateUI();
        
        showToast(`สมัครสมาชิก ${tier.toUpperCase()} สำเร็จ!`, 'success');
    } catch (error) {
        console.error('Error buying membership:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== UTILITIES ====================
function formatRank(rank) {
    const ranks = {
        radiant: 'Radiant', immortal: 'Immortal', ascendant: 'Ascendant',
        diamond: 'Diamond', platinum: 'Platinum', gold: 'Gold',
        silver: 'Silver', bronze: 'Bronze', iron: 'Iron'
    };
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
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-circle', info: 'info-circle' };
    
    toast.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('🎮 VALO MARKET App Loaded');
