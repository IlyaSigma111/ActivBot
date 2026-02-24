// ===== КОНФИГУРАЦИЯ БОТА =====
const CONFIG = {
    BOT_TOKEN: '8526725790:AAEu_vqnQ0hcn4gJUstOb2-bTCO7kIalQ7U',
    CHAT_ID: '-1003844776132',
    API_URL: 'https://api.telegram.org/bot'
};

// ===== СОСТОЯНИЕ =====
let messageHistory = [];
let sessionStartTime = new Date();
let messagesCount = 0;
let currentTemplateType = '';

// ===== ШАБЛОНЫ =====
const TEMPLATES = {
    activity: (link = 'ссылку') => 
        `🔥 РЕБЯТА, ПОАКТИВНИЧАЙТЕ!\n\nНам очень важна ваша поддержка под этим постом:\n${link}\n\nЖду реакции и комментарии! 🙏`,

    deadline: (task = 'задание', date = 'завтра') => 
        `⏰ НАПОМИНАНИЕ\n\n${task} нужно сдать до ${date}.\n\nНе откладывайте!`,

    links: (project = 'проекта') => 
        `🔗 СБОР ССЫЛОК\n\nСкидывайте ссылки на работы по ${project}.\n\nФормат: Фамилия - ссылка`,

    congrats: (holiday = 'праздником') => 
        `🎉 ПОЗДРАВЛЯЮ!\n\nС ${holiday}! Желаю успехов, вдохновения и отличного настроения! ✨`,

    urgent: (message = '') => 
        `⚠️ СРОЧНО!\n\n${message}\n\nПрошу всех ознакомиться!`,

    report: (event = 'мероприятия') => 
        `📝 ОТЧЕТ\n\nДелитесь впечатлениями о ${event} в комментариях!`,

    birthday: (name = 'именинника') => 
        `🎂 С ДНЕМ РОЖДЕНИЯ, ${name}!\n\nЖелаем счастья, здоровья, успехов! 🎁🎈`
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('EduBot инициализирован');
    setupEventListeners();
    updateSessionTime();
    loadHistory();
    addToHistory('система готова', 'info');
    
    const tokenDisplay = document.getElementById('botTokenDisplay');
    if (tokenDisplay) {
        tokenDisplay.textContent = `токен: ${CONFIG.BOT_TOKEN.substring(0, 10)}...`;
    }
});

function setupEventListeners() {
    window.onclick = (event) => {
        const modals = ['eventModal', 'pollModal', 'linkModal', 'projectModal', 
                       'taskModal', 'holidayModal', 'birthdayModal', 
                       'reportModal', 'urgentModal'];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (event.target === modal) {
                closeModal(modalId);
            }
        });
    };
}

// ===== РАБОТА С МОДАЛКАМИ =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// ===== ОТКРЫТИЕ МОДАЛОК =====
window.openPollModal = function() { 
    console.log('openPollModal');
    openModal('pollModal'); 
};

window.openEventModal = function() { 
    console.log('openEventModal');
    openModal('eventModal'); 
};

window.openLinkModal = function(type) { 
    console.log('openLinkModal', type);
    currentTemplateType = type; 
    openModal('linkModal'); 
};

window.openProjectModal = function(type) { 
    console.log('openProjectModal', type);
    currentTemplateType = type; 
    openModal('projectModal'); 
};

window.openTaskModal = function() { 
    console.log('openTaskModal');
    openModal('taskModal'); 
};

window.openHolidayModal = function() { 
    console.log('openHolidayModal');
    openModal('holidayModal'); 
};

window.openBirthdayModal = function() { 
    console.log('openBirthdayModal');
    openModal('birthdayModal'); 
};

window.openReportModal = function() { 
    console.log('openReportModal');
    openModal('reportModal'); 
};

window.openUrgentModal = function() { 
    console.log('openUrgentModal');
    openModal('urgentModal'); 
};

// ===== ОБРАБОТЧИКИ МОДАЛОК =====
window.submitLink = function() {
    console.log('submitLink');
    const link = document.getElementById('linkInput').value.trim();
    if (!link) { 
        showStatus('введите ссылку', 'error'); 
        return; 
    }
    document.getElementById('messageText').value = TEMPLATES.activity(link);
    closeModal('linkModal');
    document.getElementById('linkInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitProject = function() {
    console.log('submitProject');
    const project = document.getElementById('projectInput').value.trim();
    const text = project ? TEMPLATES.links(project) : TEMPLATES.links();
    document.getElementById('messageText').value = text;
    closeModal('projectModal');
    document.getElementById('projectInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitTask = function() {
    console.log('submitTask');
    const task = document.getElementById('taskInput').value.trim();
    const date = document.getElementById('dateInput').value.trim();
    if (!task || !date) { 
        showStatus('заполните все поля', 'error'); 
        return; 
    }
    document.getElementById('messageText').value = TEMPLATES.deadline(task, date);
    closeModal('taskModal');
    document.getElementById('taskInput').value = '';
    document.getElementById('dateInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitHoliday = function() {
    console.log('submitHoliday');
    const holiday = document.getElementById('holidayInput').value.trim();
    const text = holiday ? TEMPLATES.congrats(holiday) : TEMPLATES.congrats();
    document.getElementById('messageText').value = text;
    closeModal('holidayModal');
    document.getElementById('holidayInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitBirthday = function() {
    console.log('submitBirthday');
    const name = document.getElementById('nameInput').value.trim();
    const text = name ? TEMPLATES.birthday(name) : TEMPLATES.birthday();
    document.getElementById('messageText').value = text;
    closeModal('birthdayModal');
    document.getElementById('nameInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitReport = function() {
    console.log('submitReport');
    const event = document.getElementById('eventReportInput').value.trim();
    const text = event ? TEMPLATES.report(event) : TEMPLATES.report();
    document.getElementById('messageText').value = text;
    closeModal('reportModal');
    document.getElementById('eventReportInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitUrgent = function() {
    console.log('submitUrgent');
    const text = document.getElementById('urgentText').value.trim();
    if (!text) { 
        showStatus('введите текст', 'error'); 
        return; 
    }
    document.getElementById('messageText').value = TEMPLATES.urgent(text);
    closeModal('urgentModal');
    document.getElementById('urgentText').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

// ===== ПРЯМЫЕ ОБРАБОТЧИКИ ДЛЯ ШАБЛОНОВ =====
window.useTemplate = function(type) {
    console.log('useTemplate', type);
    const textarea = document.getElementById('messageText');
    
    switch(type) {
        case 'activity':
            const link = prompt('Введите ссылку на пост:');
            if (link) textarea.value = TEMPLATES.activity(link);
            break;
        case 'deadline':
            const task = prompt('Какое задание?');
            const date = prompt('Дедлайн?');
            if (task && date) textarea.value = TEMPLATES.deadline(task, date);
            break;
        case 'links':
            const project = prompt('Название проекта?');
            if (project) textarea.value = TEMPLATES.links(project);
            break;
        case 'congrats':
            const holiday = prompt('Какой праздник?');
            if (holiday) textarea.value = TEMPLATES.congrats(holiday);
            break;
        case 'urgent':
            const urgentText = prompt('Текст срочного объявления?');
            if (urgentText) textarea.value = TEMPLATES.urgent(urgentText);
            break;
        case 'report':
            const event = prompt('Название мероприятия?');
            if (event) textarea.value = TEMPLATES.report(event);
            break;
        case 'birthday':
            const name = prompt('Имя именинника?');
            if (name) textarea.value = TEMPLATES.birthday(name);
            break;
    }
};

// ===== УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ОТПРАВКИ =====
async function sendToTelegram(method, params) {
    const url = `${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/${method}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.CHAT_ID,
                ...params
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return { ok: false, description: error.message };
    }
}

// ===== ОТПРАВКА МЕРОПРИЯТИЯ С ОПРОСОМ =====
window.sendEventPoll = async function() {
    console.log('sendEventPoll');
    const name = document.getElementById('eventName').value.trim();
    const date = document.getElementById('eventDate').value.trim();
    const time = document.getElementById('eventTime').value.trim();
    const place = document.getElementById('eventPlace').value.trim();
    const dresscode = document.getElementById('eventDresscode').value.trim();
    const bring = document.getElementById('eventBring').value.trim();
    
    if (!name || !date || !time) {
        showStatus('заполните название, дату и время', 'error');
        return;
    }
    
    const infoMessage = 
        `🎪 МЕРОПРИЯТИЕ: ${name}\n\n` +
        `📅 Дата: ${date}\n` +
        `⏰ Время: ${time}\n` +
        `📍 Место: ${place || 'не указано'}\n\n` +
        `👔 Дресс-код: ${dresscode || 'любой'}\n` +
        `🎒 С собой: ${bring || 'ничего'}\n\n` +
        `👇 ОПРОС НИЖЕ 👇`;
    
    showStatus('⏳ Отправка...', 'info', true);
    
    const textResult = await sendToTelegram('sendMessage', { text: infoMessage });
    
    if (!textResult.ok) {
        showStatus(`✗ Ошибка: ${textResult.description}`, 'error');
        return;
    }
    
    const pollResult = await sendToTelegram('sendPoll', {
        question: `Кто идет на "${name}"?`,
        options: ["✅ Пойду", "🤔 Не уверен", "❌ Не пойду"],
        is_anonymous: false
    });
    
    if (pollResult.ok) {
        messagesCount++;
        document.getElementById('messagesCount').textContent = messagesCount;
        showStatus('✓ мероприятие и опрос отправлены', 'success');
        addToHistory(`мероприятие: ${name}`, 'success');
        closeModal('eventModal');
        
        document.getElementById('eventName').value = '';
        document.getElementById('eventDate').value = '';
        document.getElementById('eventTime').value = '';
        document.getElementById('eventPlace').value = '';
        document.getElementById('eventDresscode').value = '';
        document.getElementById('eventBring').value = '';
    } else {
        showStatus(`✗ ошибка опроса: ${pollResult.description}`, 'error');
    }
};

// ===== ОТПРАВКА ОПРОСА =====
window.sendNativePoll = async function() {
    console.log('sendNativePoll');
    const question = document.getElementById('pollQuestion').value.trim();
    if (!question) {
        showStatus('введите вопрос', 'error');
        return;
    }
    
    showStatus('⏳ Создание опроса...', 'info', true);
    
    const result = await sendToTelegram('sendPoll', {
        question: question,
        options: ["✅ Пойду", "🤔 Не уверен", "❌ Не пойду"],
        is_anonymous: false
    });
    
    if (result.ok) {
        messagesCount++;
        document.getElementById('messagesCount').textContent = messagesCount;
        showStatus('✓ опрос создан', 'success');
        addToHistory('опрос', 'success');
        closeModal('pollModal');
        document.getElementById('pollQuestion').value = '';
    } else {
        showStatus(`✗ ошибка: ${result.description}`, 'error');
    }
};

// ===== БЫСТРЫЙ ОПРОС =====
window.sendQuickPoll = async function() {
    console.log('sendQuickPoll');
    showStatus('⏳ Создание опроса...', 'info', true);
    
    const result = await sendToTelegram('sendPoll', {
        question: "Кто идет на мероприятие?",
        options: ["✅ Пойду", "🤔 Не уверен", "❌ Не пойду"],
        is_anonymous: false
    });
    
    if (result.ok) {
        messagesCount++;
        document.getElementById('messagesCount').textContent = messagesCount;
        showStatus('✓ опрос создан', 'success');
        addToHistory('быстрый опрос', 'success');
    } else {
        showStatus(`✗ ошибка: ${result.description}`, 'error');
    }
};

// ===== ТОЛЬКО ТЕКСТ МЕРОПРИЯТИЯ =====
window.createEventInvite = function() {
    console.log('createEventInvite');
    const name = document.getElementById('eventName').value.trim();
    const date = document.getElementById('eventDate').value.trim();
    const time = document.getElementById('eventTime').value.trim();
    const place = document.getElementById('eventPlace').value.trim();
    const dresscode = document.getElementById('eventDresscode').value.trim();
    const bring = document.getElementById('eventBring').value.trim();
    
    if (!name || !date || !time) {
        showStatus('заполните название, дату и время', 'error');
        return;
    }
    
    const message = 
        `🎪 ПРИГЛАШЕНИЕ\n\n` +
        `📌 ${name}\n` +
        `📅 ${date} | ${time}\n` +
        `📍 ${place || 'не указано'}\n\n` +
        `👔 ${dresscode || 'любая одежда'}\n` +
        `🎒 ${bring || 'ничего'}\n\n` +
        `Ждем всех! ✨`;
    
    document.getElementById('messageText').value = message;
    closeModal('eventModal');
    
    document.getElementById('eventName').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventPlace').value = '';
    document.getElementById('eventDresscode').value = '';
    document.getElementById('eventBring').value = '';
    
    showStatus('✓ текст мероприятия создан', 'success');
};

// ===== ОТПРАВКА ОБЫЧНОГО СООБЩЕНИЯ =====
window.sendMessage = async function() {
    console.log('sendMessage');
    const message = document.getElementById('messageText').value.trim();
    
    if (!message || /^[\s.]+$/.test(message)) {
        showStatus('нельзя отправить пустое сообщение', 'error');
        return;
    }
    
    showStatus('⏳ Отправка...', 'info', true);
    
    const result = await sendToTelegram('sendMessage', { text: message });
    
    if (result.ok) {
        messagesCount++;
        document.getElementById('messagesCount').textContent = messagesCount;
        showStatus('✓ отправлено', 'success');
        addToHistory(message, 'success');
        document.getElementById('messageText').value = '';
    } else {
        showStatus(`✗ ошибка: ${result.description}`, 'error');
    }
};

// ===== КОПИРОВАТЬ =====
window.copyToClipboard = function() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) { 
        showStatus('нечего копировать', 'error'); 
        return; 
    }
    navigator.clipboard.writeText(message).then(() => showStatus('✓ скопировано', 'success'));
};

// ===== ИСТОРИЯ =====
function addToHistory(text, type = 'info') {
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    messageHistory.unshift({ text: text.length > 40 ? text.substring(0, 40) + '…' : text, time, type });
    if (messageHistory.length > 20) messageHistory.pop();
    updateHistory();
    saveHistory();
}

function updateHistory() {
    const list = document.getElementById('historyList');
    const count = document.getElementById('historyCount');
    if (!list) return;
    
    if (messageHistory.length === 0) {
        list.innerHTML = '<div class="history-empty"><i class="fas fa-terminal"></i><p>нет записей</p></div>';
        if (count) count.textContent = '0';
        return;
    }
    
    if (count) count.textContent = messageHistory.length;
    
    let html = '';
    messageHistory.forEach(item => {
        html += `<div class="history-item"><span>${item.text}</span><span class="history-item-time">${item.time}</span></div>`;
    });
    list.innerHTML = html;
}

function saveHistory() { localStorage.setItem('edubot_history', JSON.stringify(messageHistory)); }

function loadHistory() {
    const saved = localStorage.getItem('edubot_history');
    if (saved) { try { messageHistory = JSON.parse(saved); updateHistory(); } catch (e) {} }
}

window.clearHistory = function() {
    if (confirm('Очистить историю?')) { 
        messageHistory = []; 
        updateHistory(); 
        saveHistory(); 
        showStatus('✓ история очищена', 'info'); 
    }
};

window.exportHistory = function() {
    if (messageHistory.length === 0) { 
        showStatus('история пуста', 'error'); 
        return; 
    }
    const data = JSON.stringify(messageHistory, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edubot_history_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('✓ история экспортирована', 'success');
};

// ===== РЕДАКТОР =====
window.clearEditor = function() {
    document.getElementById('messageText').value = '';
    showStatus('✓ редактор очищен', 'info');
};

// ===== СТАТУСЫ =====
function showStatus(message, type = 'info', keep = false) {
    const status = document.getElementById('messageStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = `status-line ${type}`;
    status.classList.remove('hidden');
    
    if (!keep) {
        setTimeout(() => status.classList.add('hidden'), 3000);
    }
}

// ===== ВРЕМЯ СЕССИИ =====
function updateSessionTime() {
    setInterval(() => {
        const diff = Math.floor((new Date() - sessionStartTime) / 1000);
        const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const sessionElement = document.getElementById('sessionTime');
        if (sessionElement) {
            sessionElement.textContent = `${hours}:${minutes}`;
        }
    }, 1000);
}
