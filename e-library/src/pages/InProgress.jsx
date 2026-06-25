import { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import Loading from "../components/Loading";
import { Link } from "react-router-dom";
import api from "../api/axios";

const Reading = () => {
  const { readingProgress } = useContext(UserContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readingProgress) return;

    async function loadBooks() {
      setLoading(true);
      const ids = Object.entries(readingProgress)
        .filter(([_, progress]) => progress > 0 && progress < 100)
        .map(([id]) => id);

      if (ids.length === 0) {
        setBooks([]);
        setLoading(false);
        return;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await api.get(`/books/${id}`); 
            return res.data;
          } catch {
            return null;
          }
        })
      );

      setBooks(results.filter(Boolean));
      setLoading(false);
    }

    loadBooks();
  }, [readingProgress]);

  if (loading) return <Loading />;

  if (books.length === 0) {
    return <p>There are no books in progress</p>;
  }

  return (
    <div className="container mt-4">
      <h2>Books in Progress</h2>

      <div className="row">
        {books.map((book) => (
          <div className="col-md-3 mb-3" key={book.id}>
            <div className="card h-100">
              <img src={book.formats["image/jpeg"]} className="card-img-top" />
              <div className="card-body">
                <h6>{book.title}</h6>
                <p>%{readingProgress[String(book.id)]} read</p>
                <Link
                  to={`/books/${book.id}`}
                  className="btn btn-sm btn-outline-primary"
                >
                  Continue Reading
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reading;