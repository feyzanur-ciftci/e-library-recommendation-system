import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import Loading from "../components/Loading";
import api from "../api/axios";

export default function Library() {
  const { completed } = useContext(UserContext);
  const [userBasedRecs, setUserBasedRecs] = useState([]);
  const [contentBasedRecs, setContentBasedRecs] = useState([]);
  const [coldStartRecs, setColdStartRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        // EĞER KULLANICININ HİÇ BİTİRDİĞİ KİTAP YOKSA COLD START ÇALIŞTIR
        const hasNoBooks = !completed || completed.length === 0;
        if (hasNoBooks) {
          setUserBasedRecs([]);
          setContentBasedRecs([]);
          const coldRes = await api.get("/user/cold-start");
          setColdStartRecs(coldRes.data.recommendations || []);
        } 
        // EĞER KULLANICI EN AZ 1 KİTAP OKUDUYSA ÖNERİLERİ ÇALIŞTIR
        else {
          setColdStartRecs([]);
          const [userRes, contentRes] = await Promise.all([
            api.get("/user/user-based"),
            api.get("/user/content-based")
          ]);
          setUserBasedRecs(userRes.data.recommendations || []);
          setContentBasedRecs(contentRes.data.recommendations || []);
        }
      } catch (err) {
        console.error("Tavsiyeler alınırken hata oluştu:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [completed]); 

  const hasNoCompletedBooks = !completed || completed.length === 0;

  const renderGrid = (books) => (
    <div className="row">
      {books.map((book, i) => {
        const gid = book.gutenberg_id;
        const recCover = `https://www.gutenberg.org/cache/epub/${gid}/pg${gid}.cover.medium.jpg`;
        return (
          <div key={i} className="col-6 col-md-4 col-lg-3 mb-4">
            <div className="card h-100 shadow-sm text-center p-2">
              <img
                src={recCover}
                className="card-img-top mx-auto rounded"
                alt={book.title}
                style={{ maxHeight: "200px", objectFit: "contain", maxWidth: "100%" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150x225?text=No+Cover";
                }}
              />
              <div className="card-body d-flex flex-column justify-content-between p-2 mt-2">
                <h6 className="card-title text-truncate-2" style={{ fontSize: "0.9rem", minHeight: "2.7rem" }}>
                  {book.title}
                </h6>
                <Link to={`/books/${gid}`} className="btn btn-sm btn-primary w-100 mt-2">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container py-4">
      <h1 className="mb-4">Completed Books</h1>

      {hasNoCompletedBooks && (
        <div className="alert alert-info">
          You haven't completed any books yet.
        </div>
      )}

      {!hasNoCompletedBooks && (
        <div className="row row-cols-1 row-cols-md-2 g-3 mb-5">
          {completed && completed.map((item) => {
            const id = item.bookId;
            const title = item.title;
            const coverImg = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.small.jpg`;

            return (
              <div key={id} className="col">
                <div className="card h-100 shadow-sm d-flex flex-row align-items-center p-2">
                  <img
                    src={coverImg}
                    alt={title}
                    style={{ width: "50px", height: "75px", objectFit: "cover" }}
                    className="rounded me-3"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/50x75?text=No+Cover";
                    }}
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-1">
                      <Link to={`/books/${id}`} className="text-decoration-none text-dark fw-bold">
                        {title}
                      </Link>
                    </h6>
                    <span className="badge bg-success">Completed</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COLD START EKRANI - Sadece yeni kullanıcılara görünür */}
      {loading ? <Loading /> : (
        <>
      {(!completed || completed.length === 0) && coldStartRecs.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-3 text-warning">Great Classics to Start With</h3>
          {renderGrid(coldStartRecs)}
        </div>
      )}

      {/* USER BASED EKRANI - Oyu olanlara görünür */}
      {userBasedRecs.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-3 text-primary">Users with similar tastes to yours have read these.</h3>
          {renderGrid(userBasedRecs)}
        </div>
      )}

      {/* CONTENT BASED EKRANI - Oyu olanlara görünür */}
      {contentBasedRecs.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-3 text-success">Recommendations similar to the types of books you've read.</h3>
          {renderGrid(contentBasedRecs)}
        </div>
      )}
      </>
      )}
    </div>
  );
}