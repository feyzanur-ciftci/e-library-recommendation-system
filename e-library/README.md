# E-Library: Intelligent Book Recommendation System

Bu proje, kullanıcılara kişiselleştirilmiş okuma deneyimleri sunmak amacıyla geliştirilmiş, üç katmanlı servis odaklı mimariye sahip akıllı bir dijital kütüphane ve öneri motorudur. Sistem; React tabanlı dinamik bir arayüz, Node.js/Express.js destekli sağlam bir iş mantığı katmanı ve Python/Flask üzerinde çalışan gelişmiş bir makine öğrenmesi analitik motorundan oluşmaktadır.

## Proje Mimarisi ve Kullanılan Teknolojiler
Proje, modülerliği artırmak ve analitik işlem yükünü dağıtmak amacıyla servisler arası asenkron iletişim kuracak şekilde tasarlanmıştır.

* **Frontend (İstemci):** React.js
* **Backend (Ana Sunucu):** Node.js, Express.js
* **Analitik Motoru (Öneri Servisi):** Python, Flask
* **Veritabanı:** MongoDB
* **Veri Bilimi Kütüphaneleri:** SciPy, Scikit-Learn, NumPy, Pandas

---

## Öneri Motoru Algoritmaları (Recommendation Engine)

Sistemin kalbinde, farklı senaryolara ve kullanıcı etkileşim seviyelerine göre dinamik olarak devreye giren hibrit bir öneri mekanizması yatmaktadır.

### 1. Ana Karar Mekanizması ve "Cold Start" Çözümü
Sisteme yeni kayıt olan ve henüz hiçbir oylama (rating) geçmişi bulunmayan kullanıcılar için "Soğuk Başlangıç" (Cold Start) problemi özel bir yaklaşımla çözülmüştür.
* **Bayes Ortalaması (IMDb Formülü):** Kitapların sadece ortalama puanları değil, aldıkları oy sayıları da hesaba katılarak istatistiksel bir ağırlıklandırma (Bayes Average) yapılmış ve yeni kullanıcılara yüksek güvenilirlikli statik başyapıt listeleri sunulmuştur. Bu veriler sistemin hızlı yanıt vermesi için önbelleğe (JSON) alınmıştır.

### 2. İçerik Tabanlı Filtreleme (Content-Based Filtering)
Kullanıcının daha önce yüksek puan verdiği kitapların özellikleri analiz edilerek benzer profile sahip yeni kitaplar önerilir.
* **Meta Veri ve Konu (Subject) Analizi:** Kitapların tam metin (full-text) analizinden ziyade, Gutendex API'den çekilen güvenilir konu etiketleri (metadata/subjects) temel alınmıştır.
* **Matris Dönüşümü ve Vektörel Benzerlik:** Kitap başlıkları Regex ile temizlenmiş, konu etiketleri `CountVectorizer` kullanılarak 1/0 ikili özellik matrislerine dönüştürülmüştür. Aktif kullanıcının oyladığı kitaplardan bir "Kullanıcı Profil Vektörü" oluşturulmuş ve kütüphane matrisi ile **Nokta Çarpımı (Dot Product)** yapılarak en yüksek skorlu kitaplar listelenmiştir.

### 3. İşbirlikçi Filtreleme (Collaborative Filtering)
Kullanıcıların zevk uyumları ve kolektif oylama eğilimleri üzerinden kişiselleştirilmiş öneriler sunan iki farklı model geliştirilmiştir. Büyük veri setlerindeki seyreklik (sparsity) problemi, verilerin **SciPy CSR Sıkıştırılmış Seyrek Matris** formatına dönüştürülmesiyle optimize edilmiştir.

* **A. Öğe Tabanlı (Item-Based) İşbirlikçi Filtreleme:** Kitap detay sayfalarında "Bu Kitaba Benzer Kitaplar" modülünü besler. Canlı sunucuyu yormamak adına, kitaplar arası **Kosinüs Benzerliği (Cosine Similarity)** matrisi çevrim dışı (offline) olarak hesaplanmış ve bir sözlük yapısı (Pickle - `.pkl`) halinde serileştirilmiştir. Çalışma zamanında O(1) karmaşıklığı ile anında yanıt üretir.
  
* **B. Kullanıcı Tabanlı (User-Based) İşbirlikçi Filtreleme:** Aktif kullanıcının anlık oylama verileri alınarak, tersine indeksleme (inverted index) yöntemiyle arama uzayı daraltılır. Ortak kitapları okuyan adaylar arasından en yakın 30 komşu (top-N) tespit edilir. Hedef kullanıcının henüz okumadığı komşu favorileri, komşuların benzerlik skorları ile normalize edilmiş ağırlıklı ortalamalar hesaplanarak filtrelenir ve ana sayfa öneri listesi olarak sunulur.

---

## Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için projeyi klonladıktan sonra 3 farklı servisi sırasıyla ayağa kaldırmanız gerekmektedir. Projenin ana dizininde üç ayrı terminal açarak aşağıdaki komutları çalıştırın:

**1. Python/Flask Analitik Servisini Başlatma**
```bash
cd backend/back
pip install -r requirements.txt
py server.py
```
*(Not: Sisteminizde `py` komutu çalışmazsa `python server.py` veya `python3 server.py` kullanabilirsiniz.)*

**2. Node.js Backend Sunucusunu Başlatma**
```bash
cd backend
npm install
npm run dev
```

**3. React Frontend İstemcisini Başlatma**
```bash
cd e-library
npm install
npm run dev
```
