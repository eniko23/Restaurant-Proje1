document.addEventListener('DOMContentLoaded', function () {
    const girisEkrani      = document.getElementById('girisEkrani');
    const uygulamaKok      = document.getElementById('uygulamaKok');
    const misafirSeçeneği  = document.getElementById('misafir'); 
    const garsonSeçeneği   = document.getElementById('garson');
    const mutfakSeçeneği   = document.getElementById('mutfak'); 

    const misafirButonu    = document.getElementById('misafirGirisButonu');
    const personelButonu   = document.getElementById('garsonGirisButonu'); 
    const personelRolSecimi= document.getElementById('personelRolSecimi'); 
    const ÇıkışButonu      = document.getElementById('cikisButonu');
    
    const rolEtiketi       = document.getElementById('rolEtiketi');
    const sepetTemizleButonu = document.getElementById('sepetTemizle');

    const kayitEkrani     = document.getElementById('kayitEkrani');
    const kayitButonu     = document.getElementById('kayitButonu'); 
    const kayitOlButonu   = document.getElementById('kayitOlButonu'); 
    const kayitGeriButonu = document.getElementById('kayitGeriButonu');

    const girisModalElement = document.getElementById('girisModal');
    let girisModal = null;
    if (girisModalElement) {
        girisModal = new bootstrap.Modal(girisModalElement);
    }
    const modalBaslik = document.getElementById('modalBaslik');
    const modalKadiInput = document.getElementById('modalKadi');
    const modalSifreInput = document.getElementById('modalSifre');
    const hedefRolInput = document.getElementById('hedefRol');
    const modalGirisYapButonu = document.getElementById('modalGirisYapButonu');


    const misafirOdemeModalEl = document.getElementById('misafirOdemeModal');
    let misafirOdemeModal = null;
    if (misafirOdemeModalEl) {
        misafirOdemeModal = new bootstrap.Modal(misafirOdemeModalEl);
    }


    const inputCardHolder = document.getElementById('inputCardHolder');
    const inputCardNumber = document.getElementById('inputCardNumber');
    const inputExpires    = document.getElementById('inputExpires');
    
    const previewCardHolder = document.getElementById('previewCardHolder');
    const previewCardNumber = document.getElementById('previewCardNumber');
    const previewExpires    = document.getElementById('previewExpires');

    if(inputCardHolder) {
        inputCardHolder.addEventListener('input', function(e) {
            previewCardHolder.textContent = e.target.value.toUpperCase() || 'AD SOYAD';
        });
    }

    if(inputCardNumber) {
        inputCardNumber.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0,16);
            let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
            e.target.value = formatted;
            previewCardNumber.textContent = formatted || '**** **** **** ****';
        });
    }

    if(inputExpires) {
        inputExpires.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '').substring(0,4);
            if(val.length >= 2) val = val.substring(0,2) + '/' + val.substring(2);
            e.target.value = val;
            previewExpires.textContent = val || 'MM/YY';
        });
    }
  
    let seciliMasaGlobal = "Masa 1";
    let globalSiparisListesi = []; 
    let globalRezervasyonListesi = []; 

    let sonVeriler = {
        garsonMutfak: null,
        garsonRezTalep: null,
        garsonRezAktif: null,
        garsonOdeme: null,
        mutfakBekleyen: null,
        mutfakHazirlaniyor: null,
        mutfakTamamlanan: null
    };

    function veriDegistiMi(key, yeniVeriJson) {
        const eskiDataStr = JSON.stringify(sonVeriler[key]);
        const yeniDataStr = JSON.stringify(yeniVeriJson);
        if (eskiDataStr !== yeniDataStr) {
            sonVeriler[key] = JSON.parse(yeniDataStr); 
            return true; 
        }
        return false; 
    }

    function htmlBas(elementId, htmlKod) {
        const el = document.getElementById(elementId);
        if (el) el.innerHTML = htmlKod;
    }

 
    function panelDegistir(aktifPanelId) {
        if (girisEkrani) girisEkrani.style.display = 'none';
        if (kayitEkrani) kayitEkrani.style.display = 'none';
        if (uygulamaKok) uygulamaKok.style.display = 'block';

        if (misafirSeçeneği) misafirSeçeneği.style.display = 'none';
        if (garsonSeçeneği)  garsonSeçeneği.style.display = 'none';
        if (mutfakSeçeneği)  mutfakSeçeneği.style.display = 'none';

        if (aktifPanelId === 'misafir' && misafirSeçeneği) {
            misafirSeçeneği.style.display = 'grid';
            rolEtiketi.textContent = 'Misafir';
            const masaSelect = document.getElementById('misafirMasa');
            if(masaSelect) {
                seciliMasaGlobal = masaSelect.value;
                masaSelect.addEventListener('change', (e) => {
                    seciliMasaGlobal = e.target.value;
                    sonBildirimDurumu = null;
                });
            }
            misafirDurumKontrolBaslat();
            setInterval(misafirOdemeTakip, 2000);

        } else if (aktifPanelId === 'garson' && garsonSeçeneği) {
            garsonSeçeneği.style.display = 'grid';
            rolEtiketi.textContent = 'Garson';
            garsonTumVerileriGuncelle();
            setInterval(() => {
                if(garsonSeçeneği.style.display !== 'none') {
                    garsonTumVerileriGuncelle();
                }
            }, 1000);

        } else if (aktifPanelId === 'mutfak' && mutfakSeçeneği) {
            mutfakSeçeneği.style.display = 'grid'; 
            rolEtiketi.textContent = 'Mutfak';
            mutfakVerileriniGetir(); 
            setInterval(() => {
                if(mutfakSeçeneği.style.display !== 'none') {
                    mutfakVerileriniGetir();
                }
            }, 1000);
        }
    }

    function garsonTumVerileriGuncelle() {
        fetch('/api/rezervasyonlar')
        .then(r => r.json())
        .then(res => {
            if(res.status === 'ok') {
                globalRezervasyonListesi = res.data;
                garsonRezervasyonListeleriniCiz(res.data);
                return fetch('/api/mutfak/siparisler');
            }
        })
        .then(r => r.json())
        .then(res => {
             if(res && res.status === 'ok') {
                 globalSiparisListesi = res.data;
                 garsonMutfakBildirimleriniCiz(res.data);
                 return fetch('/api/garson/masa-durumlari');
             }
        })
        .then(r => r.json())
        .then(res => {
            if(res && res.status === 'ok') {
                garsonMasalariCiz(res.doluMasalar);
            }
        })
        .catch(err => console.log("Veri çekme hatası:", err));
        
        garsonOdemeIstekleriniGuncelle();
    }

    function misafirOdemeTakip() {
        const panel = document.getElementById('misafir');
        if(!panel || panel.style.display === 'none') return;
        const masa = document.getElementById('misafirMasa').value;
        
        fetch(`/api/misafir/odeme-durum-kontrol?masa=${masa}`)
        .then(r => r.json())
        .then(res => {
            if(res.status === 'ok' && res.durum === 'odeme_modunda') {
                 if (!misafirOdemeModalEl.classList.contains('show')) {
                     document.getElementById('modalOdemeTutar').innerText = res.tutar + " ₺";
                     misafirOdemeModal.show();
                 }
            }
        }).catch(e=>{});
    }

    const btnMisafirOdemeyiBitir = document.getElementById('btnMisafirOdemeyiBitir');
    if(btnMisafirOdemeyiBitir) {
        btnMisafirOdemeyiBitir.addEventListener('click', function() {
            const masa = document.getElementById('misafirMasa').value;
            btnMisafirOdemeyiBitir.disabled = true;
            btnMisafirOdemeyiBitir.textContent = "İşleniyor...";

            fetch('/api/misafir/odeme-yap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ masa: masa })
            })
            .then(r => r.json())
            .then(data => {
                alert("Ödeme Başarılı! Teşekkür ederiz.");
                misafirOdemeModal.hide();
                btnMisafirOdemeyiBitir.disabled = false;
                btnMisafirOdemeyiBitir.textContent = "ÖDEMEYİ TAMAMLA";
                location.reload(); 
            });
        });
    }

    function girisModalAc(rol) {
        if(!girisModal) return;
        modalKadiInput.value = '';
        modalSifreInput.value = '';
        modalBaslik.textContent = rol + " Girişi";
        hedefRolInput.value = rol; 
        girisModal.show();
    }

    if (modalGirisYapButonu) {
        modalGirisYapButonu.addEventListener('click', function() {
            const kadi = modalKadiInput.value;
            const sifre = modalSifreInput.value;
            const rol = hedefRolInput.value;

            fetch('/api/giris', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kadi: kadi, sifre: sifre, rol: rol })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    alert("Giriş Başarılı! Hoşgeldiniz " + data.kullanici.ad_soyad);
                    if(girisModal) girisModal.hide();

                    if (data.kullanici.rol === 'Misafir') panelDegistir('misafir');
                    else if (data.kullanici.rol === 'Garson') panelDegistir('garson');
                    else if (data.kullanici.rol === 'Mutfak') panelDegistir('mutfak');
                } else {
                    alert("Hata: " + data.mesaj);
                }
            })
            .catch(err => alert("Bağlantı hatası!"));
        });
    }

    if (kayitButonu) kayitButonu.addEventListener('click', () => { girisEkrani.style.display = 'none'; kayitEkrani.style.display = 'flex'; });
    if (kayitGeriButonu) kayitGeriButonu.addEventListener('click', () => { kayitEkrani.style.display = 'none'; girisEkrani.style.display = 'flex'; });
    if (kayitOlButonu) {
      kayitOlButonu.addEventListener('click', () => {
        const ad = document.getElementById('kayitAd').value.trim();
        const mail = document.getElementById('kayitMail').value.trim();
        const sifre = document.getElementById('kayitSifre').value.trim();
        const secilenRol = document.getElementById('kayitRol').value; 
        if (!secilenRol || !ad || !mail || !sifre) { alert('Lütfen tüm alanları doldurun.'); return; }
        fetch('/api/kayit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad: ad, mail: mail, sifre: sifre, rol: secilenRol })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'ok') {
                alert(`Kayıt Başarılı!`);
                kayitEkrani.style.display = 'none';
                girisEkrani.style.display = 'flex';
            } else {
                alert('Hata: ' + data.mesaj);
            }
        });
      });
    }

    if (personelButonu) personelButonu.addEventListener('click', () => girisModalAc(personelRolSecimi ? personelRolSecimi.value : 'Garson'));
    if (misafirButonu) misafirButonu.addEventListener('click', () => girisModalAc('Misafir'));
    if (ÇıkışButonu) ÇıkışButonu.addEventListener('click', () => window.location.reload());

    let sepet = [];
  
    function sepetiGuncelle() {
      const sepetListesi = document.getElementById('sepetListesi');
      const araToplamEl  = document.getElementById('araToplam');
      const kdvEl    = document.getElementById('kdv');
      const genelToplamEl = document.getElementById('genelToplam');
      if (!sepetListesi) return;

      let html = '';
      let araToplamDeğeri = 0;
      sepet.forEach(item => {
        araToplamDeğeri += item.price * item.adet;
        html += `<div class="row"><div><b>* ${item.name}</b></div><div class="muted">Adet: ${item.adet}</div></div>`;
      });
      htmlBas('sepetListesi', html);

      const toplamKdv = araToplamDeğeri * 0.10;
      const toplam = araToplamDeğeri + toplamKdv;
      if (araToplamEl)    araToplamEl.textContent    = araToplamDeğeri.toFixed(2) + ' ₺';
      if (kdvEl)          kdvEl.textContent          = toplamKdv.toFixed(2) + ' ₺';
      if (genelToplamEl)  genelToplamEl.textContent  = toplam.toFixed(2) + ' ₺';
    }
  
    window.sepetEkle = function(gelenId) {
        let urun = null;
        if (window.Urunler) urun = window.Urunler.find(u => u.id == gelenId);
        if (!urun && window.Menuler) urun = window.Menuler.find(m => m.id == gelenId);
        if (!urun) return;
        const mevcut = sepet.find(s => s.id == gelenId);
        if (urun.stok !== undefined && (mevcut ? mevcut.adet : 0) + 1 > urun.stok) { alert("Stok yetersiz!"); return; }
        if (mevcut) mevcut.adet++; else sepet.push({ id: urun.id, name: urun.name, price: urun.price, adet: 1 });
        sepetiGuncelle();
        butonGuncelle();
    };
  
    window.sepetCikar = function(urunId) {
      const mevcut = sepet.find(s => s.id == urunId);
      if (!mevcut) return;
      mevcut.adet--;
      if (mevcut.adet <= 0) sepet = sepet.filter(s => s.id != urunId);
      sepetiGuncelle();
      if(sepet.length === 0) butonGuncelle();
    };

    function butonGuncelle() {
        const btn = document.getElementById('siparisGonderButonu');
        if(btn) {
            if(sepet.length > 0) {
                btn.textContent = "SİPARİŞİ GÖNDER";
                btn.classList.add('orange');
                btn.disabled = false;
            } else {
                btn.textContent = "SİPARİŞİ GÖNDER";
                btn.disabled = false;
            }
        }
    }
  
    window.sepetTemizle = function() {
       sepet = [];
       sepetiGuncelle();
       butonGuncelle();
    };
    if (sepetTemizleButonu) sepetTemizleButonu.addEventListener('click', window.sepetTemizle);
  
    const siparisGonderButonu = document.getElementById('siparisGonderButonu');
    if(siparisGonderButonu) {
        siparisGonderButonu.addEventListener('click', function() {
            if(sepet.length === 0) { alert("Sepetiniz boş!"); return; }
            const masa = document.getElementById('misafirMasa').value;
            fetch('/api/siparis-ver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sepet: sepet, masa: masa }) 
            })
            .then(r => r.json())
            .then(data => {
                 if(data.status === 'ok') {
                    alert("Siparişiniz Mutfağa İletildi! Hazırlanıyor...");
                    siparisGonderButonu.textContent = "✔ İLETİLDİ / EKLEME YAP";
                    sonBildirimDurumu = 'bekleyen';
                 } else {
                    alert("Hata: " + data.mesaj);
                 }
            });
        });
    }

    const btnMisafirHesapIste = document.getElementById('btnMisafirHesapIste');
    if (btnMisafirHesapIste) {
        btnMisafirHesapIste.addEventListener('click', function() {
            const masaAdi = document.getElementById('misafirMasa').value;
            if(confirm("Hesabı istemek ve ödeme sürecini başlatmak istiyor musunuz?")) {
                fetch('/api/odeme/iste', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ masa: masaAdi })
                })
                .then(r => r.json())
                .then(data => {
                    alert(data.mesaj);
                    window.sepetTemizle();
                });
            }
        });
    }

    function garsonMasalariCiz(doluMasalar) {
        const masalar = [
            { ad: 'Masa 1' }, { ad: 'Masa 2' }, { ad: 'Masa 3' }, { ad: 'Masa 4' },
            { ad: 'Masa 5' }, { ad: 'Masa 6' }, { ad: 'Masa 7' }
        ];

        let html = '';
        masalar.forEach(m => {
            let durumText = 'Boş';
            let durumRenk = 'rgba(255, 255, 255, 0.1)'; 
            let kenarRenk = 'gray';
            let yaziRenk = 'gray';
            
            const servisEdilenSiparisVarMi = globalSiparisListesi.find(s => s.masa === m.ad && s.durum === 'servis_edildi');
            const backendDolu = doluMasalar.includes(m.ad);
            const rez = globalRezervasyonListesi.find(r => r.masa === m.ad);

            if (backendDolu || servisEdilenSiparisVarMi) {
                durumText = 'Dolu / Servis';
                kenarRenk = '#e53e3e';
                durumRenk = 'rgba(229, 62, 62, 0.2)'; 
                yaziRenk = '#fc8181';
            }
            else if (rez) {
                if (rez.durum === 'Onaylandı') {
                    durumText = 'Rezervasyonlu';
                    kenarRenk = '#3182ce'; 
                    durumRenk = 'rgba(49, 130, 206, 0.3)';
                    yaziRenk = '#63b3ed';
                } else if (rez.durum === 'Bekliyor') {
                    durumText = 'Rez. Talebi';
                    kenarRenk = '#805ad5'; 
                    durumRenk = 'rgba(128, 90, 213, 0.3)';
                    yaziRenk = '#d6bcfa';
                }
            }
            html += `
                <div class="card" style="border: 2px solid ${kenarRenk}; padding: 12px; border-radius: 8px; background: ${durumRenk}; cursor:pointer; transition:all 0.2s;" onclick="alert('İşlem yapmak için ilgili panelleri kullanınız.');">
                    <div style="font-weight:bold; font-size:1.1rem; color:#fff;">${m.ad}</div>
                    <div style="color:${yaziRenk}; font-size:0.85em; margin-top:5px; font-weight:bold;">${durumText}</div>
                </div>
            `;
        });
        htmlBas('garsonMasaListesi', html);
    }

    function garsonMutfakBildirimleriniCiz(siparisler) {
        const tamamlananlar = siparisler.filter(s => s.durum === 'tamamlandi');
        if (!veriDegistiMi('garsonMutfak', tamamlananlar)) return;
        let html = '';
        if(tamamlananlar.length === 0) {
            html = '<div style="grid-column:1/-1; text-align:center; padding:20px;" class="muted">Servise hazır yemek yok.</div>';
        } else {
            tamamlananlar.forEach(sip => {
                let icerikText = '';
                if(sip.icerik && Array.isArray(sip.icerik)){
                    icerikText = sip.icerik.map(u => `<div>- ${u.adet}x ${u.name}</div>`).join('');
                }
                html += `
                    <div class="garson-card">
                        <div class="garson-card-header">
                            <span class="garson-card-title">${sip.masa}</span>
                            <span class="garson-card-status">HAZIR</span>
                        </div>
                        <div style="font-size:0.9rem; color:#ccc; margin-bottom:10px;">${icerikText}</div>
                        <button class="btn blue" style="width:100%;" onclick="garsonServisEt(${sip.id})">Servis Et (Masaya Götür)</button>
                    </div>`;
            });
        }
        htmlBas('garsonMutfakBildirimListesi', html);
    }

    function garsonRezervasyonListeleriniCiz(rezervasyonlar) {
        const bekleyenler = rezervasyonlar.filter(r => r.durum === 'Bekliyor');
        const onaylananlar = rezervasyonlar.filter(r => r.durum === 'Onaylandı');
        if (veriDegistiMi('garsonRezTalep', bekleyenler)) {
            let htmlBekleyen = '';
            if (bekleyenler.length === 0) htmlBekleyen = '<div class="muted text-center">Talep Yok</div>';
            else {
                bekleyenler.forEach(rez => {
                    htmlBekleyen += `
                    <div class="row" style="border-bottom:1px solid #444; padding:8px 0; align-items:center;">
                        <div style="flex:1;">
                            <b style="color:#d6bcfa;">${rez.masa}</b> - <span style="color:white;">${rez.ad_soyad}</span><br>
                            <small class="muted">${rez.saat}</small><br>
                            <span style="color:#90cdf4; font-size:0.9rem;">📞 ${rez.telefon || 'No Yok'}</span>
                        </div>
                        <button class="btn btn-sm btn-success" onclick="rezOnayla(${rez.id})">✔ Onayla</button>
                    </div>`;
                });
            }
            htmlBas('garsonRezervasyonTalepListesi', htmlBekleyen);
        }
        if (veriDegistiMi('garsonRezAktif', onaylananlar)) {
            let htmlOnaylanan = '';
            if (onaylananlar.length === 0) htmlOnaylanan = '<div class="muted text-center">Yok</div>';
            else {
                onaylananlar.forEach(rez => {
                    htmlOnaylanan += `
                    <div class="row" style="border-bottom:1px solid #444; padding:8px 0; align-items:center;">
                        <div style="flex:1;">
                            <b style="color:#63b3ed;">${rez.masa}</b> - <span style="color:white;">${rez.ad_soyad}</span><br>
                            <small class="muted">${rez.saat}</small><br>
                            <span style="color:#90cdf4; font-size:0.9rem;">📞 ${rez.telefon || 'No Yok'}</span>
                        </div>
                        <button class="btn btn-sm" style="border:1px solid #e53e3e; color:#e53e3e; background:transparent;" onclick="rezIptal(${rez.id})">
                             🗑 İptal
                        </button>
                    </div>`;
                });
            }
            htmlBas('garsonAktifRezervasyonListesi', htmlOnaylanan);
        }
    }

    function garsonOdemeIstekleriniGuncelle() {
        fetch('/api/garson/odeme-istekleri')
        .then(r => r.json())
        .then(res => {
            if(res.status === 'ok') {
                const istekler = res.data;
                if (!veriDegistiMi('garsonOdeme', istekler)) return;
                let html = '';
                if(istekler.length === 0) {
                    html = '<div class="row muted" style="justify-content:center; font-size:0.9rem;">Bekleyen yok.</div>';
                } else {
                    istekler.forEach((talep) => {
                        html += `
                            <div class="row" style="cursor:pointer; border-bottom:1px solid #444; padding:8px;" onclick="garsonOdemeDetayAc('${talep.masa}', '${talep.tutar}')">
                                <div style="display:flex; flex-direction:column;">
                                    <b style="color:#fc8181;">${talep.masa}</b>
                                    <small class="muted">Tutar Hesaplanıyor...</small>
                                </div>
                                <div style="text-align:right;">
                                    <b style="color:#fff;">${talep.tutar} ₺</b>
                                    <div style="color:#63b3ed; font-size:0.8rem;">İşlem Yap ></div>
                                </div>
                            </div>`;
                    });
                }
                htmlBas('garsonOdemeIstekListesi', html);
            }
        });
    }

    window.garsonOdemeDetayAc = function(masaAdi, tutar) {
        document.getElementById('garsonSeciliMasaBaslik').textContent = masaAdi;
        document.getElementById('garsonSeciliMasaBaslik').style.color = "#63b3ed";
        document.getElementById('garsonToplamTutar').textContent = tutar + " ₺";
        
        document.getElementById('garsonSepetListesi').innerHTML = `
            <div style="text-align:center; padding:20px; color:#ccc;">
                Bu masa <b>${tutar} ₺</b> tutarındaki hesabı ödemek istiyor.<br><br>
                "MİSAFİR ÖDEME EKRANINI AÇ" butonuna basarsanız misafirin ekranında kredi kartı giriş penceresi açılacaktır.
            </div>
        `;
    };

    const btnGarsonHesapKapat = document.getElementById('btnGarsonHesapKapat');
    if(btnGarsonHesapKapat) {
        btnGarsonHesapKapat.addEventListener('click', function() {
             const seciliMasaText = document.getElementById('garsonSeciliMasaBaslik').textContent;
             if(seciliMasaText === 'Masa Seçilmedi') { alert("Lütfen bir masa seçin!"); return; }

             fetch('/api/garson/odeme-izin-ver', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ masa: seciliMasaText })
             })
             .then(r => r.json())
             .then(data => {
                 alert("Misafirin ekranında ödeme penceresi açıldı. Misafir ödemeyi tamamlayınca masa kapanacaktır.");
                 document.getElementById('garsonSeciliMasaBaslik').textContent = "Masa Seçilmedi";
                 document.getElementById('garsonSeciliMasaBaslik').style.color = "#fff";
                 document.getElementById('garsonToplamTutar').textContent = "0.00 ₺";
                 document.getElementById('garsonSepetListesi').innerHTML = "";
                 garsonOdemeIstekleriniGuncelle();
             });
        });
    }

    window.garsonServisEt = function(siparisId) {
        fetch('/api/mutfak/durum-guncelle', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: siparisId, yeniDurum: 'servis_edildi' })
        }).then(r => r.json()).then(() => garsonTumVerileriGuncelle());
    }
    window.rezOnayla = function(id) {
        fetch('/api/rezervasyon-onayla', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: id }) })
        .then(r=>r.json()).then(d=>{ alert(d.mesaj); garsonTumVerileriGuncelle(); });
    }
    window.rezIptal = function(id) {
        if(confirm("Bu rezervasyon iptal edilsin mi?")) {
            fetch('/api/rezervasyon-iptal', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: id }) })
            .then(r=>r.json()).then(d=>{ garsonTumVerileriGuncelle(); });
        }
    }
    
    function mutfakVerileriniGetir() {
        fetch('/api/mutfak/siparisler').then(response => response.json()).then(res => {
            if(res.status === 'ok') {
                const siparisler = res.data;
                renderMutfakKolonu(siparisler, 'bekleyen', 'mutfakBekleyenListesi', 'kc-red', 'Başla >', 'hazirlaniyor', 'btn-warning', 'mutfakBekleyen');
                renderMutfakKolonu(siparisler, 'hazirlaniyor', 'mutfakHazirlaniyorListesi', 'kc-orange', 'Tamamla ✔', 'tamamlandi', 'btn-success', 'mutfakHazirlaniyor');
                renderMutfakKolonu(siparisler, 'tamamlandi', 'mutfakTamamlananListesi', 'kc-green', 'Garsona Bildirildi', '', 'btn-secondary', 'mutfakTamamlanan', true);
                document.getElementById('count-bekleyen').innerText = siparisler.filter(s => s.durum === 'bekleyen').length;
                document.getElementById('count-hazirlaniyor').innerText = siparisler.filter(s => s.durum === 'hazirlaniyor').length;
                document.getElementById('count-tamamlanan').innerText = siparisler.filter(s => s.durum === 'tamamlandi').length;
            }
        });
    }
    function renderMutfakKolonu(tumSiparisler, filtreDurum, elementId, kartSinifi, butonYazisi, yeniDurum, butonRenkSinifi, dataKey, butonPasifMi = false) {
        const siparisler = tumSiparisler.filter(s => s.durum === filtreDurum);
        if (!veriDegistiMi(dataKey, siparisler)) return;
        let html = '';
        if (siparisler.length === 0) { html = '<div class="muted text-center" style="margin-top:20px; font-style:italic; opacity:0.6;">Sipariş yok.</div>'; } 
        else {
            siparisler.forEach(sip => {
                let urunListesiHtml = '';
                if(Array.isArray(sip.icerik)) urunListesiHtml = sip.icerik.map(u => `<div>• ${u.name} (x${u.adet})</div>`).join('');
                const saat = new Date(sip.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
                let butonHtml = !butonPasifMi ? `<button class="btn btn-sm ${butonRenkSinifi}" onclick="siparisDurumDegistir(${sip.id}, '${yeniDurum}')">${butonYazisi}</button>` : `<span class="badge bg-secondary">Garson Bekleniyor...</span>`;
                html += `
                    <div class="k-card ${kartSinifi} animate-slide">
                        <div class="k-info"><span class="k-masa">${sip.masa}</span><span class="k-saat">${saat}</span></div>
                        <div class="k-urunler">${urunListesiHtml}</div>
                        <div class="k-actions">${butonHtml}</div>
                    </div>`;
            });
        }
        htmlBas(elementId, html);
    }
    window.siparisDurumDegistir = function(id, yeniDurum) {
        fetch('/api/mutfak/durum-guncelle', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: id, yeniDurum: yeniDurum })
        }).then(r => r.json()).then(d => { if(d.status === 'ok') mutfakVerileriniGetir(); });
    };

    let sonBildirimDurumu = null; 
    function misafirDurumKontrolBaslat() {
        if(window.misafirInterval) clearInterval(window.misafirInterval);
        window.misafirInterval = setInterval(() => {
            const panel = document.getElementById('misafir');
            if(!panel || panel.style.display === 'none') return;
            const masa = document.getElementById('misafirMasa').value;
            fetch(`/api/misafir/siparis-durumu?masa=${masa}`)
            .then(r => r.json())
            .then(res => {
                if(res.status !== 'ok') return;
                const yeniDurum = res.durum;
                if (sonBildirimDurumu === null) { sonBildirimDurumu = yeniDurum; return; }
                if (yeniDurum === 'servis_edildi' && sonBildirimDurumu !== 'servis_edildi') {
                    alert("🍽️ YEMEĞİNİZ GELDİ!\nGarson servis yaptı.\nAfiyet olsun!");
                    sonBildirimDurumu = yeniDurum; 
                } else if (yeniDurum !== sonBildirimDurumu) { sonBildirimDurumu = yeniDurum; }
            }).catch(err => console.log("Polling.."));
        }, 1000); 
    }
    
    const btnRezervasyon = document.getElementById('butonMisafirRezervasyon');
    if (btnRezervasyon) {
        btnRezervasyon.addEventListener('click', function() {
            const ad = document.getElementById('rezAd').value;
            const masa = document.getElementById('masaSeçimi').value;
            fetch('/api/rezervasyon-olustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ad: ad, masa: masa, telefon: document.getElementById('rezTelefon').value, tarih: document.getElementById('rezTarih').value, saat: document.getElementById('rezSaat').value })
            }).then(r => r.json()).then(data => { alert(data.mesaj); });
        });
    }
});