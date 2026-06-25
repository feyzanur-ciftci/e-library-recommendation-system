import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import SimilarBooks from "./SimilarBooks";
import { UserContext } from "../contexts/UserContext";
import api from "../api/axios";

export default function BookDetails() {
  const { id } = useParams();  

  const {
    user,
    loading: userLoading,
    toRead,
    toggleToRead,
    rateBook,
    ratings,
  } = useContext(UserContext);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bookId = Number(id);
  const isToRead = (toRead || []).includes(bookId);

  const currentRating = ratings?.[String(bookId)] || 0;

  useEffect(() => {
    async function fetchBook() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/books/${id}`);  

        setBook(res.data);
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || "Hata";
        setError(msg);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    }
    fetchBook();
  }, [id]);

  async function handleToggleToRead() {
    if (userLoading) return;
    await toggleToRead(bookId);
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!book) return <ErrorMessage message="Books not found." />;

  return (
    <>
      <div className="book-details-hero text-white" style={{ minHeight: "100vh" }}>
        <div className="container d-flex align-items-center justify-content-center min-vh-100">
          <div className="row mt-5">
            <div className="col-md-3 d-none d-lg-flex flex-column align-items-center">
              <img
                src={
                  book?.formats?.["image/jpeg"] ||
                  "https://via.placeholder.com/300x450?text=No+Cover"
                }
                alt={book.title}
                className="img-fluid rounded shadow mb-3"
                style={{ maxWidth: "220px" }}
              />

              <Link to={`/reader/${book.id}`} className="btn btn-primary">
                Read Book
              </Link>

              {user && (
                <div className="mt-3 text-center">
                  <strong>Rate this book:</strong>
                  <div className="mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`btn btn-sm ms-1 ${
                          star <= currentRating ? "btn-warning" : "btn-outline-warning"
                        }`}
                        onClick={() => rateBook(bookId, star, book.title)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-9 text-dark"> 
              <h1 className="display-4 fw-bold">{book.title}</h1>
              <p className="text-muted fs-5">{book.authors?.map((a) => a.name).join(", ")}</p>
              <p>
                {user && (
                  <button
                    className={`btn ${isToRead ? "btn-danger" : "btn-outline-danger"}`}
                    onClick={handleToggleToRead}
                  >
                    {isToRead ? "Remove from To Read" : "Add to To Read"}
                  </button>
                )}
              </p>

              <div className="d-flex justify-content-between mt-4">
                <p>
                  <strong>Subject:</strong> {book.subjects?.[0] || "N/A"}
                </p>
                <p>
                  <strong>Bookshelf:</strong> {book.bookshelves?.[0] || "N/A"}
                </p>
              </div>

              {book.summaries && book.summaries.length > 0 && (
                <p className="lead mt-3">
                  <strong>Summaries:</strong> {String(book.summaries)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <SimilarBooks bookId={id} />
    </>
  );
}