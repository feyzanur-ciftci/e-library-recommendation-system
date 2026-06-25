import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import json

print("Item-Based eğitim başladı...")

ratings = pd.read_csv("new_ratings.csv")
books = pd.read_csv("books_gutenberg_mapped.csv")

# 1. ITEM-BASED MATRİS HAZIRLIĞI
user_u = list(np.sort(ratings['user_id'].unique()))
book_u = list(np.sort(ratings['book_id'].unique()))
row = ratings['book_id'].astype('category').cat.codes
col = ratings['user_id'].astype('category').cat.codes

data = np.array(ratings['rating'].tolist(), dtype=np.float32)

item_user_sparse = csr_matrix((data, (row, col)), shape=(len(book_u), len(user_u)))

print("Kosinüs matrisi hesaplanıyor...")
similarity_matrix = cosine_similarity(item_user_sparse, dense_output=False)

print("Sözlük oluşturuluyor...")
books_ids = np.array(book_u)
item_dict = {}

# Her kitap için en yüksek 50 benzerliği bulma
for i in range(similarity_matrix.shape[0]):
    row_arr = similarity_matrix.getrow(i).toarray()[0]

    top_indices = np.argsort(row_arr)[::-1][:51]

    b_id = books_ids[i]
    inner_dict = {}

    for idx in top_indices:
        if i == idx: 
            continue 
        
        score = float(row_arr[idx])
        if score > 0:  
            inner_dict[books_ids[idx]] = score

    item_dict[b_id] = inner_dict


with open("item_similarity_dict.pkl", "wb") as f: 
    pickle.dump(item_dict, f)

print("Eğitim başarıyla tamamlandı! 'item_similarity_dict.pkl' oluşturuldu.")



print("\nCold Start için IMDb Ağırlıklı Ortalama hesaplanıyor...")

# 1. Her kitabın ortalamasını (R) ve oy sayısı (v) 
book_stats = ratings.groupby('book_id').agg(
    vote_count=('rating', 'count'),
    vote_average=('rating', 'mean')
).reset_index()

# 2. C: Tüm veri setindeki genel oy ortalaması
C = ratings['rating'].mean()

# 3. m: Baraj (Sistemdeki kitapların en çok oy alan %10'luk dilimine girme şartı)
m = book_stats['vote_count'].quantile(0.90)

print(f"Genel Ortalama (C): {C:.2f}, Baraj Oy Sayısı (m): {m:.2f}")

# 4. Sadece barajı geçen kitapları filtrele
qualified_books = book_stats[book_stats['vote_count'] >= m].copy()

# 5. IMDb Ağırlıklı Puan Formülü
def weighted_rating(x, m=m, C=C):
    v = x['vote_count']
    R = x['vote_average']
    return (v / (v + m) * R) + (m / (m + v) * C)

qualified_books['weighted_score'] = qualified_books.apply(weighted_rating, axis=1)

top_cold_start_books = qualified_books.sort_values('weighted_score', ascending=False).head(20)

cold_start_final = pd.merge(top_cold_start_books, books[['book_id', 'title', 'gutenberg_id']], on='book_id', how='inner')

cold_start_list = []
for _, row in cold_start_final.iterrows():
    cold_start_list.append({
        "title": row['title'],
        "gutenberg_id": int(row['gutenberg_id']),
        "score": round(row['weighted_score'], 2)
    })


print("\n--- COLD START (SOĞUK BAŞLANGIÇ) İSTATİSTİKLERİ ---")
print(f"-> Uygulanan Oy Barajı (m): En az {int(m)} oy")
print(f"-> Baraj Öncesi Toplam Kitap Sayısı: {len(book_stats)}")
print(f"-> Barajı Geçip Listeye Girmeye Hak Kazanan Kitap Sayısı: {len(qualified_books)}")
print(f"-> Elenen (Yeterli oyu alamayan) Kitap Sayısı: {len(book_stats) - len(qualified_books)}")
print("---------------------------------------------------\n")

with open("cold_start_recommendations.json", "w", encoding="utf-8") as f:
    json.dump(cold_start_list, f, ensure_ascii=False, indent=4)

print("Cold Start kitapları 'cold_start_recommendations.json' olarak kaydedildi!")