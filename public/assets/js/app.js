const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.getElementById('sidebar');

if (menuToggle && sidebar) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
  });
}

const taskDateInput = document.querySelector('.js-task-date');
if (taskDateInput && window.flatpickr) {
  window.flatpickr(taskDateInput, {
    dateFormat: 'm/d/Y',
    locale: window.flatpickr.l10ns && window.flatpickr.l10ns.tr ? 'tr' : undefined,
    allowInput: true
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
    empty.textContent = 'Bugün için görev bulunmuyor.';
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
        <div class="task-meta">${task.taskType} â€¢ ${task.influencer}</div>
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
        ${task.title}<br />
        <strong>Influencer:</strong> ${task.influencer}<br />
        <strong>Görev Türü:</strong> ${task.taskType}
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
const newCategoryHelper = document.getElementById('newCategoryHelper');
const newCategoryColorPreview = document.getElementById('newCategoryColorPreview');
const openColorPicker = document.getElementById('openColorPicker');
const colorPickerDialog = document.getElementById('colorPickerDialog');
const colorPickerInput = document.getElementById('colorPickerInput');
const colorSwatchGrid = document.getElementById('colorSwatchGrid');
const openCustomColor = document.getElementById('openCustomColor');
const colorPickerPreview = document.getElementById('colorPickerPreview');
const saveColorPick = document.getElementById('saveColorPick');
const cancelColorPick = document.getElementById('cancelColorPick');
const saveCategoryChanges = document.getElementById('saveCategoryChanges');
const cancelCategoryChanges = document.getElementById('cancelCategoryChanges');
const categorySelect = document.getElementById('categorySelect');
const taskTypeModal = document.getElementById('taskTypeModal');
const activeTaskTypeList = document.getElementById('activeTaskTypeList');
const inactiveTaskTypeList = document.getElementById('inactiveTaskTypeList');
const addTaskTypeButton = document.getElementById('addTaskTypeButton');
const newTaskTypeName = document.getElementById('newTaskTypeName');
const newTaskTypeHelper = document.getElementById('newTaskTypeHelper');
const saveTaskTypeChanges = document.getElementById('saveTaskTypeChanges');
const cancelTaskTypeChanges = document.getElementById('cancelTaskTypeChanges');
const taskTypeSelect =
  document.getElementById('taskTypeSelect') || document.querySelector('select[name="taskType"]');
const deleteTaskForms = document.querySelectorAll('.js-delete-task');
const deleteTaskModal = document.getElementById('deleteTaskModal');
const cancelDeleteTask = document.getElementById('cancelDeleteTask');
const confirmDeleteTask = document.getElementById('confirmDeleteTask');
let pendingDeleteForm = null;

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

if (deleteTaskModal && deleteTaskForms.length > 0) {
  deleteTaskForms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      pendingDeleteForm = form;
      deleteTaskModal.classList.add('is-open');
    });
  });
}

if (cancelDeleteTask && deleteTaskModal) {
  cancelDeleteTask.addEventListener('click', () => {
    pendingDeleteForm = null;
    deleteTaskModal.classList.remove('is-open');
  });
}

if (confirmDeleteTask && deleteTaskModal) {
  confirmDeleteTask.addEventListener('click', () => {
    if (pendingDeleteForm) pendingDeleteForm.submit();
  });
}

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
let activeCategoriesState = [];
let draftCategoryColor = newCategoryColor ? newCategoryColor.value : '#3B82F6';
let taskTypeState = [];
let originalTaskTypeState = [];
const swatchButtons = colorSwatchGrid
  ? Array.from(colorSwatchGrid.querySelectorAll('.color-swatch-button'))
  : [];

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

const renderTaskTypeList = (listElement, items, isActive) => {
  listElement.innerHTML = '';
  items.forEach((item) => {
    const itemKey = item.id || item.name;
    const row = document.createElement('div');
    row.className = 'category-item';
    row.draggable = true;
    row.dataset.key = itemKey;
    row.innerHTML = `
      <div class="category-info">
        <span class="category-name">${item.name}</span>
      </div>
      <button type="button" class="ghost small task-type-move" data-target="${isActive ? 'inactive' : 'active'}">
        ${isActive ? 'Pasife Al' : 'Aktife Al'}
      </button>
    `;
    listElement.appendChild(row);
  });
};

const filterCategories = () => {
  const active = categoryState.filter((category) => category.isActive);
  const inactive = categoryState.filter((category) => !category.isActive);
  if (activeCategoryList) renderCategoryList(activeCategoryList, active, true);
  if (inactiveCategoryList) renderCategoryList(inactiveCategoryList, inactive, false);
};

const filterTaskTypes = () => {
  const active = taskTypeState.filter((item) => item.isActive);
  const inactive = taskTypeState.filter((item) => !item.isActive);
  if (activeTaskTypeList) renderTaskTypeList(activeTaskTypeList, active, true);
  if (inactiveTaskTypeList) renderTaskTypeList(inactiveTaskTypeList, inactive, false);
};

const renderTaskTypeOptions = (selectedName) => {
  if (!taskTypeSelect || taskTypeState.length === 0) return;
  const active = taskTypeState.filter((item) => item.isActive !== false);
  const currentValue = selectedName || taskTypeSelect.value;
  taskTypeSelect.innerHTML = '';
  active.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = item.name;
    taskTypeSelect.appendChild(option);
  });
  if (currentValue) {
    taskTypeSelect.value = currentValue;
  }
};

const loadCategories = async () => {
  if (!categoryModal) return;
  const response = await fetch('/api/categories');
  const data = await response.json();
  categoryState = data;
  originalCategoryState = data.map((item) => ({ ...item }));
  if (newCategoryHelper) newCategoryHelper.textContent = '';
  filterCategories();
};

const loadTaskTypes = async () => {
  if (!taskTypeModal) return;
  const response = await fetch('/api/task-types');
  const data = await response.json();
  taskTypeState = data.map((item) => ({ ...item, isActive: item.isActive !== false }));
  originalTaskTypeState = taskTypeState.map((item) => ({ ...item }));
  if (newTaskTypeHelper) newTaskTypeHelper.textContent = '';
  filterTaskTypes();
  renderTaskTypeOptions();
};

const renderCategoryOptions = (selectedName) => {
  if (!categorySelect) return;
  const currentValue = selectedName || categorySelect.value;
  categorySelect.innerHTML = '<option value="">Seçiniz</option>';
  activeCategoriesState.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
  if (currentValue) {
    categorySelect.value = currentValue;
  }
};

const refreshActiveCategories = async ({ selectedName } = {}) => {
  if (!categorySelect) return;
  const response = await fetch('/api/categories?activeOnly=true');
  const data = await response.json();
  activeCategoriesState = data;
  renderCategoryOptions(selectedName);
};

const moveCategory = (id, makeActive) => {
  categoryState = categoryState.map((category) =>
    category.id === id ? { ...category, isActive: makeActive } : category
  );
  filterCategories();
};

const moveTaskType = (id, makeActive) => {
  taskTypeState = taskTypeState.map((item) =>
    (item.id || item.name) === id ? { ...item, isActive: makeActive } : item
  );
  filterTaskTypes();
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

const handleTaskTypeDragStart = (event) => {
  const item = event.target.closest('.category-item');
  if (!item) return;
  event.dataTransfer.setData('text/plain', item.dataset.key);
};

const handleTaskTypeDrop = (event, makeActive) => {
  event.preventDefault();
  const id = event.dataTransfer.getData('text/plain');
  if (id) {
    moveTaskType(id, makeActive);
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

if (activeTaskTypeList) {
  activeTaskTypeList.addEventListener('dragover', handleDragOver);
  activeTaskTypeList.addEventListener('drop', (event) => handleTaskTypeDrop(event, true));
  activeTaskTypeList.addEventListener('dragstart', handleTaskTypeDragStart);
}

if (inactiveTaskTypeList) {
  inactiveTaskTypeList.addEventListener('dragover', handleDragOver);
  inactiveTaskTypeList.addEventListener('drop', (event) => handleTaskTypeDrop(event, false));
  inactiveTaskTypeList.addEventListener('dragstart', handleTaskTypeDragStart);
}

const handleCategoryMoveClick = (event) => {
  const button = event.target.closest('.category-move');
  if (!button) return;
  const item = event.target.closest('.category-item');
  if (!item) return;
  const target = button.dataset.target;
  moveCategory(item.dataset.id, target === 'active');
};

const handleTaskTypeMoveClick = (event) => {
  const button = event.target.closest('.task-type-move');
  if (!button) return;
  const item = event.target.closest('.category-item');
  if (!item) return;
  const target = button.dataset.target;
  moveTaskType(item.dataset.key, target === 'active');
};

if (categoryModal) {
  categoryModal.addEventListener('click', handleCategoryMoveClick);
}

if (taskTypeModal) {
  taskTypeModal.addEventListener('click', handleTaskTypeMoveClick);
}

if (addCategoryButton) {
  addCategoryButton.addEventListener('click', async () => {
    const name = newCategoryName.value.trim();
    if (!name) {
      if (newCategoryHelper) newCategoryHelper.textContent = 'Kategori adı zorunludur.';
      return;
    }
    const exists = categoryState.some(
      (category) => category.name && category.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      if (newCategoryHelper) newCategoryHelper.textContent = 'Bu kategori zaten mevcut.';
      return;
    }
    const color = newCategoryColor.value || '#3B82F6';
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    if (response.ok) {
      const data = await response.json();
      if (newCategoryHelper) newCategoryHelper.textContent = '';
      categoryState.push({
        id: data.id,
        name: data.name,
        color: data.color,
        isActive: true,
        influencerCount: 0
      });
      newCategoryName.value = '';
      filterCategories();
      await refreshActiveCategories({ selectedName: data.name });
    } else if (response.status === 409) {
      if (newCategoryHelper) newCategoryHelper.textContent = 'Bu kategori zaten mevcut.';
    }
  });
}

if (addTaskTypeButton) {
  addTaskTypeButton.addEventListener('click', async () => {
    const name = newTaskTypeName ? newTaskTypeName.value.trim() : '';
    if (!name) {
      if (newTaskTypeHelper) newTaskTypeHelper.textContent = 'Başlık adı zorunludur.';
      return;
    }
    const exists = taskTypeState.some(
      (item) => item.name && item.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      if (newTaskTypeHelper) newTaskTypeHelper.textContent = 'Başlık zaten mevcut.';
      return;
    }
    const response = await fetch('/api/task-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (response.ok) {
      const data = await response.json();
      if (newTaskTypeHelper) newTaskTypeHelper.textContent = '';
      taskTypeState.push({ ...data, isActive: true });
      if (newTaskTypeName) newTaskTypeName.value = '';
      filterTaskTypes();
      renderTaskTypeOptions(data.name);
    } else if (response.status === 409) {
      if (newTaskTypeHelper) newTaskTypeHelper.textContent = 'Başlık zaten mevcut.';
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
    await refreshActiveCategories();
    if (categoryModal) categoryModal.classList.remove('is-open');
  });
}

if (saveTaskTypeChanges) {
  saveTaskTypeChanges.addEventListener('click', async () => {
    const activateIds = taskTypeState
      .filter((item) => item.isActive)
      .map((item) => item.id || item.name);
    const deactivateIds = taskTypeState
      .filter((item) => !item.isActive)
      .map((item) => item.id || item.name);
    await fetch('/api/task-types/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activateIds, deactivateIds })
    });
    originalTaskTypeState = taskTypeState.map((item) => ({ ...item }));
    renderTaskTypeOptions();
    if (taskTypeModal) taskTypeModal.classList.remove('is-open');
  });
}

if (cancelCategoryChanges) {
  cancelCategoryChanges.addEventListener('click', () => {
    categoryState = originalCategoryState.map((item) => ({ ...item }));
    filterCategories();
    if (categoryModal) categoryModal.classList.remove('is-open');
  });
}

if (cancelTaskTypeChanges) {
  cancelTaskTypeChanges.addEventListener('click', () => {
    taskTypeState = originalTaskTypeState.map((item) => ({ ...item }));
    filterTaskTypes();
    if (taskTypeModal) taskTypeModal.classList.remove('is-open');
  });
}

if (categoryModal) {
  categoryModal.addEventListener('modal:open', loadCategories);
}

if (taskTypeModal) {
  taskTypeModal.addEventListener('modal:open', loadTaskTypes);
}

if (newCategoryName) {
  newCategoryName.addEventListener('input', () => {
    if (newCategoryHelper) newCategoryHelper.textContent = '';
  });
}

if (newTaskTypeName) {
  newTaskTypeName.addEventListener('input', () => {
    if (newTaskTypeHelper) newTaskTypeHelper.textContent = '';
  });
}

const openColorDialog = () => {
  if (!colorPickerDialog) return;
  draftCategoryColor = newCategoryColor ? newCategoryColor.value : '#3B82F6';
  if (colorPickerInput) colorPickerInput.value = draftCategoryColor;
  if (colorPickerPreview) colorPickerPreview.style.background = draftCategoryColor;
  swatchButtons.forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.color === draftCategoryColor);
  });
  colorPickerDialog.classList.add('is-open');
  colorPickerDialog.setAttribute('aria-hidden', 'false');
};

const closeColorDialog = () => {
  if (!colorPickerDialog) return;
  colorPickerDialog.classList.remove('is-open');
  colorPickerDialog.setAttribute('aria-hidden', 'true');
};

if (openColorPicker) {
  openColorPicker.addEventListener('click', openColorDialog);
}

if (openCustomColor && colorPickerInput) {
  openCustomColor.addEventListener('click', () => {
    colorPickerInput.click();
  });
}

if (swatchButtons.length > 0) {
  swatchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      draftCategoryColor = button.dataset.color;
      if (colorPickerPreview) colorPickerPreview.style.background = draftCategoryColor;
      swatchButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
    });
  });
}

if (colorPickerInput) {
  colorPickerInput.addEventListener('input', (event) => {
    draftCategoryColor = event.target.value;
    if (colorPickerPreview) colorPickerPreview.style.background = draftCategoryColor;
    swatchButtons.forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.color === draftCategoryColor);
    });
  });
}

if (saveColorPick) {
  saveColorPick.addEventListener('click', () => {
    if (newCategoryColor) newCategoryColor.value = draftCategoryColor;
    if (newCategoryColorPreview) newCategoryColorPreview.style.background = draftCategoryColor;
    closeColorDialog();
  });
}

if (cancelColorPick) {
  cancelColorPick.addEventListener('click', closeColorDialog);
}

if (colorPickerDialog) {
  colorPickerDialog.addEventListener('click', (event) => {
    if (event.target === colorPickerDialog) {
      closeColorDialog();
    }
  });
}

if (newCategoryColorPreview && newCategoryColor) {
  newCategoryColorPreview.style.background = newCategoryColor.value || '#3B82F6';
}

if (categorySelect) {
  refreshActiveCategories();
}


