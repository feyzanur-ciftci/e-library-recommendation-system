import { createContext, useCallback, useEffect, useState } from "react";
import api from "../api/axios";

export const UserContext = createContext();

export default function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [toRead, setToRead] = useState([]);
  const [readingProgress, setReadingProgress] = useState({});
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});

  const refreshMe = useCallback(async () => { 
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      setToRead(res.data.toRead || []);
      setReadingProgress(res.data.inProgress || {});
      setCompleted(res.data.completed || []);
      setRatings(res.data.ratings || {});
      return res.data;
    } catch (err) {
      if (err?.response?.status === 401) {
        setUser(null);
        setToRead([]);
        setReadingProgress({});
        setCompleted([]);
        setRatings({});
        return null;
      }
      console.error("refreshMe error:", err);
      setUser(null);
      setToRead([]);
      setReadingProgress({});
      setCompleted([]); 
      setRatings({});
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
    } finally {
      setUser(null);
      setToRead([]);
      setReadingProgress({});
      setCompleted([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshMe]);  

  const updateReadingProgress = useCallback(async (bookId, progress, title) => {
    const res = await api.post("/user/reading-progress", { bookId, progress, title });  
    setReadingProgress(res.data.inProgress);
    setToRead(res.data.toRead);
    setCompleted(res.data.completed);
  }, []);

  const rateBook = useCallback(async (bookId, rating, title) => {
    const res = await api.post("/user/rate", { bookId, rating, title }); 
    setRatings(res.data.ratings);
    setCompleted(res.data.completed);
  }, []);

  const fetchReadingProgress = useCallback(async (bookId) => {
    const res = await api.get(`/user/progress/${bookId}`);
    setReadingProgress((prev) => ({ ...prev, [String(bookId)]: res.data.progress }));
    return res.data.progress;
  }, []);

  const toggleToRead = useCallback(async (bookId) => {
    const res = await api.post("/user/toread", { bookId });
    setToRead(res.data);
  }, []);


  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        toRead,
        readingProgress,
        completed,
        rateBook,
        ratings,
        loading,
        refreshMe,
        updateReadingProgress,
        fetchReadingProgress,
        toggleToRead,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
