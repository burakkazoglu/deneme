require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Settings = require('./models/Settings');
const Category = require('./models/Category');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.set('bufferCommands', false);
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/influencer_planner')
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection error:', error));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

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
  influencerManage: '/influencers/manage',
  contentPlan: '/content-plan',
  tasks: '/tasks',
  ideas: '/ideas',
  reporting: '/reports/performance',
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
    { label: 'Anasayfa', href: '/', key: 'home', icon: 'dashboard' },
    {
      label: 'Influencer Yönetimi',
      key: 'influencersGroup',
      icon: 'groups',
      children: [
        { label: 'Influencer Listesi', href: '/influencers', key: 'influencers' },
        { label: 'Yeni Influencer Ekle/Çıkar', href: '/influencers/manage', key: 'influencerManage' }
      ]
    },
    {
      label: 'İçerik & Görevler',
      key: 'contentGroup',
      icon: 'assignment',
      children: [
        { label: 'İçerik Planı', href: '/content-plan', key: 'contentPlan' },
        { label: 'Görevler / To-Do', href: '/tasks', key: 'tasks' },
        { label: 'Başlık / Post Fikirleri', href: '/ideas', key: 'ideas' }
      ]
    },
    {
      label: 'Raporlar',
      key: 'reportingGroup',
      icon: 'insights',
      children: [
        { label: 'Performans', href: '/reports/performance', key: 'reporting' },
        { label: 'Dashboard', href: '/reports/dashboard', key: 'reporting' }
      ]
    },
    {
      label: 'Ayarlar',
      key: 'settingsGroup',
      icon: 'settings',
      children: [
        { label: 'Genel Ayarlar', href: '/settings/general', key: 'settings' },
        { label: 'Kullanıcılar', href: '/settings/users', key: 'settings' },
        { label: 'Bildirimler', href: '/settings/notifications', key: 'settings' },
        { label: 'Duyuru Panosu', href: '/settings/announcement', key: 'settings' }
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

const ensureAdmin = (req, res, next) => {
  const user = res.locals.currentUser;
  if (!user) {
    return res.redirect('/login');
  }
  if (user.role === 'admin') {
    return next();
  }
  return res.status(403).render('not-authorized');
};

const formatDate = (date) => {
  if (!date) return '-';
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatDateInput = (date) => {
  if (!date) return '';
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

const parseDateTr = (value) => {
  if (!value) return null;
  const [day, month, year] = value.split('.').map((item) => Number(item));
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

const statusLabelMap = {
  bekliyor: 'Bekliyor',
  devam_ediyor: 'Devam Ediyor',
  duraklatildi: 'Duraklatıldı',
  tamamlandi: 'Tamamlandı'
};

const statusClassMap = {
  bekliyor: 'pending',
  devam_ediyor: 'in-progress',
  duraklatildi: 'paused',
  tamamlandi: 'done'
};

const loadSessionData = async (req, res, next) => {
  res.locals.currentUser = null;
  res.locals.settings = {
    logoUrl: '/public-logo.svg',
    notificationsEnabled: true,
    taskTypes: [],
    announcementText: ''
  };
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
  res.locals.formatDate = formatDate;
  res.locals.formatDateInput = formatDateInput;
  res.locals.formatStatus = (status) => statusLabelMap[status] || status;
  res.locals.statusClass = (status) => statusClassMap[status] || 'pending';
  res.locals.currentPath = req.path;
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
      category: 'Teknoloji',
      platforms: ['Instagram', 'TikTok'],
      tasks: [
        {
          title: 'Haftalık içerik planını incele',
          taskType: 'Hook İçerik',
          status: 'devam_ediyor',
          dueDate: new Date()
        },
        { title: 'Yeni kampanya fikirleri gönder', taskType: 'Story', status: 'bekliyor' }
      ]
    }
  ]);
};

const seedDefaultCategories = async () => {
  const count = await Category.countDocuments();
  if (count > 0) return;
  await Category.create([
    { name: 'Sağlık', color: '#0EA5E9', isActive: true },
    { name: 'Teknoloji', color: '#6366F1', isActive: true },
    { name: 'Güzellik & Makyaj', color: '#EC4899', isActive: true },
    { name: 'Moda', color: '#F97316', isActive: true },
    { name: 'Spor', color: '#22C55E', isActive: true },
    { name: 'Yemek', color: '#A855F7', isActive: false }
  ]);
};

mongoose.connection.once('open', () => {
  seedDefaultUsers().catch((error) => console.error('Seed error:', error));
  seedDefaultCategories().catch((error) => console.error('Seed error:', error));
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
  let calendarTasks = [];
  if (user.role === 'admin' || user.role === 'staff') {
    const influencers = await User.find({ role: 'influencer' });
    calendarTasks = influencers.flatMap((influencer) =>
      influencer.tasks.map((task) => ({
        id: task._id,
        title: task.title,
        taskType: task.taskType || 'Görev',
        status: task.status,
        dueDate: task.dueDate,
        influencer: influencer.fullName
      }))
    );
  } else {
    calendarTasks = user.tasks.map((task) => ({
      id: task._id,
      title: task.title,
      taskType: task.taskType || 'Görev',
      status: task.status,
      dueDate: task.dueDate,
      influencer: user.fullName
    }));
  }
  res.render('dashboard', { user, calendarTasks });
});

app.get('/influencers', ensureAuth, ensurePermission('influencers'), async (req, res) => {
  const influencers = await User.find({ role: 'influencer' });
  res.render('influencers', { influencers });
});

app.get('/influencers/manage', ensureAuth, ensurePermission('influencerManage'), async (req, res) => {
  const influencers = await User.find({ role: 'influencer' });
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.render('influencers-manage', { influencers, categories });
});

app.post('/influencers/manage', ensureAuth, ensurePermission('influencerManage'), async (req, res) => {
  const { fullName, email, password, category, platforms } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const platformList = Array.isArray(platforms) ? platforms : platforms ? [platforms] : [];
  await User.create({
    fullName,
    email,
    passwordHash,
    role: 'influencer',
    permissions: ['home', 'tasks'],
    category,
    platforms: platformList
  });
  res.redirect('/influencers/manage');
});

app.post('/influencers/manage/:id/delete', ensureAuth, ensurePermission('influencerManage'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/influencers/manage');
});

app.get('/api/categories', ensureAuth, ensurePermission('influencerManage'), async (req, res) => {
  const activeOnly = req.query.activeOnly === 'true';
  const filter = activeOnly ? { isActive: true } : {};
  const categories = await Category.find(filter).sort({ name: 1 });
  const influencers = await User.find({ role: 'influencer' });
  const withCounts = categories.map((category) => ({
    id: category._id,
    name: category.name,
    color: category.color,
    isActive: category.isActive,
    influencerCount: influencers.filter((inf) => inf.category === category.name).length
  }));
  res.json(withCounts);
});

app.post('/api/categories', ensureAuth, ensurePermission('influencerManage'), async (req, res) => {
  const { name, color } = req.body;
  const trimmed = name ? name.trim() : '';
  if (!trimmed) {
    return res.status(400).json({ error: 'Kategori adı gerekli.' });
  }
  const exists = await Category.findOne({ name: trimmed });
  if (exists) {
    return res.status(409).json({ error: 'Kategori zaten mevcut.' });
  }
  const category = await Category.create({ name: trimmed, color: color || '#3B82F6', isActive: true });
  return res.json({ id: category._id, name: category.name, color: category.color, isActive: category.isActive });
});

app.patch('/api/categories/bulk', ensureAuth, ensurePermission('influencerManage'), async (req, res) => {
  const { activateIds, deactivateIds } = req.body;
  const activateList = Array.isArray(activateIds) ? activateIds : [];
  const deactivateList = Array.isArray(deactivateIds) ? deactivateIds : [];
  const bulkOps = [
    ...activateList.map((id) => ({
      updateOne: { filter: { _id: id }, update: { isActive: true } }
    })),
    ...deactivateList.map((id) => ({
      updateOne: { filter: { _id: id }, update: { isActive: false } }
    }))
  ];
  if (bulkOps.length > 0) {
    await Category.bulkWrite(bulkOps);
  }
  return res.json({ success: true });
});

app.patch('/api/categories/:id', ensureAuth, ensurePermission('influencerManage'), async (req, res) => {
  const { isActive } = req.body;
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: Boolean(isActive) },
    { new: true }
  );
  return res.json({ id: category._id, name: category.name, isActive: category.isActive });
});

app.get('/content-plan', ensureAuth, ensurePermission('contentPlan'), (req, res) => {
  res.render('content-plan');
});

app.get('/tasks', ensureAuth, ensurePermission('tasks'), async (req, res) => {
  const influencers = await User.find({ role: 'influencer' });
  const taskTypes = res.locals.settings.taskTypes || [];
  const allTasks = influencers.flatMap((influencer) =>
    influencer.tasks.map((task) => ({
      id: task._id,
      title: task.title,
      taskType: task.taskType || 'Görev',
      status: task.status,
      dueDate: task.dueDate,
      influencerId: influencer._id,
      influencerName: influencer.fullName
    }))
  );
  res.render('tasks', { influencers, taskTypes, allTasks });
});

app.post('/tasks/assign', ensureAuth, ensurePermission('tasks'), async (req, res) => {
  const { title, taskType, influencerId, dueDate } = req.body;
  await User.findByIdAndUpdate(influencerId, {
    $push: {
      tasks: {
        title,
        taskType,
        status: 'bekliyor',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completedAt: null
      }
    }
  });
  res.redirect('/tasks');
});

app.post('/tasks/:userId/:taskId/status', ensureAuth, async (req, res) => {
  const { status } = req.body;
  const currentUser = res.locals.currentUser;
  if (currentUser.role === 'influencer' && `${currentUser._id}` !== req.params.userId) {
    return res.status(403).render('not-authorized');
  }
  const completedAt = status === 'tamamlandi' ? new Date() : null;
  await User.updateOne(
    { _id: req.params.userId, 'tasks._id': req.params.taskId },
    { $set: { 'tasks.$.status': status, 'tasks.$.completedAt': completedAt } }
  );
  res.redirect('/');
});

app.post('/tasks/types', ensureAuth, ensurePermission('tasks'), async (req, res) => {
  const { taskTypes } = req.body;
  const list = Array.isArray(taskTypes) ? taskTypes : taskTypes ? [taskTypes] : [];
  const sanitized = list.map((item) => item.trim()).filter(Boolean);
  await Settings.findOneAndUpdate({}, { taskTypes: sanitized }, { upsert: true });
  res.redirect('/tasks');
});

app.get('/ideas', ensureAuth, ensurePermission('ideas'), (req, res) => {
  res.render('ideas');
});

app.get('/reports/performance', ensureAuth, ensurePermission('reporting'), async (req, res) => {
  const influencers = await User.find({ role: 'influencer' });
  const users = await User.find().select('fullName role');
  const tasks = influencers.flatMap((influencer) =>
    influencer.tasks.map((task) => ({
      id: task._id,
      title: task.title,
      taskType: task.taskType || 'Görev',
      status: task.status,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      influencerName: influencer.fullName,
      platforms: influencer.platforms || [],
      assignedTo: task.assignedTo || null
    }))
  );

  res.render('performance', {
    tasks,
    influencers,
    users
  });
});

app.get('/reports/dashboard', ensureAuth, ensurePermission('reporting'), async (req, res) => {
  const influencers = await User.find({ role: 'influencer' });
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const allTasks = influencers.flatMap((influencer) =>
    influencer.tasks.map((task) => ({
      ...task.toObject(),
      influencerName: influencer.fullName,
      platforms: influencer.platforms || []
    }))
  );

  const openTasks = allTasks.filter((task) => task.status !== 'tamamlandi').length;
  const doneThisWeek = allTasks.filter(
    (task) => task.status === 'tamamlandi' && task.dueDate && task.dueDate >= weekStart
  ).length;
  const overdueTasks = allTasks.filter((task) => task.dueDate && task.dueDate < now && task.status !== 'tamamlandi')
    .length;
  const completedTasks = allTasks.filter((task) => task.completedAt && task.createdAt);
  const avgCompletionDays = completedTasks.length
    ? Math.round(
        completedTasks.reduce((sum, task) => sum + (task.completedAt - task.createdAt), 0) /
          (completedTasks.length * 1000 * 60 * 60 * 24)
      )
    : 0;

  const statusDistribution = [
    { name: 'Bekliyor', value: allTasks.filter((task) => task.status === 'bekliyor').length },
    { name: 'Devam Ediyor', value: allTasks.filter((task) => task.status === 'devam_ediyor').length },
    { name: 'Duraklatıldı', value: allTasks.filter((task) => task.status === 'duraklatildi').length },
    { name: 'Tamamlandı', value: allTasks.filter((task) => task.status === 'tamamlandi').length }
  ];

  const last14Days = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (13 - index));
    const label = formatDate(date);
    const count = allTasks.filter(
      (task) => task.status === 'tamamlandi' && task.dueDate && formatDate(task.dueDate) === label
    ).length;
    return { date: label, count };
  });

  const platformNames = ['Instagram', 'TikTok', 'YouTube', 'X'];
  const platformWorkload = platformNames.map((platform) => ({
    platform,
    count: allTasks.filter((task) => task.platforms.includes(platform)).length
  }));

  const influencerCounts = influencers
    .map((influencer) => ({
      influencer: influencer.fullName,
      count: influencer.tasks.length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.render('reports-dashboard', {
    openTasks,
    doneThisWeek,
    overdueTasks,
    avgCompletionDays,
    statusDistribution,
    last14Days,
    platformWorkload,
    influencerCounts
  });
});

app.get('/performance', ensureAuth, ensurePermission('reporting'), (req, res) => {
  res.redirect('/reports/performance');
});

app.get('/settings/general', ensureAuth, ensurePermission('settings'), (req, res) => {
  res.render('settings-general');
});

app.post(
  '/settings/general',
  ensureAuth,
  ensurePermission('settings'),
  upload.single('logoFile'),
  async (req, res) => {
    const { notificationsEnabled } = req.body;
    const update = {
      notificationsEnabled: notificationsEnabled === 'on'
    };
    if (req.file) {
      update.logoUrl = `/uploads/${req.file.filename}`;
    }
    await Settings.findOneAndUpdate({}, update, { upsert: true });
    res.redirect('/settings/general');
  }
);

app.get('/settings/users', ensureAuth, ensurePermission('settings'), async (req, res) => {
  const users = await User.find();
  res.render('settings-users', { users });
});

app.post('/settings/users/permissions', ensureAuth, ensurePermission('settings'), async (req, res) => {
  const { fullName, email, password, role } = req.body;
  res.render('settings-users-permissions', { fullName, email, password, role });
});

app.post('/settings/users/create', ensureAuth, ensurePermission('settings'), async (req, res) => {
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

app.get('/settings/announcement', ensureAuth, ensurePermission('settings'), ensureAdmin, (req, res) => {
  res.render('settings-announcement');
});

app.post(
  '/settings/announcement',
  ensureAuth,
  ensurePermission('settings'),
  ensureAdmin,
  async (req, res) => {
    const { announcementText } = req.body;
    await Settings.findOneAndUpdate({}, { announcementText }, { upsert: true });
    res.redirect('/settings/announcement');
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
