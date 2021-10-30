const { DOMAIN, EXTERNAL_PORT, SECURE } = require("./config");

module.exports = function transformUrl(value) {
  const url = new URL(value, "http" + (SECURE ? "s:" : "") + "://" + DOMAIN);
  if (url.hostname !== DOMAIN) {
    url.hostname = url.hostname + "." + DOMAIN;
  }
  url.port = EXTERNAL_PORT;
  url.protocol = SECURE ? "https:" : "http:";
  return url.toString();
};
