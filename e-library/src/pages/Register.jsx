import { useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { UserContext } from "../contexts/UserContext";

export default function Register() {
  const name = useRef();  
  const email = useRef();
  const password = useRef();
  const navigate = useNavigate();   
  const { refreshMe } = useContext(UserContext);

  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const nameVal = name.current.value;
    const emailVal = email.current.value;
    const passwordVal = password.current.value;

    if (
      nameVal.trim().length < 2 ||
      !emailVal.includes("@") ||
      passwordVal.length < 6
    ) {
      setError("Please check your information");
      return;
    }

    try {
      await api.post("/auth/register", {
        name: nameVal,
        email: emailVal,
        password: passwordVal,
      });

      const me = await refreshMe();
      if (!me) {
        setError("Registration successful but failed to log in.");
        return;
      }
        navigate("/myShelf", { replace: true });
    }  
    catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data;

      if (typeof msg === "string") {
        setError(msg);
      } else {
        setError("Failed to register");
      }
    }
  }
  

  return (
    <div className="container py-4">
      <h1>Register</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input ref={name} className="form-control mb-2" placeholder="Name" />
        <input ref={email} className="form-control mb-2" placeholder="Email" />
        <input
          ref={password}
          type="password"
          className="form-control mb-2"
          placeholder="Password"
        />
        <button className="btn btn-dark w-100">Register</button>
      </form>
    </div>
  );
}
