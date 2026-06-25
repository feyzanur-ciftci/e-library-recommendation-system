import React from "react";
import SearchForm from "../components/SearchForm";
import Books from "./Books";

const Home = () => {
  return (
    <>
      <div id="home">
        <div className="img-overlay">
          <div className="container pt-5">
            <div className="row">
              <div className="col-12 col-lg-7 mx-auto text-center text-white">
                <h1 className="display-2">Welcome!</h1>
                <p className="lead">
                  With the e-library app, you can explore thousands of books and save your favorites to your reading list
                </p>
                <SearchForm />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Books />
    </>
  );
};

export default Home;
