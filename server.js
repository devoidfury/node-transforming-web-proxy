const http = require("http");
const serveFrontend = require("./serveFrontend");
const proxy = require("./proxy");
const { DOMAIN, PORT } = require("./config");

const server = http.createServer(function requestListener(req, res) {
  const host = req.headers.host || "";
  if (host.startsWith(DOMAIN) || !host.includes(DOMAIN)) {
    serveFrontend(req, res);
  } else {
    proxy(req, res).catch((err) => console.log(err));
  }
});

server.listen(PORT, () => {
  console.log(`running http://${DOMAIN}:${PORT}/`);
});
