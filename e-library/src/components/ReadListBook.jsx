import { Link } from "react-router-dom";

export default function ReadListBook({ bookObj, removeFromReadList }) {
  return (
    <div className="col">
      {
        <div className="card book position-relative">
          <Link to={`/books/${bookObj.id}`}>
            <img
              src={
                bookObj?.formats?.["image/jpeg"] ||
                "https://via.placeholder.com/300x450?text=No+Cover"
              }
              alt={bookObj.title}
              className="img-fluid rounded"
            />
          </Link>

          <div>
            <button
              className="btn btn-link fs-5 text-danger position-absolute top-0 start-0"
              onClick={() => removeFromReadList(bookObj.id)}
            >
              <i className="bi bi-dash-circle"></i>
            </button>
          </div>
        </div>
      }
    </div>
  );
}
