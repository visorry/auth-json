const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');

const app = express();
const router = jsonServer.router('./database.json');
const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(jsonServer.defaults());

const SECRET_KEY = 'fsadfarsg435sfdg';
const expiresIn = '1h';

// Create a token from a payload
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

// Verify the token
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => (decode !== undefined ? decode : err));
}

// Check if the user exists in the database
function isAuthenticated({ email, password }) {
  return userdb.users.findIndex((user) => user.email === email && user.password === password) !== -1;
}

// Register New User
app.post('/auth/register', (req, res) => {
  console.log('register endpoint called; request body:');
  console.log(req.body);
  const { email, password } = req.body;

  if (isAuthenticated({ email, password })) {
    const status = 401;
    const message = 'Email and Password already exist';
    res.status(status).json({ status, message });
    return;
  }

  fs.readFile('./users.json', (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }

    // Get current users data
    const usersData = JSON.parse(data.toString());

    // Get the id of the last user

    // Add new user
    usersData.users.push({ email, password });

    fs.writeFile('./users.json', JSON.stringify(usersData), (writeErr) => {
      if (writeErr) {
        const status = 401;
        const message = writeErr;
        res.status(status).json({ status, message });
        return;
      }

      // Create token for new user
      const access_token = createToken({ email, password });
      console.log('Access Token:', access_token);
      res.status(200).json({ access_token });
    });
  });
});

// Login to one of the users from json
app.post('/auth/login', (req, res) => {
  console.log('login endpoint called; request body:', req.body);
  const { email, password } = req.body;

  if (!isAuthenticated({ email, password })) {
      console.log(`Authentication failed for email: ${email}`);
      const status = 401;
      const message = 'Incorrect email or password';
      res.status(status).json({ status, message });
      return;
  }

  const access_token = createToken({ email, password });
  console.log('Access Token:', access_token);
  res.status(200).json({ access_token });
});

app.use(/^(?!\/auth).*$/, (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401;
    const message = 'Error in authorization format';
    res.status(status).json({ status, message });
    return;
  }

  try {
    const verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401;
      const message = 'Access token not provided';
      res.status(status).json({ status, message });
      return;
    }

    next();
  } catch (err) {
    const status = 401;
    const message = 'Error access_token is revoked';
    res.status(status).json({ status, message });
  }
});

app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Run Auth API Server on port ${PORT}`);
});
