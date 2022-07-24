const mongoose = require("mongoose");

const dbConfig = (url) => {
  mongoose
    .connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("database connected");
    })
    .catch((err) => {
      console.log("catch error");
      console.log(err);
    });
};

module.exports= dbConfig