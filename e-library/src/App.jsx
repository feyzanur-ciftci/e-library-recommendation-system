import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Books from "./pages/Books";
import BookDetails from "./pages/BookDetails";

import MyShelf from "./pages/MyShelf";
import Completed from "./pages/Completed";
import InProgress from "./pages/InProgress";
import ToRead from "./pages/ToRead";
import Reader from "./pages/Reader";

import Login from "./pages/Login";
import Register from "./pages/Register";
import SearchResults from "./pages/SearchResults";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "books", element: <Books /> },

      {
        path: "books/:id",
        element: (
          <BookDetails />
        ),
      },

      { path: "search", element: <SearchResults /> },

      {
        path: "myShelf",
        element: (
          <ProtectedRoute>
            <MyShelf />
          </ProtectedRoute>
        ),
      },

      {
        path: "completed",
        element: (
          <ProtectedRoute>
            <Completed />
          </ProtectedRoute>
        ),
      },

      {
        path: "inProgress",
        element: (
          <ProtectedRoute>
            <InProgress />
          </ProtectedRoute>
        ),
      },

      {
        path: "toRead",
        element: (
          <ProtectedRoute>
            <ToRead />
          </ProtectedRoute>
        ),
      },

      {
        path: "reader/:id",
        element: (
          <ProtectedRoute>
            <Reader />
          </ProtectedRoute>
        ),
      },

      {
        path: "login",
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },

      {
        path: "register",
        element: (
          <PublicRoute>
            <Register />
          </PublicRoute>
        ),
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={routes} />;
}

export default App;
