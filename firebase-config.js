// ============================================================
// FIREBASE CONFIGURATION - VALO MARKET
// ============================================================
// 
// ⚠️ ขั้นตอนการตั้งค่า Firebase (ทำครั้งเดียว)
// 
// 1. ไปที่ https://console.firebase.google.com/
// 2. คลิก "Add project" หรือ "สร้างโปรเจกต์"
// 3. ตั้งชื่อโปรเจกต์ เช่น "valo-market"
// 4. ปิด Google Analytics (ไม่จำเป็น) แล้วกด Create
// 5. รอสักครู่จนโปรเจกต์สร้างเสร็จ
// 
// 📱 เปิดใช้งาน Authentication:
// 1. คลิก "Authentication" ในเมนูซ้าย
// 2. คลิก "Get started"
// 3. ไปที่ Tab "Sign-in method"
// 4. เปิดใช้งาน "Google" - ใส่ชื่อโปรเจกต์และอีเมล แล้ว Save
// 5. เปิดใช้งาน "Phone" - คลิก Enable แล้ว Save
// 
// 🗄️ เปิดใช้งาน Firestore Database:
// 1. คลิก "Firestore Database" ในเมนูซ้าย
// 2. คลิก "Create database"
// 3. เลือก "Start in test mode" (สำหรับทดสอบ)
// 4. เลือก Location: asia-southeast1 (Singapore) หรือใกล้เคียง
// 5. คลิก Enable
// 
// 📦 เปิดใช้งาน Storage:
// 1. คลิก "Storage" ในเมนูซ้าย
// 2. คลิก "Get started"
// 3. เลือก "Start in test mode"
// 4. เลือก Location เดียวกับ Firestore
// 5. คลิก Done
// 
// 🔑 ดึง Config:
// 1. คลิกไอคอนเฟือง (Project settings) มุมซ้ายบน
// 2. เลื่อนลงไปหา "Your apps"
// 3. คลิกไอคอน "</>" (Web)
// 4. ตั้งชื่อ App เช่น "valo-market-web"
// 5. คลิก "Register app"
// 6. จะเห็น firebaseConfig - คัดลอกมาใส่ด้านล่าง
// 
// ============================================================

const firebaseConfig = {
    // ⬇️ แทนที่ค่าด้านล่างด้วยค่าจาก Firebase Console ของคุณ
    apiKey: "AIzaSyAGD-1YkbV9-vxIJqx68leqAMfe_Xr1Pq4",
    authDomain: "valorent-9a13c.firebaseapp.com",
    projectId: "valorent-9a13c",
    storageBucket: "valorent-9a13c.firebasestorage.app",
    messagingSenderId: "113631887318",
    appId: "1:113631887318:web:56a851b583bb12ac9eee77"
};

// ============================================================
// ตัวอย่าง Config ที่ถูกต้อง (ห้ามใช้ค่านี้ ต้องสร้างเอง):
// ============================================================
// const firebaseConfig = {
//     apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
//     authDomain: "valo-market-12345.firebaseapp.com",
//     projectId: "valo-market-12345",
//     storageBucket: "valo-market-12345.appspot.com",
//     messagingSenderId: "123456789012",
//     appId: "1:123456789012:web:abcdef1234567890"
// };
// ============================================================

// Initialize Firebase
let app, auth, db, storage;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    // ตั้งค่าภาษาไทยสำหรับ Auth
    auth.languageCode = 'th';
    
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    console.log('⚠️ กรุณาตั้งค่า Firebase Config ในไฟล์ firebase-config.js');
}

// ============================================================
// FIREBASE HELPER FUNCTIONS
// ============================================================

const FirebaseDB = {
    // ==================== USERS ====================
    async createUser(userId, userData) {
        try {
            await db.collection('users').doc(userId).set({
                ...userData,
                coins: 0,
                membership: null,
                rating: 0,
                totalSales: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error creating user:', error);
            return false;
        }
    },

    async getUser(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    async updateUser(userId, data) {
        try {
            await db.collection('users').doc(userId).update(data);
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    },

    async getAllUsers() {
        try {
            const snapshot = await db.collection('users').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    },

    // ==================== LISTINGS ====================
    async createListing(listingData) {
        try {
            const docRef = await db.collection('pendingListings').add({
                ...listingData,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating listing:', error);
            return null;
        }
    },

    async getApprovedListings() {
        try {
            const snapshot = await db.collection('listings')
                .where('status', '==', 'approved')
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting listings:', error);
            return [];
        }
    },

    async getPendingListings() {
        try {
            const snapshot = await db.collection('pendingListings')
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting pending listings:', error);
            return [];
        }
    },

    async approveListing(listingId) {
        try {
            const pendingDoc = await db.collection('pendingListings').doc(listingId).get();
            if (!pendingDoc.exists) return false;

            const listingData = pendingDoc.data();
            
            // Move to approved listings
            await db.collection('listings').add({
                ...listingData,
                status: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Delete from pending
            await db.collection('pendingListings').doc(listingId).delete();
            
            return true;
        } catch (error) {
            console.error('Error approving listing:', error);
            return false;
        }
    },

    async rejectListing(listingId) {
        try {
            await db.collection('pendingListings').doc(listingId).delete();
            return true;
        } catch (error) {
            console.error('Error rejecting listing:', error);
            return false;
        }
    },

    async updateListing(listingId, data) {
        try {
            await db.collection('listings').doc(listingId).update(data);
            return true;
        } catch (error) {
            console.error('Error updating listing:', error);
            return false;
        }
    },

    async deleteListing(listingId) {
        try {
            await db.collection('listings').doc(listingId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting listing:', error);
            return false;
        }
    },

    // ==================== DEPOSITS ====================
    async createDeposit(depositData) {
        try {
            const docRef = await db.collection('deposits').add({
                ...depositData,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating deposit:', error);
            return null;
        }
    },

    async getPendingDeposits() {
        try {
            const snapshot = await db.collection('deposits')
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting deposits:', error);
            return [];
        }
    },

    async approveDeposit(depositId) {
        try {
            const depositDoc = await db.collection('deposits').doc(depositId).get();
            if (!depositDoc.exists) return false;

            const deposit = depositDoc.data();
            
            // Update user coins
            const userRef = db.collection('users').doc(deposit.userId);
            await userRef.update({
                coins: firebase.firestore.FieldValue.increment(deposit.amount)
            });

            // Update deposit status
            await db.collection('deposits').doc(depositId).update({
                status: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Create transaction record
            await db.collection('transactions').add({
                userId: deposit.userId,
                type: 'deposit',
                amount: deposit.amount,
                description: `เติม Coins ผ่าน ${deposit.method}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error approving deposit:', error);
            return false;
        }
    },

    async rejectDeposit(depositId) {
        try {
            await db.collection('deposits').doc(depositId).update({
                status: 'rejected',
                rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error rejecting deposit:', error);
            return false;
        }
    },

    // ==================== WITHDRAWALS ====================
    async createWithdrawal(withdrawalData) {
        try {
            // Deduct coins first
            const userRef = db.collection('users').doc(withdrawalData.userId);
            await userRef.update({
                coins: firebase.firestore.FieldValue.increment(-withdrawalData.amount)
            });

            const docRef = await db.collection('withdrawals').add({
                ...withdrawalData,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating withdrawal:', error);
            return null;
        }
    },

    async getPendingWithdrawals() {
        try {
            const snapshot = await db.collection('withdrawals')
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting withdrawals:', error);
            return [];
        }
    },

    async approveWithdrawal(withdrawalId) {
        try {
            const withdrawalDoc = await db.collection('withdrawals').doc(withdrawalId).get();
            if (!withdrawalDoc.exists) return false;

            const withdrawal = withdrawalDoc.data();

            await db.collection('withdrawals').doc(withdrawalId).update({
                status: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Create transaction record
            await db.collection('transactions').add({
                userId: withdrawal.userId,
                type: 'withdrawal',
                amount: -withdrawal.amount,
                description: `ถอนเงินไปยัง ${withdrawal.method}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error approving withdrawal:', error);
            return false;
        }
    },

    async rejectWithdrawal(withdrawalId) {
        try {
            const withdrawalDoc = await db.collection('withdrawals').doc(withdrawalId).get();
            if (!withdrawalDoc.exists) return false;

            const withdrawal = withdrawalDoc.data();

            // Refund coins
            const userRef = db.collection('users').doc(withdrawal.userId);
            await userRef.update({
                coins: firebase.firestore.FieldValue.increment(withdrawal.amount)
            });

            await db.collection('withdrawals').doc(withdrawalId).update({
                status: 'rejected',
                rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            return false;
        }
    },

    // ==================== PURCHASES ====================
    async createPurchase(purchaseData) {
        try {
            const docRef = await db.collection('purchases').add({
                ...purchaseData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating purchase:', error);
            return null;
        }
    },

    async getUserPurchases(userId) {
        try {
            const snapshot = await db.collection('purchases')
                .where('buyerId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting purchases:', error);
            return [];
        }
    },

    async getUserSales(userId) {
        try {
            const snapshot = await db.collection('purchases')
                .where('sellerId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting sales:', error);
            return [];
        }
    },

    // ==================== TRANSACTIONS ====================
    async getUserTransactions(userId) {
        try {
            const snapshot = await db.collection('transactions')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    },

    async getAllPurchases() {
        try {
            const snapshot = await db.collection('purchases')
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting all purchases:', error);
            return [];
        }
    },

    // ==================== STATS ====================
    async getStats() {
        try {
            const usersSnapshot = await db.collection('users').get();
            const purchasesSnapshot = await db.collection('purchases').get();
            
            return {
                totalUsers: usersSnapshot.size,
                totalSales: purchasesSnapshot.size
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { totalUsers: 0, totalSales: 0 };
        }
    }
};

// ============================================================
// STORAGE HELPER FUNCTIONS
// ============================================================

const FirebaseStorage = {
    async uploadImage(file, path) {
        try {
            const storageRef = storage.ref();
            const fileRef = storageRef.child(path);
            
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return downloadURL;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    },

    async uploadListingImages(files, listingId) {
        const urls = [];
        for (let i = 0; i < files.length; i++) {
            const url = await this.uploadImage(
                files[i], 
                `listings/${listingId}/${Date.now()}_${i}.jpg`
            );
            if (url) urls.push(url);
        }
        return urls;
    },

    async uploadSlip(file, depositId) {
        return await this.uploadImage(file, `slips/${depositId}_${Date.now()}.jpg`);
    }
};

// ============================================================
// AUTH HELPER FUNCTIONS
// ============================================================

const FirebaseAuth = {
    // Google Sign In
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const result = await auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        }
    },

    // Phone Auth - Send OTP
    async sendOTP(phoneNumber, recaptchaVerifier) {
        try {
            // Format phone number for Thailand
            let formattedPhone = phoneNumber;
            if (phoneNumber.startsWith('0')) {
                formattedPhone = '+66' + phoneNumber.substring(1);
            }
            
            const confirmationResult = await auth.signInWithPhoneNumber(
                formattedPhone, 
                recaptchaVerifier
            );
            return confirmationResult;
        } catch (error) {
            console.error('Send OTP error:', error);
            throw error;
        }
    },

    // Phone Auth - Verify OTP
    async verifyOTP(confirmationResult, otp) {
        try {
            const result = await confirmationResult.confirm(otp);
            return result.user;
        } catch (error) {
            console.error('Verify OTP error:', error);
            throw error;
        }
    },

    // Sign Out
    async signOut() {
        try {
            await auth.signOut();
            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            return false;
        }
    },

    // Get current user
    getCurrentUser() {
        return auth.currentUser;
    },

    // Listen to auth state changes
    onAuthStateChanged(callback) {
        return auth.onAuthStateChanged(callback);
    }
};

console.log('📦 Firebase helpers loaded');

