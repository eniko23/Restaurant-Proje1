const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const { Sequelize, DataTypes } = require('sequelize'); // Sequelize eklendi

app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- ENVIRONMENT VARIABLES ---
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'restaurant_db';

// --- MEVCUT MYSQL BAĞLANTISI (Kullanıcılar ve Rezervasyonlar için) ---
const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('HATA: Veritabanına bağlanılamadı!', err);
    } else {
        console.log('BAŞARILI: MySQL veritabanına bağlandı (Raw).');
    }
});

// --- SEQUELIZE BAĞLANTISI (Sipariş Yönetimi için) ---
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: 'mysql',
    logging: false // Konsol kirliliğini önlemek için
});

// Sipariş Modeli (Tablo)
const Siparis = sequelize.define('Siparis', {
    masa: {
        type: DataTypes.STRING,
        allowNull: false
    },
    icerik: {
        type: DataTypes.JSON, // Sipariş içeriğini JSON olarak tutacağız
        allowNull: false
    },
    durum: {
        type: DataTypes.STRING,
        defaultValue: 'bekleyen' // bekleyen -> hazirlaniyor -> tamamlandi -> servis_edildi
    }
}, {
    tableName: 'siparisler',
    timestamps: true
});

// Veritabanını Senkronize Et (Tablo yoksa oluşturur)
sequelize.sync().then(() => {
    console.log("Sequelize: Siparişler tablosu hazır.");
}).catch(err => console.error("Sequelize Hatası:", err));


// Ürün Verileri
const Urunler = [
    { id: 'u1', name: 'Islak Hamburger', price: 135, stok: 50 },
    { id: 'u2', name: 'Köfte Hamburger', price: 175, stok: 50 },
    { id: 'u3', name: 'Tavuk Hamburger', price: 120, stok: 50 },
    { id: 'u4', name: 'Tereyağlı Hamburger', price: 130, stok: 50 },
    { id: 'u6', name: 'Sucuklu Pizza ', price: 210, stok: 50 },
    { id: 'u7', name: 'Karışık Pizza ', price: 260, stok: 50 },
    { id: 'u8', name: 'Pastırmalı Pizza ', price: 230, stok: 50 },
    { id: 'u9', name: 'Mantarlı Pizza ', price: 240, stok: 50 },
    { id: 'u11', name: 'Patates Kızartması (Orta)', price: 65, stok: 50 },
    { id: 'u12', name: 'Patates Kızartması (Büyük)', price: 80, stok: 50 },
    { id: 'u13', name: 'Soğan Halkası (8\'li)', price: 75, stok: 50 },
    { id: 'u14', name: 'Tavuk Nuggets (8\'li)', price: 85, stok: 50 },
    { id: 'u16', name: 'Kola (33 cl)', price: 40, stok: 100 },
    { id: 'u17', name: 'Ayran (200 ml)', price: 30, stok: 100 },
    { id: 'u18', name: 'Şeftali Soğuk Çay (33 cl)', price: 40, stok: 100 },
    { id: 'u19', name: 'Soda(200 ml)', price: 25, stok: 100 },
    { id: 'u20', name: 'Su (500 ml)', price: 15, stok: 100 }
];

const Menuler = [
    { id: 'm1', name: 'Islak Menü (Islak Hamburger + Patates Kızartması (Orta) + Kola (33 cl))', price: 220 },
    { id: 'm2', name: 'Köfte Burger Menü (Köfte Hamburger + Patates Kızartması (Büyük) + Kola (33 cl))', price: 270 },
    { id: 'm3', name: 'Tavuk Menü (Tavuk Hamburger + Patates Kızartması (Orta) + Ayran (200 ml))', price: 200 },
    { id: 'm4', name: 'Tereyağlı Burger Menü (Tereyağlı Hamburger + Patates Kızartması (Orta) + Şeftali Soğuk Çay (33 cl))', price: 215 },
    { id: 'm5', name: 'İkili Burger Menü (2 Kişilik) (Köfte Hamburger + Tavuk Hamburger + 2 Patates Kızartması (Orta) + Kola (33 cl) + Ayran (200 ml))', price: 450 },
    { id: 'm6', name: 'Sucuklu Pizza Menü (Sucuklu Pizza + Patates Kızartması (Orta) + Kola (33 cl))', price: 290 },
    { id: 'm7', name: 'Karışık Aile Pizza Menüsü (Karışık Pizza + Mantarlı Pizza + 2 Patates Kızartması (Büyük) + 2 Kola (33 cl))', price: 660 },
    { id: 'm8', name: 'Pastırmalı Pizza Menü (Pastırmalı Pizza + Patates Kızartması (Orta) + Ayran (200 ml))', price: 300 },
    { id: 'm9', name: 'Aile Burger Menüsü (4 Kişilik) (2 Köfte Hamburger + 2 Patates Kızartması (Orta) + 2 Kola (33 cl) + Su (500 ml))', price: 540 },
    { id: 'm10', name: 'Öğrenci Menüsü (Islak Hamburger + Kola (33 cl))', price: 150 }
];


app.get('/', (req, res) => {
    res.render('index', {
        urunler: Urunler,
        menuler: Menuler
    });
});


app.post('/api/kayit', (req, res) => {
    const { ad, mail, sifre, rol } = req.body;
    if (!ad || !mail || !sifre || !rol) {
        return res.status(400).json({ status: 'error', mesaj: 'Lütfen tüm alanları doldurun.' });
    }
    const sql = "INSERT INTO kullanicilar (ad_soyad, email, sifre, rol) VALUES (?, ?, ?, ?)";
    db.query(sql, [ad, mail, sifre, rol], (err, result) => {
        if (err) {
            console.error("SQL KAYIT HATASI:", err);
            return res.status(500).json({ status: 'error', mesaj: 'Veritabanı hatası oluştu.' });
        }
        res.json({ status: 'ok', mesaj: 'Kayıt başarılı!' });
    });
});


app.post('/api/giris', (req, res) => {
    const { kadi, sifre, rol } = req.body;
    const sql = "SELECT * FROM kullanicilar WHERE ad_soyad = ? AND sifre = ? AND rol = ?";
    db.query(sql, [kadi, sifre, rol], (err, results) => {
        if (err) {
            return res.status(500).json({ status: 'error', mesaj: 'Sunucu hatası.' });
        }
        if (results.length > 0) {
            res.json({ status: 'ok', kullanici: results[0] });
        } else {
            res.json({ status: 'error', mesaj: 'Kullanıcı adı, şifre veya rol hatalı!' });
        }
    });
});

// --- YENİ SİPARİŞ API'Sİ (Sequelize ile) ---
app.post('/api/siparis-ver', async (req, res) => {
    const { sepet, masa } = req.body;

    if (!sepet || sepet.length === 0) {
        return res.status(400).json({ status: 'error', mesaj: 'Sepet boş' });
    }

    try {
        // 1. Stokları düş (Bellekteki array'den)
        sepet.forEach(sepetUrunu => {
            const urun = Urunler.find(u => u.id === sepetUrunu.id);
            if (urun && urun.stok >= sepetUrunu.adet) {
                urun.stok = urun.stok - sepetUrunu.adet;
            }
        });

        // 2. Siparişi Veritabanına Kaydet (Sequelize)
        await Siparis.create({
            masa: masa,
            icerik: sepet, // JSON formatında kaydeder
            durum: 'bekleyen'
        });

        res.json({ status: 'ok', mesaj: 'Siparişiniz alındı ve mutfağa iletildi!' });

    } catch (error) {
        console.error("Sipariş Hatası:", error);
        res.status(500).json({ status: 'error', mesaj: 'Sipariş oluşturulurken hata oluştu.' });
    }
});

// --- MUTFAK API'LERİ ---

// Tüm aktif siparişleri getir
app.get('/api/mutfak/siparisler', async (req, res) => {
    try {
        // 'servis_edildi' olmayan siparişleri getir (Mutfak ekranı için)
        // Ancak Garson 'tamamlandi' olanları görecek.
        // Mutfak sadece 'bekleyen', 'hazirlaniyor', 'tamamlandi' durumlarını görsün.
        const siparisler = await Siparis.findAll({
            order: [['createdAt', 'ASC']]
        });
        res.json({ status: 'ok', data: siparisler });
    } catch (error) {
        res.status(500).json({ status: 'error', mesaj: 'Veri çekilemedi' });
    }
});

// Sipariş durumunu güncelle
app.post('/api/mutfak/durum-guncelle', async (req, res) => {
    const { id, yeniDurum } = req.body;
    try {
        await Siparis.update({ durum: yeniDurum }, { where: { id: id } });
        res.json({ status: 'ok', mesaj: 'Durum güncellendi' });
    } catch (error) {
        res.status(500).json({ status: 'error', mesaj: 'Güncelleme hatası' });
    }
});

// --- GARSON API'LERİ ---

// Masa doluluk durumu (Siparişi olan masalar)
app.get('/api/garson/masa-durumlari', async (req, res) => {
    try {
        // Bekleyen veya hazırlanıyor veya tamamlandı durumundaki siparişlerin masalarını bul
        const aktifSiparisler = await Siparis.findAll({
            where: {
                durum: ['bekleyen', 'hazirlaniyor', 'tamamlandi']
            },
            attributes: ['masa']
        });

        // Benzersiz masa isimlerini al
        const doluMasalar = [...new Set(aktifSiparisler.map(s => s.masa))];

        res.json({ status: 'ok', doluMasalar: doluMasalar });
    } catch (error) {
        res.status(500).json({ status: 'error', mesaj: 'Hata' });
    }
});

// Misafir için son durumu kontrol et (Polling)
app.get('/api/misafir/siparis-durumu', async (req, res) => {
    const { masa } = req.query;
    try {
        // Bu masaya ait en son güncellenen siparişi bul
        const sonSiparis = await Siparis.findOne({
            where: { masa: masa },
            order: [['updatedAt', 'DESC']]
        });

        if (sonSiparis) {
            res.json({ status: 'ok', durum: sonSiparis.durum });
        } else {
            res.json({ status: 'ok', durum: 'yok' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error' });
    }
});


// --- REZERVASYON API (Mevcut) ---

app.post('/api/rezervasyon-olustur', (req, res) => {
    const { ad, telefon, tarih, saat, masa } = req.body;
    if (!ad || !telefon || !tarih || !saat) {
        return res.json({ status: 'error', mesaj: 'Lütfen tüm alanları doldurun.' });
    }
    const kontrolSql = "SELECT * FROM rezervasyonlar WHERE masa = ? AND tarih = ? AND saat = ? AND durum = 'Onaylandı'";
    db.query(kontrolSql, [masa, tarih, saat], (err, results) => {
        if (err) { return res.json({ status: 'error', mesaj: 'Kontrol hatası oluştu.' }); }
        if (results.length > 0) {
            return res.json({ status: 'error', mesaj: `Üzgünüz, ${masa} seçtiğiniz saatte (${saat}) dolu.` });
        } else {
            const insertSql = "INSERT INTO rezervasyonlar (ad_soyad, telefon, tarih, saat, masa, durum) VALUES (?, ?, ?, ?, ?, 'Bekliyor')";
            db.query(insertSql, [ad, telefon, tarih, saat, masa], (err2, result) => {
                if (err2) { return res.json({ status: 'error', mesaj: 'Veritabanı hatası' }); }
                res.json({ status: 'ok', mesaj: 'Rezervasyon talebiniz alındı, onay bekleniyor.' });
            });
        }
    });
});

app.get('/api/rezervasyonlar', (req, res) => {
    const sql = "SELECT * FROM rezervasyonlar ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) { return res.json({ status: 'error', mesaj: 'Listeleme hatası' }); }
        res.json({ status: 'ok', data: results });
    });
});

app.post('/api/rezervasyon-onayla', (req, res) => {
    const { id } = req.body;
    const sql = "UPDATE rezervasyonlar SET durum = 'Onaylandı' WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) { return res.json({ status: 'error', mesaj: 'Onaylama hatası' }); }
        res.json({ status: 'ok', mesaj: 'Rezervasyon onaylandı.' });
    });
});

app.post('/api/rezervasyon-iptal', (req, res) => {
    const { id } = req.body;
    const sql = "DELETE FROM rezervasyonlar WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) { return res.json({ status: 'error', mesaj: 'İptal hatası' }); }
        res.json({ status: 'ok', mesaj: 'Rezervasyon iptal edildi.' });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server çalışıyor");
});
