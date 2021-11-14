const request = require("./lib/request");
const { DOMAIN, DEBUG } = require("./config");
const transformUrl = require("./lib/transformUrl");

const IGNORE_HEADER = () => {};
const HEADER_TRANSFORMS = {
  location: transformUrl,
  connection: IGNORE_HEADER,
  "report-to": IGNORE_HEADER,
  "strict-transport-security": IGNORE_HEADER,
  "content-length": IGNORE_HEADER,
  "content-security-policy": IGNORE_HEADER,
};

function copyHeaders(from, to) {
  for (const key in from.headers) {
    if (HEADER_TRANSFORMS[key]) {
      const value = HEADER_TRANSFORMS[key](from.headers[key]);
      if (value) to.setHeader(key, value);
    } else {
      to.setHeader(key, from.headers[key]);
    }
  }
}

const FORWARD_HEADER_TRANSFORMS = {
  host: IGNORE_HEADER,
  connection: IGNORE_HEADER,
  referer: IGNORE_HEADER,
  "accept-encoding": IGNORE_HEADER,
};

function forwardHeaders(from) {
  const headers = {};
  for (const key in from.headers) {
    if (FORWARD_HEADER_TRANSFORMS[key]) {
      const value = FORWARD_HEADER_TRANSFORMS[key](from.headers[key]);
      if (value) headers[key] = value;
    } else {
      headers[key] = from.headers[key];
    }
  }
  return headers;
}

function transform(body, contentType) {
  if (!contentType) return body;

  if (
    contentType.includes("text/") ||
    contentType.includes("application/javascript")
  ) {
    return body
      .toString()
      .replace(
        /((?:https?:|s?ftp:)?\/\/[^\]\/%'"\)\(, ]+\.[^\]\/%'"\)\(, ]+)([\]\/%'"\)\(, ])/gi,
        function (match, originalUrl, suffix) {
          const url = transformUrl(originalUrl).slice(0, -1);
          DEBUG && console.log(`  > ${originalUrl}\n  < ${url}\n`);
          return url + suffix;
        }
      );
  }

  DEBUG && console.log(`unknown content type: ${contentType}`);
  return body;
}

let nextId = 0;

module.exports = async function proxy(req, res) {
  // wikipedia.org.loop.furycodes.com:9005
  const host = req.headers.host || "";
  const prefix = host.substring(0, host.indexOf(DOMAIN) - 1);
  const requestId = nextId++;

  const options = {
    host: prefix,
    path: req.url,
  };

  DEBUG && console.log(`[request ${requestId}] ${JSON.stringify(options)}`);
  options.headers = forwardHeaders(req);

  try {
    const result = await request(options);
    copyHeaders(result.res, res);
    DEBUG &&
      console.log(
        `[request ${requestId}] ${result.res.statusCode} ${result.res.headers["content-type"]}`
      );
    const body = transform(result.body, result.res.headers["content-type"]);
    res.setHeader("Content-Length", Buffer.byteLength(body));
    res.writeHead(result.res.statusCode);
    res.end(body);
  } catch (error) {
    DEBUG && console.log(error.error ?? error);
    copyHeaders(error.res ?? {}, res);
    res.writeHead(error.res?.statusCode ?? 500);
    res.end((error.error ?? error).toString());
  }
};
