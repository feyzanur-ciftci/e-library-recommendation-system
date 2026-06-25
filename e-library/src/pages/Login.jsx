import { useRef, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import api from "../api/axios";

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();

  const navigate = useNavigate();
  const { refreshMe } = useContext(UserContext);

  const [error, setError] = useState("");

  async function handleFormSubmit(e) {
    e.preventDefault();
    setError("");

    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    try {
      await api.post("/auth/login", { email, password });

      let me = await refreshMe();
      if (!me) {
        setError("Login failed");
        return;
      }

      navigate("/myShelf", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data;
      if (typeof msg === "string") setError(msg);
      else setError("Invalid email or password");
    }
  }

  return (
    <div className="container py-4">
      <h1>Login</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleFormSubmit}>
        <input
          ref={emailRef}
          className="form-control mb-2"
          placeholder="Email"
        />
        <input
          ref={passwordRef}
          type="password"
          className="form-control mb-2"
          placeholder="Password"
        />
        <button className="btn btn-dark w-100">Login</button>
      </form>
    </div>
  );
}
