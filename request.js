const https = require("https");

module.exports = function request(options) {
  return new Promise(function (resolve, reject) {
    let res;
    const req = https.request(options, function (response) {
      res = response;
      let parts = [];
      res.on("data", function (chunk) {
        parts.push(chunk);
      });
      res.on("end", function () {
        const body = parts.length === 0 ? "" : Buffer.concat(parts);
        resolve({ req, res, body });
      });
    });

    req.on("error", function (error) {
      console.error(error);
      reject({ req, res, error });
    });

    req.end();
  });
};
