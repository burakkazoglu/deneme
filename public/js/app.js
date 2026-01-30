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
      const task = info.event.extendedProps;
      if (task && task.influencer) {
        info.el.title = `${task.influencer}: ${task.title}`;
      }
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
