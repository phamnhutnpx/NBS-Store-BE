import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "86400000", //60p*60s*1000ms
  });
};

export default generateToken;
