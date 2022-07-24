const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const userModel = require("../database/user");
dotenv.config();

const isValidUser = async (req, res, next) => {
  console.log("in middleware.");
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer")) {
    console.log("authorization does not start with bearer ");
    return res.send({
      status: false,
      msg: "Invalid token. Login again to continue.",
    });
  }

  const token = authorization.split(" ")[1];
  let verify = jwt.verify(token, process.env.JWT_SIGN_KEY);

  let user;
  try {
    user = await userModel.findOne({ _id: verify.userId });
    if (!user) {
      console.log("user not found");
      return res.send({
        status: false,
        msg: "Something went wrong. Login again to continue.",
      });
    }
  } catch (error) {
    console.log("error while verifying");
    console.log(error);
    return res.send({
      status: false,
      msg: "Invalid token. Login again to continue.",
    });
  }
  req.user = user;
  next();
};

module.exports = isValidUser
