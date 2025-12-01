const express = require('express');
const atomicdocs = require('atomicdocs');

const app = express();
app.use(express.json());
app.use(atomicdocs());

// In-memory data
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, role: 'user' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, role: 'user' }
];

let posts = [
  { id: 1, userId: 1, title: 'First Post', content: 'Hello World', likes: 10 },
  { id: 2, userId: 2, title: 'Second Post', content: 'Another post', likes: 5 }
];

let comments = [
  { id: 1, postId: 1, userId: 2, text: 'Great post!', createdAt: '2025-01-01' },
  { id: 2, postId: 1, userId: 3, text: 'Thanks for sharing', createdAt: '2025-01-02' }
];

let nextUserId = 4;
let nextPostId = 3;
let nextCommentId = 3;

// Simple auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = { id: 1, role: 'admin' };
  next();
};

// ============ AUTH ROUTES ============

// POST login
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'password') {
    return res.json({ 
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      user: { username: 'admin', role: 'admin' }
    });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

// POST register
app.post('/auth/register', (req, res) => {
  const { username, email, password, age } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newUser = {
    id: nextUserId++,
    name: username,
    email,
    age: age || 18,
    role: 'user'
  };
  
  users.push(newUser);
  res.status(201).json({ message: 'User registered', userId: newUser.id });
});

// ============ USER ROUTES ============

// GET all users (with query params and auth)
app.get('/users', authenticate, (req, res) => {
  const { page, limit, sortBy } = req.query;
  const clientId = req.headers['x-client-id'];
  
  let results = users;
  
  // Pagination
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const startIndex = (pageNum - 1) * pageSize;
  results = results.slice(startIndex, startIndex + pageSize);
  
  res.json({ 
    data: results, 
    page: pageNum, 
    total: users.length,
    clientId: clientId || 'unknown'
  });
});

// GET user by ID
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// POST create user (protected)
app.post('/users', authenticate, (req, res) => {
  const { name, email, age, role } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const newUser = {
    id: nextUserId++,
    name,
    email,
    age: age || 0,
    role: role || 'user'
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT update user (protected)
app.put('/users/:id', authenticate, (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { name, email, age, role } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (age !== undefined) user.age = age;
  if (role) user.role = role;
  
  res.json(user);
});

// DELETE user (protected)
app.delete('/users/:id', authenticate, (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users.splice(index, 1);
  res.json({ message: 'User deleted successfully' });
});

// ============ POST ROUTES ============

// GET all posts with filtering
app.get('/posts', (req, res) => {
  const { userId, search, minLikes } = req.query;
  let results = posts;
  
  if (userId) {
    results = results.filter(p => p.userId === parseInt(userId));
  }
  
  if (search) {
    results = results.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (minLikes) {
    results = results.filter(p => p.likes >= parseInt(minLikes));
  }
  
  res.json({ posts: results, count: results.length });
});

// GET post by ID
app.get('/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

// POST create post (protected)
app.post('/posts', authenticate, (req, res) => {
  const { userId, title, content } = req.body;
  
  if (!userId || !title || !content) {
    return res.status(400).json({ error: 'userId, title, and content are required' });
  }
  
  const newPost = {
    id: nextPostId++,
    userId: parseInt(userId),
    title,
    content,
    likes: 0
  };
  
  posts.push(newPost);
  res.status(201).json(newPost);
});

// PUT update post (protected)
app.put('/posts/:id', authenticate, (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  const { title, content } = req.body;
  if (title) post.title = title;
  if (content) post.content = content;
  
  res.json(post);
});

// POST like a post
app.post('/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  post.likes++;
  res.json({ likes: post.likes });
});

// DELETE post (protected)
app.delete('/posts/:id', authenticate, (req, res) => {
  const index = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  posts.splice(index, 1);
  res.json({ message: 'Post deleted successfully' });
});

// ============ COMMENT ROUTES ============

// GET comments for a post with pagination
app.get('/posts/:postId/comments', (req, res) => {
  const { offset, limit } = req.query;
  let postComments = comments.filter(c => c.postId === parseInt(req.params.postId));
  
  const start = parseInt(offset) || 0;
  const count = parseInt(limit) || 10;
  postComments = postComments.slice(start, start + count);
  
  res.json({ comments: postComments, total: postComments.length });
});

// POST create comment (protected)
app.post('/posts/:postId/comments', authenticate, (req, res) => {
  const { userId, text } = req.body;
  
  if (!userId || !text) {
    return res.status(400).json({ error: 'userId and text are required' });
  }
  
  const newComment = {
    id: nextCommentId++,
    postId: parseInt(req.params.postId),
    userId: parseInt(userId),
    text,
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  comments.push(newComment);
  res.status(201).json(newComment);
});

// DELETE comment (protected)
app.delete('/comments/:id', authenticate, (req, res) => {
  const index = comments.findIndex(c => c.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  
  comments.splice(index, 1);
  res.json({ message: 'Comment deleted successfully' });
});

// ============ SEARCH ROUTES ============

// GET search users with headers
app.get('/search/users', (req, res) => {
  const { query, role, minAge, maxAge } = req.query;
  const acceptLanguage = req.get('Accept-Language');
  
  let results = users;
  
  if (query) {
    results = results.filter(u => 
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  if (role) {
    results = results.filter(u => u.role === role);
  }
  
  if (minAge) {
    results = results.filter(u => u.age >= parseInt(minAge));
  }
  
  if (maxAge) {
    results = results.filter(u => u.age <= parseInt(maxAge));
  }
  
  res.json({ 
    results, 
    count: results.length,
    language: acceptLanguage || 'en'
  });
});

// ============ HEALTH CHECK ============

// GET health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const PORT = 6767;
app.set('port', PORT);

app.listen(PORT, () => {
  console.log(`App: http://localhost:${PORT}`);
  console.log(`Docs: http://localhost:${PORT}/docs`);
  
  atomicdocs.register(app, PORT);
});
