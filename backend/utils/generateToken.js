const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }  // This format is correct
  );
};

module.exports = generateToken;