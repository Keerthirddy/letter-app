import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('User');
  const [letterContent, setLetterContent] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [token, setToken] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('App mounted, checking query params:', location.search);
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    const accessTokenFromUrl = queryParams.get('accessToken');

    if (tokenFromUrl && accessTokenFromUrl) {
      console.log('Tokens found:', { token: tokenFromUrl, accessToken: accessTokenFromUrl });
      setToken(tokenFromUrl);
      setAccessToken(accessTokenFromUrl);
      setIsAuthenticated(true);
      fetchUserName(tokenFromUrl);
    } else {
      console.log('No tokens found, redirecting to /');
      navigate('/');
    }
  }, [location, navigate]);

  const fetchUserName = async (token) => {
    try {
      console.log('Fetching user name with token:', token);
      const response = await fetch('/.netlify/functions/api/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('User name response:', data);
      if (data.name) {
        setUserName(data.name);
      }
    } catch (err) {
      console.error('Error fetching user name:', err);
    }
  };

  const handleLogin = () => {
    console.log('Initiating Google login');
    window.location.href = '/.netlify/functions/api/auth/google';
  };

  const handleSaveLetter = async () => {
    if (!letterContent) {
      alert('Please write a letter before saving.');
      return;
    }

    console.log('Saving letter with accessToken:', accessToken, 'content:', letterContent);
    try {
      const response = await fetch('/.netlify/functions/api/api/save-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken, content: letterContent }),
      });

      const data = await response.json();
      console.log('Save letter response:', data);
      if (data.fileId) {
        alert(`Letter saved to Google Drive! File ID: ${data.fileId}`);
      } else {
        alert('Failed to save letter: ' + (data.details || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error saving letter:', err);
      alert('Error saving letter: ' + err.message);
    }
  };

  const handleTextareaChange = (e) => {
    console.log('Textarea changed, new value:', e.target.value);
    setLetterContent(e.target.value);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <div>
          <h1>Login to Write a Letter</h1>
          <button onClick={handleLogin}>Login with Google</button>
        </div>
      ) : (
        <div>
          <h1>Welcome, {userName}! You are logged in!</h1>
          <h2>Write a Letter</h2>
          <textarea
            value={letterContent}
            onChange={handleTextareaChange}
            rows="10"
            cols="50"
            placeholder="Write your letter here..."
            readOnly={false}
            disabled={false}
          />
          <br />
          <button onClick={handleSaveLetter}>Save to Google Drive</button>
        </div>
      )}
    </div>
  );
}

export default App;