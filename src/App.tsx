import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

import FoodDiary from "./components/FoodDiary";

function App() {
  return (
    <div className="App">
      <Router>
          <Routes>
              <Route path="/food-diary" element={<FoodDiary />}/>
          </Routes>
        
      </Router>
    </div>
  );
}

export default App;
