# LicenceFlow

LicenceFlow, şirket içinde kullanılan yazılım lisanslarını ve abonelikleri merkezi bir panelden takip etmek için geliştirilmiş Türkçe bir web uygulamasıdır.

## Özellikler

- Lisans ekleme, düzenleme, arşivleme ve silme
- Bitiş tarihine göre kalan gün ve durum hesaplama
- Aktif, yaklaşan ve süresi dolmuş lisans özetleri
- Yenileme takvimi ve tarih bazlı lisans görüntüleme
- Kategori bazlı yıllık maliyet analizi
- Ürün, tedarikçi, kategori, departman ve duruma göre arama
- Özelleştirilmiş departman seçim kutusu
- Türkçe ve temaya uyumlu tarih seçici
- Excel dosyasından toplu lisans aktarımı
- Excel çıktısı oluşturma
- Kalıcı Excel aktarım geçmişi
- Açık ve koyu tema desteği
- Responsive dashboard tasarımı

## Kullanılan Teknolojiler

- React 19
- TypeScript
- Vinext ve Vite
- Cloudflare D1 / SQLite
- Drizzle ORM
- SheetJS
- CSS

## Yerel Olarak Çalıştırma

Gereksinim: Node.js `22.13.0` veya daha yeni bir sürüm.

```bash
npm install
npm run dev
```

Dashboard varsayılan olarak aşağıdaki adreste açılır:

```text
http://localhost:3000
```

Üretim derlemesini kontrol etmek için:

```bash
npm run build
```

## Veritabanı

Lisans kayıtları ve Excel aktarım geçmişi D1 uyumlu SQLite veritabanında saklanır. Şema tanımları `db/schema.ts`, geçiş dosyaları ise `drizzle/` klasöründedir.

Şema değişikliklerinden sonra geçiş üretmek için:

```bash
npm run db:generate
```

## Excel Yapısı

İçe aktarma dosyasında aşağıdaki sütunlar kullanılabilir:

- Ürün / Hizmet
- Tedarikçi
- Kategori
- Başlangıç Tarihi
- Bitiş Tarihi
- Maliyet
- Para Birimi
- Departman
- Açıklama

Tarih alanları gerçek Excel tarih hücrelerini ve yaygın Türkçe tarih biçimlerini destekler. Dışa aktarılan tarihler `gg.aa.yyyy` görünümündedir.

## Notlar

- Uygulamada kimlik doğrulama bulunmaz.
- Tema tercihi tarayıcıda saklanır.
- Ayrı auth ekranı yerel geliştirme amaçlıdır ve bu GitHub deposuna dahil edilmez.
