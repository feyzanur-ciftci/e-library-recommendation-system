import { Link, NavLink, useNavigate } from "react-router-dom";
import SearchForm from "./SearchForm";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import "../index.css";

export default function Navbar() {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg bg-dark custom-navbar border-bottom border-body">
      <div className="container">
        <Link to="/" className="navbar-brand">
          E-Library App
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/books">
                Books
              </NavLink>
            </li>

            {user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/myShelf">
                    MyShelf
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/completed">
                    Completed
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/inProgress">
                    InProgress
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/toRead">
                    ToRead
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav ms-auto">
            {!user ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/register">
                    Register
                  </NavLink>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <button
                  onClick={() => {
                    logout();
                    navigate("/", { replace: true });
                  }}
                  className="btn btn-link nav-link"
                  style={{ cursor: "pointer" }}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>

          <SearchForm />
        </div>
      </div>
    </nav>
  );
}

