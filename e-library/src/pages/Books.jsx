import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import BookList from "../components/BookList.jsx";
import { useSearchParams } from "react-router-dom";
import Pagination from "../components/Pagination.jsx";
import api from "../api/axios";

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q");
  const page = Number(searchParams.get("page") || 1);

  useEffect(() => {
    async function getBooks() {
      setLoading(true);
      try {
        const response = await api.get("/books/popular", { params: { page } });
        
        const data = response.data;
        setBooks(data.results || []);
        setError("");
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || "Hata";
        setError(msg);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    }

    getBooks();
  }, [page]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <>
      <BookList books={books} title="Popular Books" />
      <Pagination page={page} setSearchParams={setSearchParams} query={query} />
    </>
  );
};

export default Books;
