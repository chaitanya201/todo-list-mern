const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const express = require("express");
const { loginSchema, registerSchema } = require("../schemas/authSchema");
const userModel = require("../../database/user");
const router = express.Router();
dotenv.config();

const register = async (req, res) => {
  console.log("In register");
  const { error } = registerSchema.validate(req.body);
  if (error) {
    console.log("Joi error ");
    console.log(error);
    return res.send({ status: false, msg: "Provide valid/ALL details" });
  }

  // checking if entered email already exists or not.
  try {
    const findUser = await userModel.findOne({ email: req.body.email });
    if (findUser) {
      console.log("email exists");
      return res.send({ status: false, msg: "Email already exists." });
    }
  } catch (error) {
    console.log("error while finding user");
    console.log(error);
    return res.send({ status: false, msg: error.message });
  }

  // generate salt
  let salt;
  try {
    // env variables are of string dataType so parseInt is used because genSalt takes number
    salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
  } catch (error) {
    console.log("salt generation error");
    console.log(error);
    return res.send({ status: false, msg: "Server Error." });
  }

  // generating hashed password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(req.body.password, salt);
  } catch (error) {
    console.log("error while password hashing");
    console.log(error);
    return res.send({ status: false, msg: "Server Error. Try again later." });
  }

  // creating user
  const user = new userModel({
    name: req.body.name.trim(),
    email: req.body.email.trim(),
    password: hashedPassword.trim(),
  });

  // saving the user
  await user
    .save()
    .then((doc) => {
      console.log("data saved");
      console.log(doc);
    })
    .catch((err) => {
      if (err) {
        console.log("error while saving");
        return res.send({
          status: false,
          msg: "Something went wrong while saving the credentials. Try again later.",
        });
      }
    });

  // getting saved user

  let savedUser;
  try {
    console.log("lerner email ", user.email);
    savedUser = await userModel.findOne({ email: user.email });
    if (!savedUser) {
      console.log("saved learner not found");
      console.log("saved user ", savedUser);
      return res.send({
        status: false,
        msg: "Credentials are saved, but unable to login.",
      });
    }
  } catch (error) {
    console.log("error while finding saved user.");
    return res.send({
      status: false,
      msg: "Credentials are saved, but unable to login. Try again later.",
    });
  }

  // creating jwt token
  const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SIGN_KEY, {
    expiresIn: "30d",
  });
  res.cookie('token',token,{expiresIn:1296000000})
  res.cookie('user',savedUser,{expiresIn:1296000000})
  return res.send({ status: true, token, user: savedUser });
};

const login = async (req, res) => {
  console.log("In login");
  const { error } = loginSchema.validate(req.body);
  if (error) {
    console.log("joi error");
    console.log(error);
    return res.send({
      status: false,
      msg: "Please provide valid credentials.",
    });
  }

  // find learner
  let findUser;
  try {
    findUser = await userModel.findOne({ email: req.body.email });
    if (!findUser) {
      console.log("learner not found");
      return res.send({ status: false, msg: "Email or password is wrong." });
    }
  } catch (error) {
    console.log("error while finding learner");
    console.log(error);
    return res.send({
      status: false,
      msg: "Something went wrong while validating credentials.",
    });
  }

  // check password
  let isPasswordValid;
  try {
    isPasswordValid = await bcrypt.compare(
      req.body.password,
      findUser.password
    );
    if (!isPasswordValid) {
      console.log("incorrect password");
      return res.send({ status: false, msg: "Email or password is wrong." });
    }
  } catch (error) {
    console.log("error while password checking");
    return res.send({
      status: false,
      msg: "Server Error while password validation. Try again later.",
    });
  }

  // create login token
  const token = jwt.sign({ userId: findUser._id }, process.env.JWT_SIGN_KEY, {
    expiresIn: "30d",
  });
  res.cookie('token',token,{expiresIn:1296000000})
  res.cookie('user',findUser,{expiresIn:1296000000})
  return res.send({ status: true, token, user: findUser });
};

router.post('/register', register)
router.post('/login', login)

module.exports = router