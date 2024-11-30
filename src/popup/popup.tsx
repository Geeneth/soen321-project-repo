import React from "react";
import ReactDOM from "react-dom";
import "./popup.css";
import OpenAI from "openai";

const App: React.FC<{}> = () => {
  const [privacyLinkFound, setPrivacyLinkFound] = React.useState<boolean>(true);
  const [privacyLink, setPrivacyLink] = React.useState<string | null>(null);
  const [privacySummary, setPrivacySummary] = React.useState<string | null>(
    null
  );
  const [loader, setLoader] = React.useState<boolean>(false);
  const [ratings, setRatings] = React.useState<object>(null);

  React.useEffect(() => {
    //will use variables to render the loader and error message
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === "privacyPolicyFound") {
        setPrivacyLink(request.link);
        setPrivacyLinkFound(true);
      } else if (request.action === "privacyPolicyNotFound") {
        setPrivacyLink(null);
        setPrivacyLinkFound(false);
        setLoader(false);
      }
    });

    chrome.runtime.onMessage.addListener(async (request) => {
      if (request.action === "privacyPolicyHTMLFound") {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          dangerouslyAllowBrowser: true,
        });

        try {
          const thread = await openai.beta.threads.create();

          //adds message to thread
          await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: extractTextFromHTML(request.html).slice(0, 256000),
          });

          //starts the run
          const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: "asst_ptaXX8ZSmcLuofSNkS4SAbl4",
          });

          //poll for completion
          let runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );

          while (runStatus.status !== "completed") {
            console.log("Current status:", runStatus.status);

            if (runStatus.status === "failed") {
              throw new Error(`Run failed: ${runStatus.last_error?.message}`);
            }

            //waits 1 second before next check
            await new Promise((resolve) => setTimeout(resolve, 1000));

            runStatus = await openai.beta.threads.runs.retrieve(
              thread.id,
              run.id
            );
          }

          console.log("Run completed");

          const messages = await openai.beta.threads.messages.list(thread.id);
          console.log(messages.data[0].content[0]);

          //to parse the ratings for each category
          if (messages.data[0].content[0].type === "text") {
            const categories = [
              "Data Collection",
              "Data Usage",
              "Data Sharing",
              "Data Selling",
              "Opt-Out Options",
              "Data Security",
              "Data Deletion",
              "Policy Clarity",
            ];

            const scores = {};

            //extract scores for each category
            const text = messages.data[0].content[0].text.value.toString();
            categories.forEach((category) => {
              console.log(category);
              const regex = new RegExp(`${category}:\\s*(\\d+)`);
              const match = text.match(regex);
              if (match) {
                console.log("matched");
                scores[category] = parseInt(match[1]);
              }
            });

            let formattedOutput = categories
              .map((category) => `${category}: ${scores[category] || "N/A"}`)
              .join("\n");

            setPrivacySummary(text);
            setRatings(scores);
            setLoader(false);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    });
  }, []);

  const handleButtonClick = () => {
    setLoader(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "findPrivacyPolicy" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error sending message:",
                chrome.runtime.lastError.message
              );
            }
          }
        );
      }
    });
  };

  //to remove unncessary content and reduce the load on AI API call
  function extractTextFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const text = doc.body.textContent || "";
    return text.trim();
  }

  return (
    <div className="container">
      <div className="logo-container">
        <img src="PrivacyBriefLogo.png" alt="Logo" className="logo" />
        <span className="logo-text">PrivacyBrief</span>
      </div>
      <p className="description">
        Summarizes the privacy policy on the website.
      </p>
      <button className="button-29 button-29-v1" onClick={handleButtonClick}>
        Summarize
      </button>
      {privacyLink ? (
        <a href={privacyLink} target="_blank" rel="noopener noreferrer">
          <button className="button-29 button-29-v2">
            Privacy Policy Page
          </button>
        </a>
      ) : (
        <div></div>
      )}

      {!privacyLinkFound ? (
        <p className="description">Could not find Privacy Policy</p>
      ) : (
        <></>
      )}

      {loader ? <p className="description">Loading...</p> : <></>}

      {ratings && (
        <div className="description ratings-container fade-in">
          {Object.entries(ratings).map(([category, score]) => {
            const getColorClass = (score) => {
              switch (score) {
                case 1:
                  return "red";
                case 2:
                  return "orange";
                case 3:
                  return "yellow";
                case 4:
                  return "light-green";
                case 5:
                  return "green";
                default:
                  return "";
              }
            };

            return (
              <div
                key={category}
                className={`rating-item ${getColorClass(score)}`}
              >
                <strong>{category}:</strong>{" "}
                <span className={`rating-score ${getColorClass(score)}`}>
                  {score !== undefined ? score + "/5" : "N/A"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {privacySummary ? (
        <p className="fade-in">{privacySummary}</p>
      ) : (
        <div></div>
      )}

      <br></br>
    </div>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.render(<App />, root);
