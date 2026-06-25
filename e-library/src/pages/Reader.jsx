import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import api from "../api/axios";
import Loading from "../components/Loading";

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchReadingProgress, updateReadingProgress } = useContext(UserContext);

  const containerRef = useRef(null);   
  const lastSentProgress = useRef(0); 
  const saveTimer = useRef(null);

  const [content, setContent] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const res = await api.get(`/books/read/${id}`);  

        const raw = res.data || "";
        const normalized = raw
          .replace(/\r\n/g, "\n")
          .replace(/\n{2,}/g, "__PARA__")
          .replace(/\n/g, " ")
          .replace(/[ \t]{2,}/g, " ")
          .replace(/__PARA__/g, "\n\n")
          .trim();

        setContent(normalized);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load book.";
        setContent(msg);
      } finally {
        setLoading(false);
      }
    })();

  }, [id]);


  useEffect(() => {
    if (!content) return;

    (async () => {
      try {
        const res = await fetchReadingProgress(Number(id));  
        const saved = Math.max(0, Math.min(100, Number(res ?? 0)));

        setProgress(saved);
        lastSentProgress.current = saved;

        requestAnimationFrame(() => {
          const el = containerRef.current;  
          if (!el) return;
          const maxScroll = el.scrollHeight - el.clientHeight;  
          el.scrollTop = (saved / 100) * Math.max(0, maxScroll);
        });
      } catch (err) {
        console.error("Progress alınamadı:", err);
      }
    })();

  }, [id, content]);


  useEffect(() => { 
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    const percent = Math.round((el.scrollTop / maxScroll) * 100);  

    if (percent === lastSentProgress.current) return; 

    lastSentProgress.current = percent;
    setProgress(percent);

    clearTimeout(saveTimer.current);   
    saveTimer.current = setTimeout(() => {
      updateReadingProgress(Number(id), percent)
        .catch((err) => {
          console.error("Progress kaydedilemedi:", err);
        });
    }, 400);
  }

  if (loading) return <Loading />;


  return (
    <>
      <div
        style={{
          position: "sticky",
          top: 56,             
          zIndex: 10,
        }}
        className="bg-dark text-white p-2 d-flex justify-content-between"
      >
        <div>
          Reading Progress: <strong>%{progress}</strong>
        </div>

        <button className="btn btn-sm btn-outline-light" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: "calc(100vh - 56px - 48px)", 
          overflowY: "auto",
          overflowX: "hidden",
          background: "#f6f6f6",
          padding: "2rem 1rem",
        }}
      >
        <div
          style={{
            width: "100%",
            margin: 0,
            background: "#fff",
            padding: "2rem",
            borderRadius: 12,
            lineHeight: 1.75,
            fontSize: 18,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {content}
        </div>
      </div>
    </>
  );
}


        