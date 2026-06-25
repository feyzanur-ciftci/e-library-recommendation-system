import { Link } from "react-router-dom";

export default function Book({ bookObj }) {
  return (
    <div className="col">
      <div className="card book position-relative h-100">
        <Link to={`/books/${bookObj.id}`}>
          <img
            src={
              bookObj?.formats?.["image/jpeg"] || "https://via.placeholder.com/300x450?text=No+Cover"
            }
            alt={bookObj.title}
            className="card-img-top"
          />
        </Link>

        <div className="card-body">
          <h2 className="h6 card-title">{bookObj.title}</h2>
        </div>
      </div>
    </div>
  );
}
