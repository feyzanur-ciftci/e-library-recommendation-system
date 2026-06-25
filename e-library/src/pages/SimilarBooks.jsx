import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import BookList from "../components/BookList";

const SimilarBooks = ({ bookId }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getBooks() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`http://localhost:5001/recommend-item?gutenberg_id=${bookId}`);
        if (!res.ok) throw new Error("Öneriler alınamadı");

        const data = await res.json();
        const recs = Array.isArray(data?.recommendations) ? data.recommendations : [];

        const formattedBooks = recs.map((rec) => ({
          id: rec.gutenberg_id,
          title: rec.title || "Başlıksız",
          formats: {
            "image/jpeg": `https://www.gutenberg.org/cache/epub/${rec.gutenberg_id}/pg${rec.gutenberg_id}.cover.medium.jpg`,
          },
        }));

        setBooks(formattedBooks);
      } catch (err) {
        setError(err.message || "Bir hata oluştu");
      } finally {
        setLoading(false);
      }
    }
    getBooks();
  }, [bookId]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!books.length) return <p className="text-muted">Similar books not found.</p>;

  return <BookList books={books} title="Readers who rated this book also liked" />;
};

export default SimilarBooks;