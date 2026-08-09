const express = require('express');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Storage for uploaded images
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use(bodyParser.json());
// Serve only browser-facing directories. Never expose the project root, which
// contains private files such as .env, server.js, and the JSON data stores.
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load posts
let posts = [];
if (fs.existsSync('posts.json')) {
  posts = JSON.parse(fs.readFileSync('posts.json'));
}

// Load highlights
let highlights = [];
if (fs.existsSync('highlights.json')) {
  highlights = JSON.parse(fs.readFileSync('highlights.json'));
} else {
  fs.writeFileSync('highlights.json', JSON.stringify(highlights, null, 2));
}

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Search-engine crawl instructions are public, while the project root remains private.
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').sendFile(path.join(__dirname, 'robots.txt'));
});

// Get posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

// Get highlights
app.get('/api/highlights', (req, res) => {
  res.json(highlights);
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    res.json({ success: true, token: process.env.SECRET_KEY });
  } else {
    res.status(403).json({ success: false, message: 'Invalid credentials' });
  }
});

// Add post
app.post('/api/add-post', upload.single('image'), (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.SECRET_KEY) {
    return res.status(403).send('Unauthorized');
  }
  const newPost = {
    title: req.body.title,
    content: req.body.content,
    date: new Date().toLocaleDateString(),
    image: req.file ? '/uploads/' + req.file.filename : null
  };
  posts.unshift(newPost);
  fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
  res.send('Blog post added successfully!');
});

// Delete post
app.delete('/api/delete-post/:index', (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.SECRET_KEY) {
    return res.status(403).send('Unauthorized');
  }

  const index = parseInt(req.params.index);
  if (index >= 0 && index < posts.length) {
    const post = posts[index];

    // Delete image file if it exists
    if (post.image) {
      const filePath = path.join(__dirname, post.image);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Failed to delete image:", err);
        } else {
          console.log("Image deleted:", filePath);
        }
      });
    }

    // Remove post from array
    posts.splice(index, 1);
    fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));

    res.send('Post deleted successfully!');
  } else {
    res.status(404).send('Post not found');
  }
});


// Edit post
app.put('/api/edit-post/:index', upload.single('image'), (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.SECRET_KEY) {
    return res.status(403).send('Unauthorized');
  }
  const index = parseInt(req.params.index);
  if (index >= 0 && index < posts.length) {
    posts[index].title = req.body.title || posts[index].title;
    posts[index].content = req.body.content || posts[index].content;
    if (req.file) {
      posts[index].image = '/uploads/' + req.file.filename;
    }
    fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
    res.send('Post updated successfully!');
  } else {
    res.status(404).send('Post not found');
  }
});

// Add highlight item
app.post('/api/add-highlight', upload.single('image'), (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.SECRET_KEY) {
    return res.status(403).send('Unauthorized');
  }

  const newHighlight = {
    title: req.body.title,
    description: req.body.description,
    category: req.body.category || 'academics',
    image: req.file ? '/uploads/' + req.file.filename : null,
    date: new Date().toLocaleDateString(),
  };

  highlights.unshift(newHighlight);
  fs.writeFileSync('highlights.json', JSON.stringify(highlights, null, 2));
  res.send('Highlight item added successfully!');
});

// Delete highlight item
app.delete('/api/delete-highlight/:index', (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.SECRET_KEY) {
    return res.status(403).send('Unauthorized');
  }

  const index = parseInt(req.params.index);
  if (index >= 0 && index < highlights.length) {
    const item = highlights[index];
    if (item.image) {
      const filePath = path.join(__dirname, item.image);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Failed to delete image:', err);
        }
      });
    }
    highlights.splice(index, 1);
    fs.writeFileSync('highlights.json', JSON.stringify(highlights, null, 2));
    res.send('Highlight item deleted successfully!');
  } else {
    res.status(404).send('Highlight not found');
  }
});

// Edit highlight item
app.put('/api/edit-highlight/:index', upload.single('image'), (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.SECRET_KEY) {
    return res.status(403).send('Unauthorized');
  }
  const index = parseInt(req.params.index);
  if (index >= 0 && index < highlights.length) {
    highlights[index].title = req.body.title || highlights[index].title;
    highlights[index].description = req.body.description || highlights[index].description;
    highlights[index].category = req.body.category || highlights[index].category;
    if (req.file) {
      highlights[index].image = '/uploads/' + req.file.filename;
    }
    fs.writeFileSync('highlights.json', JSON.stringify(highlights, null, 2));
    res.send('Highlight item updated successfully!');
  } else {
    res.status(404).send('Highlight not found');
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
