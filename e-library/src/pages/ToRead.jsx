import { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import ReadList from "../components/ReadList";
import api from "../api/axios";

export default function ToRead() {
  const { toRead, toggleToRead } = useContext(UserContext);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    async function load() {
      if (!toRead?.length) {
        setBooks([]);
        return;
      }

      try {
        const responses = await Promise.allSettled( 
          toRead.map((id) => api.get(`/books/${id}`))
        );

        const okBooks = responses
          .filter((r) => r.status === "fulfilled")  
          .map((r) => r.value.data);

        setBooks(okBooks);
      } catch {
        setBooks([]);
      }
    }
    load();
  }, [toRead]);

  return (
    <ReadList
      books={books}
      removeFromReadList={toggleToRead}
    />
  );
}
