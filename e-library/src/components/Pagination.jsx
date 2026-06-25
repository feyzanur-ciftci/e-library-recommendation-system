
export default function Pagination({
  page,
  setSearchParams,
  query,
}) {

  return (
    <div className="container py-3">
      <div className="border p-3">
        <div className="d-flex justify-content-between align-items-center">
          <button
            className={`btn btn-outline-dark`}
            onClick={() =>
              setSearchParams({ q: query, page: Number(page) - 1 })
            }
            disabled={page <= 1}
          >
            Geri
          </button>
          <div className="d-flex align-items-center">
            <span className="mx-2">
              Sayfa {page}
            </span>
          </div>
          <button
            className={`btn btn-outline-dark`}
            onClick={() =>
              setSearchParams({ q: query, page: Number(page) + 1 })
            }
          >
            İleri
          </button>
        </div>
      </div>
    </div>
  );
}
