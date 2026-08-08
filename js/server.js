const express = require('express');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Storage for uploaded images
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Load posts
let posts = [];
if (fs.existsSync('posts.json')) {
  posts = JSON.parse(fs.readFileSync('posts.json'));
}

// Get posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

// Add post (admin only)
app.post('/api/add-post', upload.single('image'), (req, res) => {
  // Simple password check
  if (req.headers['x-admin-key'] !== 'YOUR_SECRET_KEY') {
    return res.status(403).send('Unauthorized');
  }

  const newPost = {
    title: req.body.title,
    content: req.body.content,
    date: new Date().toLocaleDateString(),
    image: '/uploads/' + req.file.filename
  };
  posts.unshift(newPost);
  fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
  res.send('Blog post added successfully!');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
