const express = require('express');
const serverless = require('serverless-http');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({ secret: 'letterapp-secret-2025', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID ,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback', // This will be handled by Netlify Functions
    },
    (accessToken, refreshToken, profile, done) => {
      console.log('Google auth callback received:', { profile, accessToken });
      return done(null, { profile, accessToken });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user);
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  console.log('Deserializing user:', obj);
  done(null, obj);
});

app.get(
  '/auth/google',
  (req, res, next) => {
    console.log('Starting Google auth process');
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
    prompt: 'select_account',
  })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    console.log('Google auth callback successful, generating token');
    const token = jwt.sign({ id: req.user.profile.id }, 'letterapp-secret-2025', { expiresIn: '1h' });
    console.log('Redirecting to dashboard with token:', token, 'accessToken:', req.user.accessToken);
    res.redirect(`/dashboard?token=${token}&accessToken=${req.user.accessToken}`);
  }
);

app.get('/api/user', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('No token provided in /api/user request');
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, 'letterapp-secret-2025', (err, decoded) => {
    if (err) {
      console.log('Invalid token in /api/user:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.log('User fetched successfully:', req.user?.profile.displayName);
    res.json({ name: req.user?.profile.displayName || 'User' });
  });
});

app.post('/api/save-letter', async (req, res) => {
  const { accessToken, content } = req.body;
  console.log('Received save-letter request:', { accessToken, content });
  if (!accessToken || !content) {
    console.log('Missing accessToken or content');
    return res.status(400).json({ error: 'Missing accessToken or content' });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    console.log('Auth credentials set');

    const drive = google.drive({ version: 'v3', auth });
    const fileMetadata = {
      name: 'MyLetter.txt',
      mimeType: 'text/plain',
    };
    console.log('File metadata prepared');

    const response = await drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: 'text/plain',
        body: content,
      },
      fields: 'id',
    });
    console.log('File created successfully:', response.data);

    res.json({ fileId: response.data.id });
  } catch (err) {
    console.error('Error saving letter:', err);
    console.error('Error details:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Failed to save letter', details: err.message });
  }
});

// Export the Express app as a Netlify Function
module.exports.handler = serverless(app);