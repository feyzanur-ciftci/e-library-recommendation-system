import numpy as np
import pandas as pd
import pickle
import json
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import random

app = Flask(__name__)
CORS(app)

print("Veri setleri ve lokal indeksler yükleniyor...")

# Temel Veri Setlerinin Yüklenmesi
books = pd.read_csv("books_gutenberg_mapped.csv")
ratings = pd.read_csv("new_ratings.csv")

# Sözlük Dönüşümleri
gutenberg_to_goodbooks = books.set_index("gutenberg_id")["book_id"].to_dict()
goodbooks_to_gutenberg = books.set_index("book_id")["gutenberg_id"].to_dict()
books_dict = books.set_index("gutenberg_id")["title"].to_dict()


# (BINARY) CONTENT-BASED HAZIRLIĞI
# print("Content-Based için Binary (1/0) Kitap-Tür matrisi hesaplanıyor...")
vectorizer = CountVectorizer(stop_words="english", binary=True)
binary_item_matrix = vectorizer.fit_transform(books["subjects"])

print("Matris boyutu:", binary_item_matrix.shape)


# Kitap ID'lerinin matris satır indeks eslesmeleri
book_id_to_matrix_idx = {book_id: idx for idx, book_id in enumerate(books["book_id"].values)}
matrix_idx_to_book_id = {idx: book_id for idx, book_id in enumerate(books["book_id"].values)}


# USER-BASED HAZIRLIĞI
user_ratings_matrix = ratings.groupby("user_id").apply(lambda x: dict(zip(x["book_id"], x["rating"]))).to_dict()
book_users_matrix = ratings.groupby("book_id")["user_id"].apply(list).to_dict()


# COLD START YÜKLEME
cold_start_list = []
if os.path.exists("cold_start_recommendations.json"):
    with open("cold_start_recommendations.json", "r", encoding="utf-8") as f:
        cold_start_list = json.load(f)
else:
    print("UYARI: cold_start_recommendations.json bulunamadı! Lütfen önce train.py dosyasını çalıştırın.")

print("Sistem kararlı ve tamamen hazır!")

# COLD START ENDPOINT
@app.route("/cold-start", methods=["GET"])
def cold_start():
    return jsonify({"recommendations": cold_start_list})


# ITEM-BASED İÇİN MODEL YÜKLEME
with open("item_similarity_dict.pkl", "rb") as f:
    item_similarity_dict = pickle.load(f)

print("Sistem kararlı ve tamamen hazır!")



# 1. ITEM-BASED ENDPOINT (Kitap Detay Sayfası) 
@app.route("/recommend-item", methods=["GET"])
def recommend_item():
    try:
        gutenberg_id = request.args.get("gutenberg_id")
        if not gutenberg_id: 
            return jsonify({"error": "gutenberg_id gerekli"}), 400

        g_id_int = int(gutenberg_id)
        b_id = gutenberg_to_goodbooks.get(g_id_int)
        
        item_scores = {}
        if b_id is not None:
            item_scores = item_similarity_dict.get(b_id, {})

        valid_item_scores = {k: v for k, v in item_scores.items() if v > 0}

        # KURTARMA: SADECE YAZARIN DİĞER KİTAPLARI
        if not valid_item_scores:
            target_book = books[books["gutenberg_id"] == g_id_int]
            
            if not target_book.empty:
                author_name = target_book.iloc[0]["authors"]
                
                if pd.notna(author_name) and author_name != "":
                    author_books = books[(books["authors"] == author_name) & (books["gutenberg_id"] != g_id_int)]
                    
                    if not author_books.empty:
                        fallback_books = []
                        for _, row in author_books.head(5).iterrows():
                            fallback_books.append({
                                "title": row["title"],
                                "gutenberg_id": int(row["gutenberg_id"])
                            })
                        return jsonify({"recommendations": fallback_books})

        
            fallback_list = random.sample(cold_start_list, min(5, len(cold_start_list)))

            return jsonify({"recommendations": fallback_list})


        sorted_similar = sorted(valid_item_scores.items(), key=lambda x: x[1], reverse=True)
        
        final = []
        for b_id_res, score in sorted_similar:
            if b_id_res == b_id: continue
            g_id_res = goodbooks_to_gutenberg.get(b_id_res)
            if g_id_res and g_id_res in books_dict:
                final.append({
                    "title": books_dict[g_id_res],
                    "gutenberg_id": int(g_id_res)
                })
            if len(final) == 5:
                break
                
        return jsonify({"recommendations": final})
    except Exception as e:
        print("ITEM BASED ERROR:", e)
        return jsonify({"recommendations": []})



# 2. USER-BASED ENDPOINT
@app.route("/user-based", methods=["POST"])  
def user_based():
    try:
        data = request.get_json()  
        user_ratings = data.get("ratings", [])  
        if not user_ratings: 
            return jsonify({"recommendations": []})

        target_user = {}
        for r in user_ratings:
            gid = r.get("gutenberg_id")
            rating = r.get("rating")
            if gid is not None and rating is not None:
                b_id = gutenberg_to_goodbooks.get(int(float(gid)))
                if b_id is not None: 
                    target_user[b_id] = float(rating)

        if not target_user: 
            return jsonify({"recommendations": []})

        candidate_users = set()
        for b_id in target_user.keys():
            if b_id in book_users_matrix:
                candidate_users.update(book_users_matrix[b_id])

        user_similarities = []
        for other_user_id in candidate_users:
            other_user_ratings = user_ratings_matrix.get(other_user_id, {})
            shared_books = list(set(target_user.keys()) & set(other_user_ratings.keys()))
            if not shared_books: continue

            v1 = np.array([target_user[b] for b in shared_books])
            v2 = np.array([other_user_ratings[b] for b in shared_books])

            norm_v1 = np.linalg.norm(v1)
            norm_v2 = np.linalg.norm(v2)

            if norm_v1 > 0 and norm_v2 > 0:
                sim = np.dot(v1, v2) / (norm_v1 * norm_v2)
                if sim > 0:
                    user_similarities.append((other_user_id, sim))

        user_similarities.sort(key=lambda x: x[1], reverse=True)
        top_neighbors = user_similarities[:30]

        if not top_neighbors: 
            return jsonify({"recommendations": []})

        book_predictions = {}
        book_sim_sums = {}

        for neighbor_id, sim in top_neighbors:
            neighbor_ratings = user_ratings_matrix.get(neighbor_id, {})
            for b_id, rating in neighbor_ratings.items():
                if b_id in target_user: continue 
                
                if b_id not in book_predictions:
                    book_predictions[b_id] = 0
                    book_sim_sums[b_id] = 0
                
                book_predictions[b_id] += sim * rating
                book_sim_sums[b_id] += sim

        final_books = []
        for b_id, total_score in book_predictions.items():
            sim_sum = book_sim_sums[b_id]
            if sim_sum > 0:
                final_books.append((b_id, total_score / sim_sum))

        final_books.sort(key=lambda x: x[1], reverse=True)

        recommendations = []
        for b_id, score in final_books:
            g_id = goodbooks_to_gutenberg.get(b_id)
            if g_id and g_id in books_dict:
                recommendations.append({
                    "title": books_dict[g_id],
                    "gutenberg_id": int(g_id)
                })
            if len(recommendations) == 5: 
                break

        return jsonify({"recommendations": recommendations})
    except Exception as e:
        print("USER BASED ERROR:", e)
        return jsonify({"recommendations": []})


# 3. CONTENT-BASED ENDPOINT
@app.route("/content-based", methods=["POST"])  
def content_based():
    try:
        data = request.get_json()  
        user_ratings = data.get("ratings", [])  
        if not user_ratings: 
            return jsonify({"recommendations": []})

        target_user = {}
        for r in user_ratings:
            gid = r.get("gutenberg_id")
            rating = r.get("rating")
            if gid is not None and rating is not None:
                b_id = gutenberg_to_goodbooks.get(int(float(gid)))
                if b_id is not None: 
                    target_user[b_id] = float(rating)

        if not target_user: 
            return jsonify({"recommendations": []})

        # 1. Kullanıcı Profil Vektörü Oluşturma (Binary Özellik Sayısı kadar)
        user_profile_vector = np.zeros(binary_item_matrix.shape[1])

        for b_id, rating in target_user.items():
            if b_id in book_id_to_matrix_idx:
                matrix_row_idx = book_id_to_matrix_idx[b_id]
                book_vector = binary_item_matrix[matrix_row_idx].toarray()[0]
                user_profile_vector += book_vector * rating

        if np.all(user_profile_vector == 0):
            return jsonify({"recommendations": []})

        calculated_scores = binary_item_matrix.dot(user_profile_vector)

        scored_books = []
        for idx, score in enumerate(calculated_scores):
            b_id = matrix_idx_to_book_id[idx]
            if b_id in target_user: 
                continue  
            scored_books.append((b_id, score))

        scored_books.sort(key=lambda x: x[1], reverse=True)

        final = []
        for b_id, score in scored_books:
            if score <= 0: 
                break  
            g_id = goodbooks_to_gutenberg.get(b_id)
            if g_id and g_id in books_dict:
                final.append({
                    "title": books_dict[g_id], 
                    "gutenberg_id": int(g_id)
                })
            if len(final) == 5:
                break

        return jsonify({"recommendations": final})
    except Exception as e:
        print("CONTENT BASED ERROR:", e)
        return jsonify({"recommendations": []})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, threaded=True)

