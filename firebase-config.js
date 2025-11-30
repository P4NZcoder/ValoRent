// ============================================================
// FIREBASE CONFIGURATION (CDN VERSION)
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyAGD-1YkbV9-vxIJqx68leqAMfe_Xr1Pq4",
    authDomain: "valorent-9a13c.firebaseapp.com",
    projectId: "valorent-9a13c",
    storageBucket: "valorent-9a13c.firebasestorage.app",
    messagingSenderId: "113631887318",
    appId: "1:113631887318:web:56a851b583bb12ac9eee77",
    measurementId: "G-9N2XSGH69G"
};

// เริ่มต้น Firebase (ตรวจสอบว่ามี Library โหลดมาหรือยัง)
let app, auth, db, storage, analytics;

if (typeof firebase !== 'undefined') {
    // ป้องกันการ Initialize ซ้ำ
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    
    // เรียกใช้ Service ต่างๆ
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    // Analytics (ถ้าโหลดมา)
    if (firebase.analytics) {
        analytics = firebase.analytics();
    }

    console.log('✅ Firebase initialized (CDN Mode)');
} else {
    console.error('❌ Critical: Firebase SDK not loaded in index.html');
}

// ============================================================
// HELPER CLASSES (จำเป็นต้องมีเพื่อให้ app.js ทำงานได้)
// ============================================================

// 1. Auth Helper
const FirebaseAuth = {
    signInWithGoogle: async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        return await auth.signInWithPopup(provider);
    },
    signOut: async () => {
        return await auth.signOut();
    },
    onAuthStateChanged: (callback) => {
        return auth.onAuthStateChanged(callback);
    },
    // เพิ่มฟังก์ชันสำหรับ Phone Auth (ถ้าใช้)
    sendOTP: async (phoneNumber, appVerifier) => {
        return await auth.signInWithPhoneNumber(phoneNumber, appVerifier);
    },
    verifyOTP: async (confirmationResult, code) => {
        return await confirmationResult.confirm(code);
    }
};

// 2. Database Helper
const FirebaseDB = {
    getUser: async (uid) => {
        try {
            const doc = await db.collection('users').doc(uid).get();
            return doc.exists ? doc.data() : null;
        } catch (e) { console.error(e); return null; }
    },
    getApprovedListings: async () => {
        try {
            const snapshot = await db.collection('listings')
                .where('status', '==', 'approved') // กรองเฉพาะที่อนุมัติแล้ว
                .get(); // ลบ orderBy ออกก่อนชั่วคราวเพื่อเลี่ยงปัญหา Index
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error("Error fetching listings:", e);
            return [];
        }
    },
    // ฟังก์ชันสร้าง Listings (สำหรับหน้าขาย)
    createListing: async (data) => {
        data.status = 'pending'; // รออนุมัติ
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        return await db.collection('listings').add(data);
    }
};

// 3. Storage Helper
const FirebaseStorage = {
    uploadImage: async (file, path) => {
        const ref = storage.ref().child(path);
        await ref.put(file);
        return await ref.getDownloadURL();
    }
};
