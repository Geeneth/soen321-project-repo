import React from "react";
import ReactDOM from "react-dom";
import "./options.css";

const App: React.FC<{}> = () => {
  return (
    <div>
      <img src="PrivacyBriefLogo.png" />
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.render(<App />, root);
