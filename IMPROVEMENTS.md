# Focus Blocker - İyileştirme Yol Haritası

## 1. Güvenlik Düzeltmeleri

- [x] **URL eşleştirme zafiyeti** — `background.js:3`
  - `tabUrl.host.includes(website)` loose matching tehlikeli
  - `not-facebook.com` veya `facebook.com.evil.com` gibi siteler yanlışlıkla eşleşiyor
  - Exact domain veya subdomain matching yapılmalı
- [x] **Blocked page open redirect riski** — `blocked.js:6`
  - Query param'dan gelen URL doğrudan link olarak set ediliyor
  - `javascript:` veya başka protocol ile kötüye kullanılabilir
  - URL validasyonu eklenmeli

## 2. Build & Altyapı Modernizasyonu

- [x] **Bundler güncellemesi** — `parcel-bundler@1.x` (2019) → Vite 7
- [x] **TypeScript geçişi** — Vanilla JS → TypeScript
- [x] **Lint & Format** — ESLint + Prettier eklendi
- [x] **Test altyapısı** — Vitest eklendi (url-utils testleri mevcut)
- [x] **CI/CD güncellemesi**
  - Node 16 (EOL) → Node 22
  - `actions/checkout@v1` → `@v4`
  - `actions/setup-node@v1` → `@v4`
- [x] **`dist/` klasörü `.gitignore`'da** — Zaten mevcut

## 3. Kod Kalitesi

- [x] **Input validation** — Boş satır, geçersiz URL, tekrarlayan girişler filtrelenmeli
- [x] **Hata yönetimi** — `chrome.storage` çağrılarına error handling eklenmeli
- [x] **Yorum satırındaki ölü kod temizliği** — `background.js:59-61` `onUninstalled` listener

## 4. UX / UI İyileştirmeleri

- [x] **Save sonrası geri bildirim** — Popup kapanmadan önce "Kaydedildi" mesajı
- [x] **Toggle label** — "Odak Modu Aktif/Pasif" yazısı eklenmeli
- [x] **Blocked page styling** — `blocked.html` hiç CSS içermiyor, tasarım eklenmeli
- [x] **Popup UI yenileme** — Textarea yerine chip/tag tarzı site listesi
- [x] **Dark mode** — Popup ve blocked page için karanlık tema desteği

## 5. Yeni Özellikler — Yüksek Etki

- [x] **Pomodoro / Zamanlayıcı** — "25 dk odaklan, 5 dk mola" zaman bazlı bloklama
- [x] **Zaman planlaması** — Belirli gün ve saatlerde otomatik aktifleştirme (ör. hafta içi 09:00-17:00)
- [x] **Şifre koruması** — Ayarları değiştirmek için şifre gerekliliği
- [x] **Kategori / Grup** — "Sosyal medya", "Haberler" gibi gruplar halinde toplu engelleme
- [x] **İstatistikler** — Kaç kez engellendiği, hangi sitelere en çok gitmeye çalışıldığı

## 6. Yeni Özellikler — Orta Etki

- [x] **Import / Export** — Ayarları JSON olarak dışa/içe aktarma
- [x] **Wildcard desteği** — `*.reddit.com` gibi pattern matching
- [x] **Keyboard shortcuts** — Hızlı toggle için kısayol tuşları
- [x] **Site başına silme** — Listeden tek tek site kaldırabilme

## 7. Yeni Özellikler — Profesyonellik

- [ ] **Onboarding** — İlk kurulumda adım adım rehber
- [ ] **Bildirimler** — Engelleme aktifken hatırlatma bildirimleri
- [ ] **Whitelist modu** — Sadece belirli sitelere izin ver, geri kalanını engelle
- [ ] **Çoklu dil desteği (i18n)** — Chrome'un `_locales` API'si ile
