const { AsyncLocalStorage } = require("async_hooks");
const multer = require("multer");
const { SocketAddress } = require("net");
const { DefaultDeserializer } = require("v8");
const { Z_ASCII } = require("zlib");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".png");
  },
});


const uploads = multer({ storage: storage });

module.exports = uploads;