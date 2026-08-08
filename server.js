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
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load posts
let posts = [];
if (fs.existsSync('posts.json')) {
  posts = JSON.parse(fs.readFileSync('posts.json'));
}

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Get posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
