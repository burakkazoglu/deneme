const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.getElementById('sidebar');

if (menuToggle && sidebar) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
  });
}

const calendarElement = document.getElementById('calendar');
const calendarDetailContent = document.getElementById('calendarDetailContent');
const calendarDetailEmpty = document.getElementById('calendarDetailEmpty');
const calendarMonthSelect = document.getElementById('calendarMonth');
const calendarYearSelect = document.getElementById('calendarYear');

const statusLabelMap = {
  bekliyor: 'Bekliyor',
  devam_ediyor: 'Devam Ediyor',
  duraklatildi: 'Duraklatıldı',
  tamamlandi: 'Tamamlandı'
};

const statusIconMap = {
  bekliyor: 'hourglass_empty',
  devam_ediyor: 'play_circle',
  duraklatildi: 'pause_circle',
  tamamlandi: 'check_circle'
};

const statusClassMap = {
  bekliyor: 'pending',
  devam_ediyor: 'in-progress',
  duraklatildi: 'paused',
  tamamlandi: 'done'
};

const statusColorMap = {
  bekliyor: '#f59e0b',
  devam_ediyor: '#3b82f6',
  duraklatildi: '#ef4444',
  tamamlandi: '#22c55e'
};

const formatDateDisplay = (date) => {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const groupTasksByDate = (tasks) =>
  tasks.reduce((acc, task) => {
    if (!task.dueDate) return acc;
    const dateKey = new Date(task.dueDate).toISOString().slice(0, 10);
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(task);
    return acc;
  }, {});

const renderDayDetails = (date, tasks) => {
  if (!calendarDetailContent || !calendarDetailEmpty) return;
  calendarDetailEmpty.style.display = 'none';
  calendarDetailContent.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'calendar-detail__header';
  header.innerHTML = `<strong>${formatDateDisplay(date)}</strong>`;
  calendarDetailContent.appendChild(header);

  if (!tasks || tasks.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Bu gün için görev bulunmuyor.';
    calendarDetailContent.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('div');
    const statusClass = statusClassMap[task.status] || 'pending';
    const statusLabel = statusLabelMap[task.status] || task.status;
    const statusIcon = statusIconMap[task.status] || 'info';
    item.className = 'calendar-detail__item';
    item.innerHTML = `
      <div>
        <strong>${task.title}</strong>
        <div class="task-meta">${task.taskType} • ${task.influencer}</div>
      </div>
      <span class="status status--${statusClass}">
        <span class="material-icons status-icon">${statusIcon}</span>
        ${statusLabel}
      </span>
    `;
    calendarDetailContent.appendChild(item);
  });
};

if (calendarElement && window.calendarTasks && window.FullCalendar) {
  const tasksByDate = groupTasksByDate(window.calendarTasks);
  const events = window.calendarTasks
    .filter((task) => task.dueDate)
    .map((task) => ({
      title: `${task.influencer}: ${task.title}`,
      start: task.dueDate,
      allDay: true,
      extendedProps: task,
      backgroundColor: statusColorMap[task.status] || '#22c55e',
      borderColor: statusColorMap[task.status] || '#22c55e'
    }));

  const calendar = new window.FullCalendar.Calendar(calendarElement, {
    initialView: 'dayGridMonth',
    locale: 'tr',
    events,
    dayCellDidMount(info) {
      const dateKey = info.date.toISOString().slice(0, 10);
      if (tasksByDate[dateKey]) {
        info.el.classList.add('day-has-task');
      }
    },
    dateClick(info) {
      const tasks = tasksByDate[info.dateStr] || [];
      renderDayDetails(info.date, tasks);
    },
    eventClick(info) {
      const dateKey = info.event.startStr.slice(0, 10);
      const tasks = tasksByDate[dateKey] || [];
      renderDayDetails(info.event.start, tasks);
    },
    eventDidMount(info) {
      info.el.removeAttribute('title');
    },
    eventMouseEnter(info) {
      const task = info.event.extendedProps;
      if (!task) return;
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.id = `tooltip-${Date.now()}`;
      tooltip.innerHTML = `
        <strong>${task.title}</strong><br />
        Influencer: ${task.influencer}<br />
        Görev Türü: ${task.taskType}
      `;
      document.body.appendChild(tooltip);
      const rect = info.el.getBoundingClientRect();
      tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 12}px`;
      tooltip.style.left = `${rect.left + window.scrollX}px`;
      info.el.dataset.tooltipId = tooltip.id;
    },
    eventMouseLeave(info) {
      const tooltip = document.getElementById(info.el.dataset.tooltipId);
      if (tooltip) tooltip.remove();
    }
  });

  calendar.render();
  const todayKey = new Date().toISOString().slice(0, 10);
  renderDayDetails(new Date(), tasksByDate[todayKey]);

  if (calendarMonthSelect && calendarYearSelect) {
    const months = [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık'
    ];
    months.forEach((month, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = month;
      calendarMonthSelect.appendChild(option);
    });

    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 3; year <= currentYear + 3; year += 1) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      calendarYearSelect.appendChild(option);
    }

    const updateSelects = () => {
      const date = calendar.getDate();
      calendarMonthSelect.value = date.getMonth();
      calendarYearSelect.value = date.getFullYear();
    };

    updateSelects();
    calendar.on('datesSet', updateSelects);

    const handleDateChange = () => {
      const month = Number(calendarMonthSelect.value);
      const year = Number(calendarYearSelect.value);
      calendar.gotoDate(new Date(year, month, 1));
    };

    calendarMonthSelect.addEventListener('change', handleDateChange);
    calendarYearSelect.addEventListener('change', handleDateChange);
  }
}

const modalTriggers = document.querySelectorAll('[data-modal-target]');
const modalCloseButtons = document.querySelectorAll('[data-modal-close]');
const chipOptions = document.querySelectorAll('.chip-option');
const categoryModal = document.getElementById('categoryModal');
const activeCategoryList = document.getElementById('activeCategoryList');
const inactiveCategoryList = document.getElementById('inactiveCategoryList');
const addCategoryButton = document.getElementById('addCategoryButton');
const newCategoryName = document.getElementById('newCategoryName');
const newCategoryColor = document.getElementById('newCategoryColor');
const saveCategoryChanges = document.getElementById('saveCategoryChanges');
const cancelCategoryChanges = document.getElementById('cancelCategoryChanges');

modalTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const targetId = trigger.dataset.modalTarget;
    const modal = document.getElementById(targetId);
    if (modal) {
      modal.classList.add('is-open');
      modal.dispatchEvent(new CustomEvent('modal:open'));
    }
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal');
    if (modal) modal.classList.remove('is-open');
  });
});

chipOptions.forEach((option) => {
  const input = option.querySelector('.chip-input');
  if (!input) return;
  const toggleSelected = () => {
    option.classList.toggle('is-selected', input.checked);
  };
  toggleSelected();
  input.addEventListener('change', toggleSelected);
});

let categoryState = [];
let originalCategoryState = [];

const renderCategoryList = (listElement, categories, isActive) => {
  listElement.innerHTML = '';
  categories.forEach((category) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.draggable = true;
    item.dataset.id = category.id;
    item.innerHTML = `
      <div class="category-info">
        <span class="category-dot" style="background:${category.color}"></span>
        <span class="category-name">${category.name}</span>
        <span class="category-count">${category.influencerCount || 0}</span>
      </div>
      <button type="button" class="ghost small category-move" data-target="${isActive ? 'inactive' : 'active'}">
        ${isActive ? 'Pasife Al' : 'Aktife Al'}
      </button>
    `;
    listElement.appendChild(item);
  });
};

const filterCategories = () => {
  const active = categoryState.filter((category) => category.isActive);
  const inactive = categoryState.filter((category) => !category.isActive);
  if (activeCategoryList) renderCategoryList(activeCategoryList, active, true);
  if (inactiveCategoryList) renderCategoryList(inactiveCategoryList, inactive, false);
};

const loadCategories = async () => {
  if (!categoryModal) return;
  const response = await fetch('/api/categories');
  const data = await response.json();
  categoryState = data;
  originalCategoryState = data.map((item) => ({ ...item }));
  filterCategories();
};

const moveCategory = (id, makeActive) => {
  categoryState = categoryState.map((category) =>
    category.id === id ? { ...category, isActive: makeActive } : category
  );
  filterCategories();
};

const handleDragStart = (event) => {
  const item = event.target.closest('.category-item');
  if (!item) return;
  event.dataTransfer.setData('text/plain', item.dataset.id);
};

const handleDrop = (event, makeActive) => {
  event.preventDefault();
  const id = event.dataTransfer.getData('text/plain');
  if (id) {
    moveCategory(id, makeActive);
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
};

if (activeCategoryList) {
  activeCategoryList.addEventListener('dragover', handleDragOver);
  activeCategoryList.addEventListener('drop', (event) => handleDrop(event, true));
  activeCategoryList.addEventListener('dragstart', handleDragStart);
}

if (inactiveCategoryList) {
  inactiveCategoryList.addEventListener('dragover', handleDragOver);
  inactiveCategoryList.addEventListener('drop', (event) => handleDrop(event, false));
  inactiveCategoryList.addEventListener('dragstart', handleDragStart);
}

const handleCategoryMoveClick = (event) => {
  const button = event.target.closest('.category-move');
  if (!button) return;
  const item = event.target.closest('.category-item');
  if (!item) return;
  const target = button.dataset.target;
  moveCategory(item.dataset.id, target === 'active');
};

if (categoryModal) {
  categoryModal.addEventListener('click', handleCategoryMoveClick);
}

if (addCategoryButton) {
  addCategoryButton.addEventListener('click', async () => {
    const name = newCategoryName.value.trim();
    if (!name) return;
    const color = newCategoryColor.value || '#3B82F6';
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    if (response.ok) {
      const data = await response.json();
      categoryState.push({
        id: data.id,
        name: data.name,
        color: data.color,
        isActive: true,
        influencerCount: 0
      });
      newCategoryName.value = '';
      filterCategories();
    }
  });
}

if (saveCategoryChanges) {
  saveCategoryChanges.addEventListener('click', async () => {
    const activateIds = categoryState.filter((category) => category.isActive).map((category) => category.id);
    const deactivateIds = categoryState.filter((category) => !category.isActive).map((category) => category.id);
    await fetch('/api/categories/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activateIds, deactivateIds })
    });
    originalCategoryState = categoryState.map((item) => ({ ...item }));
    if (categoryModal) categoryModal.classList.remove('is-open');
  });
}

if (cancelCategoryChanges) {
  cancelCategoryChanges.addEventListener('click', () => {
    categoryState = originalCategoryState.map((item) => ({ ...item }));
    filterCategories();
    if (categoryModal) categoryModal.classList.remove('is-open');
  });
}

if (categoryModal) {
  categoryModal.addEventListener('modal:open', loadCategories);
}

const addTaskTypeButton = document.getElementById('addTaskType');
const taskTypeList = document.getElementById('taskTypeList');

if (addTaskTypeButton && taskTypeList) {
  addTaskTypeButton.addEventListener('click', () => {
    const wrapper = document.createElement('label');
    wrapper.innerHTML = `
      Başlık
      <input type="text" name="taskTypes" placeholder="Yeni başlık" />
    `;
    taskTypeList.appendChild(wrapper);
  });
}
