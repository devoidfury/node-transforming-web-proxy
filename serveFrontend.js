module.exports = async function serveFrontend(req, res) {
  res.writeHead(200);
  res.end("Hello, World!");
};
