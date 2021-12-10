'use strict';

const auth = require('basic-auth');
const bcrypt = require('bcrypt');
const { User } = require('../models');

// Middleware to authenticate the request using Basic Authentication
exports.authenticateUser = async (req, res, next) => {
  // Store the message to display later
  let message;

  const credentials = auth(req);
  if (credentials) {
    const user = await User.findOne({ where: { emailAddress: credentials.name } });
    if (user) {
      const authenticated = bcrypt
        .compareSync(credentials.pass, user.password);
      if (authenticated) {
        console.log(`Authentication successful for: ${user.emailAddress}`);
        // Store the retrieved user object on the request object
        req.currentUser = user;
      } else {
        message = `Authentication failure for: ${user.emailAddress}`;
      }
    } else {
      message = `User not found for: ${credentials.name}`;
    }
  } else {
    message = 'Auth header not found';
  }

  // If user authentication fails, return a response with a 401 Unauthorized HTTP status code
  if (message) {
    console.warn(message);
    res.status(401).json({ message: 'Access Denied' });
  } else {
    next();
  }
};
