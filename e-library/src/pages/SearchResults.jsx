import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import BookList from "../components/BookList";
import { useSearchParams } from "react-router-dom";
import Pagination from "../components/Pagination.jsx";

const apiUrl = "https://gutendex.com/books/";

const SearchResults = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q");
  const page = searchParams.get("page") || 1;

  useEffect(() => {
    async function getBooks() {
      setLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}?search=${encodeURIComponent(query)}&page=${page}`
        );

        if (!response.ok) {
          throw new Error("Failed to search books");
        }

        const data = await response.json();
         
        if (!data.results || data.results.length === 0) {
          setBooks([]);
          setError("No books found matching your search criteria.");
        } else {
          setBooks(data.results);
          setError("");
        }
      } catch (error) {
        setError(error.message);
      }

      setLoading(false);
    }

    getBooks();
  }, [searchParams]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <>
      <BookList books={books} title={`Search Results: ${query}`} />
      <Pagination
        page={page}
        setSearchParams={setSearchParams}
        query={query}
      />
    </>
  );
};

export default SearchResults;