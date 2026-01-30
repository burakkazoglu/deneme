const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.getElementById('sidebar');

if (menuToggle && sidebar) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
  });
}

const calendarGrid = document.getElementById('calendarGrid');
const calendarTitle = document.getElementById('calendarTitle');
const calendarSubtitle = document.getElementById('calendarSubtitle');
const calendarDetailContent = document.getElementById('calendarDetailContent');
const calendarDetailEmpty = document.getElementById('calendarDetailEmpty');
const calendarNavButtons = document.querySelectorAll('.calendar-nav');

const formatDateKey = (date) => {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
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
    const dateKey = formatDateKey(new Date(task.dueDate));
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(task);
    return acc;
  }, {});

const renderCalendar = (currentDate, tasks) => {
  if (!calendarGrid) return;
  calendarGrid.innerHTML = '';
  const tasksByDate = groupTasksByDate(tasks || []);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay() || 7;
  const totalCells = endOfMonth.getDate() + (startDay - 1);
  const weeks = Math.ceil(totalCells / 7);

  const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  if (calendarTitle) calendarTitle.textContent = monthName;
  if (calendarSubtitle) calendarSubtitle.textContent = 'Görev planı';

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  dayNames.forEach((day) => {
    const header = document.createElement('div');
    header.className = 'calendar-cell calendar-cell--header';
    header.textContent = day;
    calendarGrid.appendChild(header);
  });

  let dayCounter = 1;
  for (let week = 0; week < weeks; week += 1) {
    for (let day = 1; day <= 7; day += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'calendar-cell';
      if (week === 0 && day < startDay) {
        cell.classList.add('calendar-cell--empty');
      } else if (dayCounter > endOfMonth.getDate()) {
        cell.classList.add('calendar-cell--empty');
      } else {
        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayCounter);
        const dateKey = formatDateKey(cellDate);
        const dayTasks = tasksByDate[dateKey] || [];
        cell.dataset.dateKey = dateKey;
        cell.textContent = dayCounter;
        if (dayTasks.length > 0) {
          cell.classList.add('calendar-cell--has-task');
          const tooltip = dayTasks
            .map((task) => `${task.influencer}: ${task.title}`)
            .join(' • ');
          cell.title = tooltip;
        }
        cell.addEventListener('click', () => {
          renderDayDetails(cellDate, dayTasks);
        });
        dayCounter += 1;
      }
      calendarGrid.appendChild(cell);
    }
  }
};

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
    item.className = 'calendar-detail__item';
    item.innerHTML = `
      <div>
        <strong>${task.title}</strong>
        <div class="task-meta">${task.taskType} • ${task.influencer}</div>
      </div>
      <span class="status status--${task.status}">${task.status}</span>
    `;
    calendarDetailContent.appendChild(item);
  });
};

if (calendarGrid && window.calendarTasks) {
  let activeDate = new Date();
  renderCalendar(activeDate, window.calendarTasks);
  renderDayDetails(activeDate, groupTasksByDate(window.calendarTasks)[formatDateKey(activeDate)]);

  calendarNavButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const direction = button.dataset.direction;
      activeDate = new Date(activeDate.getFullYear(), activeDate.getMonth() + (direction === 'next' ? 1 : -1), 1);
      renderCalendar(activeDate, window.calendarTasks);
    });
  });
}

const modalTriggers = document.querySelectorAll('[data-modal-target]');
const modalCloseButtons = document.querySelectorAll('[data-modal-close]');

modalTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const targetId = trigger.dataset.modalTarget;
    const modal = document.getElementById(targetId);
    if (modal) {
      modal.classList.add('is-open');
    }
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal');
    if (modal) modal.classList.remove('is-open');
  });
});

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
