require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const User = require('./models/User');
const Settings = require('./models/Settings');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.set('bufferCommands', false);
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/influencer_planner')
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection error:', error));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/influencer_planner',
      collectionName: 'sessions'
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

const permissionMap = {
  influencers: '/influencers',
  contentPlan: '/content-plan',
  tasks: '/tasks',
  ideas: '/ideas',
  reporting: '/performance',
  settings: '/settings/general'
};

const canAccess = (user, key) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (key === 'home') return true;
  return user.permissions.includes(key);
};

const buildNav = (user) => {
  if (!user) return [];
  const nav = [
    { label: 'Anasayfa', href: '/', key: 'home' },
    {
      label: 'Influencer Yönetimi',
      key: 'influencersGroup',
      children: [
        { label: 'Influencer Listesi', href: '/influencers', key: 'influencers' },
        { label: 'Yeni Influencer Ekle/Çıkar', href: '/influencers', key: 'influencers' }
      ]
    },
    {
      label: 'İçerik & Görevler',
      key: 'contentGroup',
      children: [
        { label: 'İçerik Planı', href: '/content-plan', key: 'contentPlan' },
        { label: 'Görevler / To-Do', href: '/tasks', key: 'tasks' },
        { label: 'Başlık / Post Fikirleri', href: '/ideas', key: 'ideas' }
      ]
    },
    {
      label: 'Raporlama',
      key: 'reportingGroup',
      children: [{ label: 'Performans', href: '/performance', key: 'reporting' }]
    },
    {
      label: 'Ayarlar',
      key: 'settingsGroup',
      children: [
        { label: 'Genel Ayarlar', href: '/settings/general', key: 'settings' },
        { label: 'Kullanıcılar', href: '/settings/users', key: 'settings' },
        { label: 'Bildirimler', href: '/settings/notifications', key: 'settings' }
      ]
    }
  ];

  if (user.role === 'admin') return nav;

  return nav
    .map((item) => {
      if (!item.children) {
        return canAccess(user, item.key) ? item : null;
      }
      const children = item.children.filter((child) => canAccess(user, child.key));
      return children.length > 0 ? { ...item, children } : null;
    })
    .filter(Boolean);
};

const ensureAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  return next();
};

const ensurePermission = (key) => (req, res, next) => {
  const user = res.locals.currentUser;
  if (!user) {
    return res.redirect('/login');
  }
  if (user.role === 'admin' || canAccess(user, key)) {
    return next();
  }
  return res.status(403).render('not-authorized');
};

const loadSessionData = async (req, res, next) => {
  res.locals.currentUser = null;
  res.locals.settings = { logoUrl: '/public-logo.svg', notificationsEnabled: true };
  try {
    if (req.session.userId) {
      res.locals.currentUser = await User.findById(req.session.userId);
    }
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.locals.settings = settings;
  } catch (error) {
    console.error('Settings load error:', error);
  }
  res.locals.navItems = buildNav(res.locals.currentUser);
  return next();
};

app.use(loadSessionData);

const seedDefaultUsers = async () => {
  const count = await User.countDocuments();
  if (count > 0) return;
  const adminPassword = await bcrypt.hash('admin123', 10);
  const influencerPassword = await bcrypt.hash('infl123', 10);

  await User.create([
    {
      fullName: 'Admin Kullanıcı',
      email: 'admin@planner.local',
      passwordHash: adminPassword,
      role: 'admin',
      permissions: Object.keys(permissionMap)
    },
    {
      fullName: 'Influencer Demo',
      email: 'influencer@planner.local',
      passwordHash: influencerPassword,
      role: 'influencer',
      permissions: ['home', 'tasks'],
      tasks: [
        { title: 'Haftalık içerik planını incele', status: 'in_progress' },
        { title: 'Yeni kampanya fikirleri gönder', status: 'pending' }
      ]
    }
  ]);
};

mongoose.connection.once('open', () => {
  seedDefaultUsers().catch((error) => console.error('Seed error:', error));
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { error: 'Kullanıcı bulunamadı.' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.render('login', { error: 'Şifre hatalı.' });
    }
    req.session.userId = user._id;
    return res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    return res.render('login', { error: 'Veritabanına bağlanılamadı.' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/', ensureAuth, async (req, res) => {
  const user = res.locals.currentUser;
  res.render('dashboard', { user });
});

app.get('/influencers', ensureAuth, ensurePermission('influencers'), async (req, res) => {
  const influencers = await User.find({ role: 'influencer' });
  res.render('influencers', { influencers });
});

app.post('/influencers', ensureAuth, ensurePermission('influencers'), async (req, res) => {
  const { fullName, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    fullName,
    email,
    passwordHash,
    role: 'influencer',
    permissions: ['home', 'tasks']
  });
  res.redirect('/influencers');
});

app.post('/influencers/:id/delete', ensureAuth, ensurePermission('influencers'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/influencers');
});

app.post('/influencers/:id/tasks', ensureAuth, ensurePermission('influencers'), async (req, res) => {
  const { title, dueDate } = req.body;
  await User.findByIdAndUpdate(req.params.id, {
    $push: {
      tasks: {
        title,
        dueDate: dueDate ? new Date(dueDate) : undefined
      }
    }
  });
  res.redirect('/influencers');
});

app.get('/content-plan', ensureAuth, ensurePermission('contentPlan'), (req, res) => {
  res.render('content-plan');
});

app.get('/tasks', ensureAuth, ensurePermission('tasks'), (req, res) => {
  res.render('tasks');
});

app.get('/ideas', ensureAuth, ensurePermission('ideas'), (req, res) => {
  res.render('ideas');
});

app.get('/performance', ensureAuth, ensurePermission('reporting'), (req, res) => {
  res.render('performance');
});

app.get('/settings/general', ensureAuth, ensurePermission('settings'), (req, res) => {
  res.render('settings-general');
});

app.post('/settings/general', ensureAuth, ensurePermission('settings'), async (req, res) => {
  const { logoUrl, notificationsEnabled } = req.body;
  await Settings.findOneAndUpdate(
    {},
    {
      logoUrl,
      notificationsEnabled: notificationsEnabled === 'on'
    },
    { upsert: true }
  );
  res.redirect('/settings/general');
});

app.get('/settings/users', ensureAuth, ensurePermission('settings'), async (req, res) => {
  const users = await User.find();
  res.render('settings-users', { users });
});

app.post('/settings/users', ensureAuth, ensurePermission('settings'), async (req, res) => {
  const { fullName, email, password, role, permissions } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const permissionList = Array.isArray(permissions) ? permissions : permissions ? [permissions] : [];
  await User.create({
    fullName,
    email,
    passwordHash,
    role,
    permissions: role === 'admin' ? Object.keys(permissionMap) : permissionList
  });
  res.redirect('/settings/users');
});

app.post('/settings/users/:id/delete', ensureAuth, ensurePermission('settings'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/settings/users');
});

app.get('/settings/notifications', ensureAuth, ensurePermission('settings'), (req, res) => {
  res.render('settings-notifications');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
