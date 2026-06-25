export default function Footer() {
  return (
    <footer
      className={`bg-dark text-center text-light border-top border-body`}
    >
      <div className="container p-4">
        <section className="mb-4">
          <a
            className={`btn btn-outline-light btn-floating m-1`}
            href="#!"
            role="button"
          >
            <i className="bi bi-facebook"></i>
          </a>
          <a
            className={`btn btn-outline-light btn-floating m-1`}
            href="#!"
            role="button"
          >
            <i className="bi bi-twitter"></i>
          </a>
          <a
            className={`btn btn-outline-light btn-floating m-1`}
            href="#!"
            role="button"
          >
            <i className="bi bi-google"></i>
          </a>
          <a
            className={`btn btn-outline-light btn-floating m-1`}
            href="#!"
            role="button"
          >
            <i className="bi bi-instagram"></i>
          </a>
        </section>
      </div>

      <div className="text-center p-3">
        © 2026 Copyright:
        <a className={`text-light`} href="#!">
          Book App
        </a>
      </div>
    </footer>
  );
}