const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// JSON File DB
const dbFolder = path.join(__dirname, 'database');
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder);
}
const dbFile = path.join(dbFolder, 'db.json');

// Initialize DB if doesn't exist
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ users: [] }, null, 2));
}

const getDb = () => JSON.parse(fs.readFileSync(dbFile, 'utf8'));
const saveDb = (data) => fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));

// Seed admin user
const seedAdmin = async () => {
  const db = getDb();
  if (!db.users.find(u => u.email === 'admin@bitsathy.ac.in')) {
    const hashedPassword = await bcrypt.hash('admin@1234', 10);
    db.users.push({
      _id: 'admin-root',
      username: 'admin',
      email: 'admin@bitsathy.ac.in',
      password: hashedPassword,
      name: 'Institutional Administrator',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      joinedDate: 'Jan 2018',
      department: 'Central Academic Administration',
      title: 'Chief Institutional Administrator',
      status: 'active',
      isBlocked: false
    });
    saveDb(db);
    console.log('Admin seeded.');
  }
};
seedAdmin();

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// --- Routes ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;
    const db = getDb();
    if (db.users.find(u => u.email === email || u.username === username)) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      _id: Date.now().toString(),
      username, email, password: hashedPassword, name, role: role || 'student',
      status: 'active', isBlocked: false
    };
    db.users.push(newUser);
    saveDb(db);

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
    
    const userObj = { ...newUser, id: newUser._id };
    delete userObj.password;
    
    res.json({ success: true, token, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.email === usernameOrEmail || u.username === usernameOrEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
    
    const userObj = { ...user, id: user._id };
    delete userObj.password;

    res.json({ success: true, token, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const user = db.users.find(u => u._id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const userObj = { ...user, id: user._id };
    delete userObj.password;
    res.json({ success: true, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const idx = db.users.findIndex(u => u._id === req.user.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });
    
    let updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    db.users[idx] = { ...db.users[idx], ...updateData };
    saveDb(db);
    
    const userObj = { ...db.users[idx], id: db.users[idx]._id };
    delete userObj.password;
    res.json({ success: true, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const users = db.users.map(u => {
      const { password, ...rest } = u;
      return { ...rest, id: u._id };
    });
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/users/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = getDb();
    const user = db.users.find(u => u._id === req.params.id || u.id === req.params.id);
    if (!user) {
      return next(); // might be an action route
    }
    const { password, ...rest } = user;
    res.json({ success: true, data: { ...rest, id: user._id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    let newData = { ...req.body };
    if (newData.password) {
      newData.password = await bcrypt.hash(newData.password, 10);
    } else {
      newData.password = await bcrypt.hash('password123', 10);
    }
    const newUser = { ...newData, _id: Date.now().toString(), id: Date.now().toString() };
    db.users.push(newUser);
    saveDb(db);
    
    const userObj = { ...newUser };
    delete userObj.password;
    res.json({ success: true, data: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const idx = db.users.findIndex(u => u._id === req.params.id || u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });
    
    let updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    db.users[idx] = { ...db.users[idx], ...updateData };
    saveDb(db);
    
    const userObj = { ...db.users[idx], id: db.users[idx]._id };
    delete userObj.password;
    res.json({ success: true, data: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:id/mentor', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const idx = db.users.findIndex(u => u._id === req.params.id || u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });
    
    db.users[idx] = { ...db.users[idx], ...req.body };
    saveDb(db);
    
    const userObj = { ...db.users[idx], id: db.users[idx]._id };
    delete userObj.password;
    res.json({ success: true, data: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:id/semester-courses', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const idx = db.users.findIndex(u => u._id === req.params.id || u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });
    
    const { semester, courseIds } = req.body;
    const currentAssignments = db.users[idx].semesterCourseAssignments || {};
    const updatedAssignments = { ...currentAssignments, [semester]: courseIds };
    const allAssigned = Array.from(new Set(Object.values(updatedAssignments).flat()));
    
    db.users[idx] = { 
      ...db.users[idx], 
      semesterCourseAssignments: updatedAssignments, 
      assignedCourseIds: allAssigned 
    };
    saveDb(db);
    
    const userObj = { ...db.users[idx], id: db.users[idx]._id };
    delete userObj.password;
    res.json({ success: true, data: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    db.users = db.users.filter(u => u._id !== req.params.id && u.id !== req.params.id);
    saveDb(db);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Generic CRUD for all other collections
app.get('/api/:collection', authMiddleware, (req, res, next) => {
  const coll = req.params.collection;
  // Skip auth/users which are handled above
  if (['auth', 'users'].includes(coll)) return next();
  const db = getDb();
  const data = db[coll] || [];
  res.json({ success: true, count: data.length, data });
});

app.get('/api/:collection/:id', authMiddleware, (req, res, next) => {
  const coll = req.params.collection;
  if (['auth', 'users'].includes(coll)) return next();
  const db = getDb();
  if (!db[coll]) return res.status(404).json({ success: false, message: 'Not found' });
  const item = db[coll].find(x => x.id === req.params.id || x._id === req.params.id);
  if (!item) {
    // If it's an action rather than an ID, pass to the next handler
    return next();
  }
  res.json({ success: true, data: item });
});

app.post('/api/:collection', authMiddleware, (req, res, next) => {
  const coll = req.params.collection;
  if (['auth', 'users'].includes(coll)) return next();
  const db = getDb();
  if (!db[coll]) db[coll] = [];
  const newItem = { ...req.body, _id: Date.now().toString(), id: Date.now().toString() };
  db[coll].push(newItem);
  saveDb(db);
  res.json({ success: true, data: newItem });
});

app.put('/api/:collection/:id', authMiddleware, (req, res, next) => {
  const coll = req.params.collection;
  if (['auth', 'users'].includes(coll)) return next();
  const db = getDb();
  if (!db[coll]) return res.status(404).json({ success: false, message: 'Not found' });
  const idx = db[coll].findIndex(item => item.id === req.params.id || item._id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  db[coll][idx] = { ...db[coll][idx], ...req.body };
  saveDb(db);
  res.json({ success: true, data: db[coll][idx] });
});

app.delete('/api/:collection/:id', authMiddleware, (req, res, next) => {
  const coll = req.params.collection;
  if (['auth', 'users'].includes(coll)) return next();
  const db = getDb();
  if (!db[coll]) return res.status(404).json({ success: false, message: 'Not found' });
  db[coll] = db[coll].filter(item => item.id !== req.params.id && item._id !== req.params.id);
  saveDb(db);
  res.json({ success: true, message: 'Deleted' });
});

app.put('/api/:collection/:id/:action', authMiddleware, (req, res) => {
  const db = getDb();
  const coll = req.params.collection;
  let item = {};
  if (db[coll]) {
    const idx = db[coll].findIndex(x => x.id === req.params.id || x._id === req.params.id);
    if (idx !== -1) {
      if (req.params.action === 'resolve' && coll === 'change-requests') {
        db[coll][idx].status = 'resolved';
        saveDb(db);
      } else if (req.params.action === 'read' && coll === 'notifications') {
        db[coll][idx].read = true;
        saveDb(db);
      }
      item = db[coll][idx];
    }
  }
  res.json({ success: true, message: 'Action successful', data: item });
});

app.post('/api/:collection/:action', authMiddleware, (req, res) => {
  if (req.params.collection === 'attendance' && req.params.action === 'batch') {
    return res.json({ success: true, message: 'Batch success', modified: 1, upserted: 0 });
  }
  res.json({ success: true, message: 'Action mock successful', data: {} });
});

app.delete('/api/:collection/:action', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Delete action mock successful' });
});

app.get('/api/:collection/:action', authMiddleware, (req, res) => {
  res.json({ success: true, count: 0, data: [] });
});

app.get('/api/:collection/:id/:action', authMiddleware, (req, res) => {
  if (req.params.action === 'stats') {
    return res.json({ 
      success: true, 
      data: { totalDays: 0, presentDays: 0, absentDays: 0, odDays: 0, lateDays: 0, attendanceRate: 100, absencePercentage: 0 } 
    });
  }
  res.json({ success: true, data: {} });
});

app.put('/api/:collection', authMiddleware, (req, res) => {
  const db = getDb();
  const coll = req.params.collection;
  // This handles /api/academic-term-period
  db[coll] = { ...db[coll], ...req.body };
  saveDb(db);
  res.json({ success: true, data: req.body });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
