import pandas as pd
import re

def normalize_title(text):
    if not isinstance(text, str): return ""
    text = text.lower()
    
    # 1. Gutenberg'de alt başlıklar genellikle \n veya : ile ayrılır. Sadece ana başlığı alıyoruz.
    text = re.split(r'[:\n]', text)[0]
    
    # 2. Goodreads'teki parantez içi seri ve edisyon bilgilerini siliyoruz.
    text = re.sub(r'\([^)]*\)', '', text)
    
    # 3. Noktalama işaretlerini ve özel karakterleri siliyoruz.
    text = re.sub(r'[^a-z0-9\s]', '', text)
    
    # 4. Eşleşme oranını artırmak için baştaki "the", "a", "an" gibi takıları siliyoruz.
    text = re.sub(r'^(the|a|an)\s+', '', text)
    
    # 5. Fazla boşlukları tek boşluğa indirip sağdan/soldan kırpıyoruz.
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

print("1. ADIM: Ham veri setleri yükleniyor...")
goodbooks = pd.read_csv("books.csv") 
gutenberg = pd.read_csv("gutenberg_catalog.csv") 
ratings = pd.read_csv("ratings.csv")

print(f"Orijinal Goodreads Kitap Sayısı: {len(goodbooks)}")
print(f"Orijinal Gutenberg Katalog Sayısı: {len(gutenberg)}")
print(f"Orijinal Toplam Oylama Sayısı: {len(ratings)}")

# OYLAMA KONTROLÜ 
missing_ratings = ratings[['user_id', 'book_id', 'rating']].isna().sum()
if missing_ratings.sum() > 0:
    print(f"DİKKAT: Oylama verisinde eksik satırlar bulundu:\n{missing_ratings[missing_ratings > 0]}")
    ratings = ratings.dropna(subset=['user_id', 'book_id', 'rating'])
    print("Eksik oylama satırları silindi.")
else:
    print("Oylama verisi (ratings) temiz. Eksik satır yok.")

# 2. Hatalı puan kontrolü 
invalid_ratings_mask = (ratings['rating'] < 1) | (ratings['rating'] > 5)
invalid_count = invalid_ratings_mask.sum()

if invalid_count > 0:
    print(f"DİKKAT: Veri setinde 1-5 aralığı dışında {invalid_count} adet hatalı puan tespit edildi ve temizleniyor...")
    ratings = ratings[~invalid_ratings_mask]
    print("Geçersiz puanlar veri setinden atıldı.")
else:
    print("Puan aralıkları kontrol edildi: Tüm oylar 1 ile 5 arasında, hatalı puan yok.")

min_rating = ratings['rating'].min()
max_rating = ratings['rating'].max()
print(f"Temizlenen Veride En Düşük Puan: {min_rating}")
print(f"Temizlenen Veride En Yüksek Puan: {max_rating}")
    

# GOODREADS KİTAP KONTROLÜ
missing_books = goodbooks[['book_id', 'title']].isna().sum()
if missing_books.sum() > 0:
    print(f"DİKKAT: Goodreads verisinde eksik satırlar bulundu:\n{missing_books[missing_books > 0]}")
    goodbooks = goodbooks.dropna(subset=['book_id', 'title'])
    print("Eksik Goodreads satırları silindi.")
else:
    print("Goodreads verisi temiz. Eksik book_id veya title yok.")

# GUTENBERG KONTROLÜ
missing_gutenberg = gutenberg[['Etext Number', 'Title']].isna().sum()
if missing_gutenberg.sum() > 0:
    print(f"DİKKAT: Gutenberg verisinde eksik satırlar bulundu:\n{missing_gutenberg[missing_gutenberg > 0]}")
    gutenberg = gutenberg.dropna(subset=['Etext Number', 'Title'])
    print("Eksik Gutenberg satırları silindi.")
else:
    print("Gutenberg verisi temiz. Eksik Etext Number veya Title yok.")

print("\n2. ADIM: Başlıklar normalize ediliyor...")
goodbooks["best_title"] = goodbooks["original_title"].fillna(goodbooks["title"])

goodbooks["match_title"] = goodbooks["best_title"].apply(normalize_title)
gutenberg["match_title"] = gutenberg["Title"].apply(normalize_title)

print("\n3. ADIM: Başlıklar üzerinden lokal eşleştirme yapılıyor (Inner Join)...")
merged_books = pd.merge(
    goodbooks, 
    gutenberg[['Etext Number', 'Subjects', 'match_title']], 
    on="match_title", 
    how="inner"
)

# Eşleşme için kullanılan geçici kolonları temizleme ve tipleri düzeltme
merged_books = merged_books.drop(columns=["match_title", "best_title"])
merged_books["Etext Number"] = merged_books["Etext Number"].astype(int)

merged_books = merged_books.rename(columns={
    'Etext Number': 'gutenberg_id', 
    'Subjects': 'subjects'
})

print("\n4. ADIM: Çoklu eşleşen tekrarlı kayıtlar veri setinden temizleniyor...")
merged_books = merged_books.drop_duplicates(subset=["book_id"], keep="first")
merged_books = merged_books.drop_duplicates(subset=["gutenberg_id"], keep="first")

print("\n5. ADIM: Oylama veri seti yeni kitap listesine göre senkronize ediliyor...")
valid_book_ids = set(merged_books["book_id"].dropna())
ratings_cleaned = ratings[ratings["book_id"].isin(valid_book_ids)]
ratings_cleaned = ratings_cleaned.drop_duplicates(subset=["user_id", "book_id"])

print("\n6. ADIM: Kalan veri üzerinden son kontroller yapılıyor...")
missing_subjects = merged_books['subjects'].isna().sum()
if missing_subjects > 0:
    print(f"DİKKAT: Kalan {len(merged_books)} kitabın {missing_subjects} tanesinin Subjects bilgisi boş!")
else:
    print("Tüm kitapların Subjects bilgisi dolu, eksik veri yok.")

unique_users = ratings_cleaned['user_id'].nunique()
print(f"Oy veren benzersiz kullanıcı sayısı: {unique_users}")

total_votes = len(ratings_cleaned)
print(f"719 kitap için sistemde kalan toplam oylama sayısı: {total_votes}")

print("\n7. ADIM: Optimize edilmiş ve temizlenmiş yeni veri setleri kaydediliyor...")
output_books_filename = "books_gutenberg_mapped.csv"
merged_books.to_csv(output_books_filename, index=False)

output_ratings_filename = "new_ratings.csv"
ratings_cleaned.to_csv(output_ratings_filename, index=False)

print("\n================ TAVSİYE SİSTEMİ VERİ HATTI HAZIR ================")
print(f"Yeni Kitap Veri Seti '{output_books_filename}' adıyla kaydedildi.")
print(f"Yeni Oylama Veri Seti '{output_ratings_filename}' adıyla üzerine yazıldı.")
print(f"Eşleşen Benzersiz Kitap Sayısı: {len(merged_books)}")
print(f"Canlı Kalan Toplam Oylama Sayısı: {len(ratings_cleaned)}")
print(f"Ayıklanan Boşa Çıkan Oy Sayısı: {len(ratings) - len(ratings_cleaned)}")
print("=================================================================")