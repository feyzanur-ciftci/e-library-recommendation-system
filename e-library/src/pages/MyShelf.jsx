import { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/UserContext";

export default function Dashboard() {
  const { user, toRead, readingProgress, completed, loading } = useContext(UserContext);

  const totalReading = Object.keys(readingProgress || {}).length;

  if (loading) {
    return <div className="container py-4">Loading...</div>;
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Welcome {user?.name || "Reader"}</h1>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h5>Completed</h5>
              <h2>{completed?.length || 0}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h5>In Progress</h5>
              <h2>{totalReading}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card text-center shadow-sm">
            <div className="card-body">
              <h5>ToRead</h5>
              <h2>{toRead?.length || 0}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
