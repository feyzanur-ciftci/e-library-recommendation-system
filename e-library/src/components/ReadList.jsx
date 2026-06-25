import ReadListBook from "./ReadListBook";

export default function ReadList({ books, removeFromReadList }) {
  if (!Array.isArray(books) || books.length === 0) {
    return (
      <div className="container py-3">
        <p>There are no books yet</p>
      </div>
    );
  }

  return (
    <>
      {
        <div className="container py-3">
          <div
            id="book-list"
            className="row row-cols-3 row-cols-md-4 row-cols-lg-6 g-1 g-lg-3"
          >
            {books.map((book, index) => (
              <ReadListBook
                key={index}
                bookObj={book}
                removeFromReadList={removeFromReadList}
              />
            ))}
          </div>
        </div>
      }
    </>
  );
}
