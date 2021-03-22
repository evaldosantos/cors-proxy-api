const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

const BASE_URL = process.env.BASE_URL;
const PROXY_URL = process.env.PROXY_URL;

const parse = (response) => {
  let { next, previous } = response;

  if (next && next.includes(PROXY_URL)) {
    next = next.replace(PROXY_URL, BASE_URL);
  }

  if (previous && previous.includes(PROXY_URL)) {
    previous = previous.replace(PROXY_URL, BASE_URL);
  }

  return {
    ...response,
    next,
    previous,
  };
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

app.all("*", (req, res) => {
  const { method, body } = req;
  let config = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (method === "POST") {
    config = { ...config, body: JSON.stringify(body) };
  }

  fetch(`${PROXY_URL}${req.originalUrl}/`, config)
    .then((response) => {
      if (response.ok) {
        return response;
      }
      throw "Response Error?";
    })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
      }

      throw "Content type error?";
    })
    .then((response) => {
      console.log(response);
      return res.json(parse(response));
    })
    .catch((err) => {
      return res.status(500).json({ type: "error", message: err.message });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
