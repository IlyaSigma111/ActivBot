// ===== КОНФИГУРАЦИЯ БОТА =====
const CONFIG = {
    BOT_TOKEN: '8526725790:AAEu_vqnQ0hcn4gJUstOb2-bTCO7kIalQ7U',
    TEST_GROUP: '-5169688120',
    API_URL: 'https://api.telegram.org/bot'
};

// ===== СОСТОЯНИЕ =====
let messageHistory = [];
let sessionStartTime = new Date();
let messagesCount = 0;
let currentTemplateType = '';

// ===== ШАБЛОНЫ =====
const TEMPLATES = {
    activity: (link = '[ссылка]') => 
        `🔥 РЕБЯТА, ПОАКТИВНИЧАЙТЕ!\n\nНам очень важна ваша поддержка под этим постом:\n${link}\n\nЖду реакции и комментарии! 🙏`,

    deadlineSimple: (task = 'задание', date = 'завтра') => 
        `⏰ НАПОМИНАНИЕ\n\n${task} нужно сдать до ${date}.\n\nНе откладывайте!`,

    linksSimple: (project = 'проекта') => 
        `🔗 СБОР ССЫЛОК\n\nСкидывайте в комментарии ссылки на работы по ${project}.\n\nФормат: Фамилия - ссылка`,

    congrats: (holiday = 'праздником') => 
        `🎉 ПОЗДРАВЛЯЮ!\n\nС ${holiday}! Желаю успехов, вдохновения и отличного настроения! ✨`,

    urgent: (message = '') => 
        `⚠️ СРОЧНО!\n\n${message}\n\nПрошу всех ознакомиться!`,

    report: (event = 'мероприятия') => 
        `📝 ОТЧЕТ О МЕРОПРИЯТИИ\n\nДелитесь впечатлениями о ${event} в комментариях!\n\nЧто понравилось? Что можно улучшить?`,

    birthday: (name = 'именинника') => 
        `🎂 С ДНЕМ РОЖДЕНИЯ, ${name}!\n\nЖелаем счастья, здоровья, успехов в учебе и отличного настроения! 🎁🎈`
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
    const groupSelector = document.getElementById('groupSelector');
    const customInput = document.getElementById('customGroupInput');
    
    if (groupSelector) {
        groupSelector.addEventListener('change', function() {
            if (this.value === 'custom') {
                customInput.classList.remove('hidden');
            } else {
                customInput.classList.add('hidden');
            }
        });
    }
    
    window.onclick = (event) => {
        const modals = ['eventModal', 'pollModal', 'linkModal', 'projectModal', 
                       'taskModal', 'simpleTaskModal', 'holidayModal', 
                       'birthdayModal', 'reportModal', 'urgentModal'];
        
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
    openModal('pollModal'); 
};

window.openEventModal = function() { 
    openModal('eventModal'); 
};

window.openLinkModal = function(type) { 
    currentTemplateType = type; 
    openModal('linkModal'); 
};

window.openProjectModal = function(type) { 
    currentTemplateType = type; 
    openModal('projectModal'); 
};

window.openTaskModal = function() { 
    openModal('taskModal'); 
};

window.openSimpleTaskModal = function() { 
    openModal('simpleTaskModal'); 
};

window.openHolidayModal = function() { 
    openModal('holidayModal'); 
};

window.openBirthdayModal = function() { 
    openModal('birthdayModal'); 
};

window.openReportModal = function() { 
    openModal('reportModal'); 
};

window.openUrgentModal = function() { 
    openModal('urgentModal'); 
};

// ===== ОБРАБОТЧИКИ МОДАЛОК =====
window.submitLink = function() {
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
    const project = document.getElementById('projectInput').value.trim();
    const textarea = document.getElementById('messageText');
    
    if (currentTemplateType === 'links') {
        if (!project) { 
            showStatus('введите название проекта', 'error'); 
            return; 
        }
        textarea.value = `🔗 СБОР ССЫЛОК\n\nСкидывайте ссылки на работы по ${project}.\n\nФормат: Фамилия - ссылка`;
    } else if (currentTemplateType === 'links_simple') {
        textarea.value = TEMPLATES.linksSimple(project || 'проекта');
    }
    
    closeModal('projectModal');
    document.getElementById('projectInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitTask = function() {
    const task = document.getElementById('taskInput').value.trim();
    const date = document.getElementById('dateInput').value.trim();
    if (!task || !date) { 
        showStatus('заполните все поля', 'error'); 
        return; 
    }
    document.getElementById('messageText').value = `⏰ НАПОМИНАНИЕ\n\n${task} нужно сдать до ${date}.\n\nПодтвердите, что приняли информацию:`;
    closeModal('taskModal');
    document.getElementById('taskInput').value = '';
    document.getElementById('dateInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitSimpleTask = function() {
    const task = document.getElementById('simpleTaskInput').value.trim();
    const date = document.getElementById('simpleDateInput').value.trim();
    document.getElementById('messageText').value = TEMPLATES.deadlineSimple(task || 'задание', date || 'завтра');
    closeModal('simpleTaskModal');
    document.getElementById('simpleTaskInput').value = '';
    document.getElementById('simpleDateInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitHoliday = function() {
    const holiday = document.getElementById('holidayInput').value.trim();
    document.getElementById('messageText').value = TEMPLATES.congrats(holiday || 'праздником');
    closeModal('holidayModal');
    document.getElementById('holidayInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitBirthday = function() {
    const name = document.getElementById('nameInput').value.trim();
    document.getElementById('messageText').value = TEMPLATES.birthday(name || 'Друг');
    closeModal('birthdayModal');
    document.getElementById('nameInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitReport = function() {
    const event = document.getElementById('eventReportInput').value.trim();
    document.getElementById('messageText').value = TEMPLATES.report(event || 'мероприятия');
    closeModal('reportModal');
    document.getElementById('eventReportInput').value = '';
    showStatus('✓ шаблон вставлен', 'success');
};

window.submitUrgent = function() {
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

// ===== ОТПРАВКА МЕРОПРИЯТИЯ С ОПРОСОМ (СВЯЗНОЕ СООБЩЕНИЕ) =====
window.sendEventPoll = async function() {
    console.log('sendEventPoll');
    
    const name = document.getElementById('eventName').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const place = document.getElementById('eventPlace').value;
    const dresscode = document.getElementById('eventDresscode').value;
    const bring = document.getElementById('eventBring').value;
    
    if (!name || !date || !time) {
        showStatus('заполните название, дату и время', 'error');
        return;
    }
    
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    // Формируем красивое сообщение с рамкой
    const infoMessage = 
        `╔════════════════════════════╗\n` +
        `║         🎪 МЕРОПРИЯТИЕ       ║\n` +
        `╚════════════════════════════╝\n\n` +
        `📌 <b>${name}</b>\n\n` +
        `📅 Дата: ${date}\n` +
        `⏰ Время: ${time}\n` +
        `📍 Место: ${place || 'не указано'}\n\n` +
        `👔 Дресс-код: ${dresscode || 'любой'}\n` +
        `🎒 С собой: ${bring || 'ничего'}\n\n` +
        `─────────────────────────────\n` +
        `👇 <b>ОПРОС НИЖЕ 👇</b>`;
    
    try {
        // Отправляем информацию о мероприятии
        await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: infoMessage,
                parse_mode: 'HTML'
            })
        });
        
        // Отправляем опрос с вопросом, привязанным к мероприятию
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendPoll`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                question: `❓ Кто идет на "${name}"?`,
                options: ["✅ Пойду", "🤔 Не уверен", "❌ Не пойду"],
                is_anonymous: false,
                allows_multiple_answers: false
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✓ мероприятие и опрос отправлены', 'success');
            addToHistory(`мероприятие: ${name} с опросом`, 'success');
            closeModal('eventModal');
            
            // Очищаем поля
            document.getElementById('eventName').value = '';
            document.getElementById('eventDate').value = '';
            document.getElementById('eventTime').value = '';
            document.getElementById('eventPlace').value = '';
            document.getElementById('eventDresscode').value = '';
            document.getElementById('eventBring').value = '';
        } else {
            showStatus(`✗ ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatus(`✗ ошибка: ${error.message}`, 'error');
    }
};

// ===== ОТПРАВКА РОДНОГО ОПРОСА =====
window.sendNativePoll = async function() {
    console.log('sendNativePoll');
    const question = document.getElementById('pollQuestion').value.trim();
    if (!question) {
        showStatus('введите вопрос', 'error');
        return;
    }
    
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendPoll`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                question: question,
                options: ["✅ Пойду", "🤔 Не уверен", "❌ Не пойду"],
                is_anonymous: false,
                allows_multiple_answers: false
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✓ опрос создан', 'success');
            addToHistory('опрос', 'success');
            closeModal('pollModal');
            document.getElementById('pollQuestion').value = '';
        } else {
            showStatus(`✗ ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatus(`✗ ошибка: ${error.message}`, 'error');
    }
};

// ===== БЫСТРЫЙ ОПРОС =====
window.sendQuickPoll = async function() {
    console.log('sendQuickPoll');
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendPoll`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                question: "Кто идет на мероприятие?",
                options: ["✅ Пойду", "🤔 Не уверен", "❌ Не пойду"],
                is_anonymous: false
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✓ опрос создан', 'success');
            addToHistory('быстрый опрос', 'success');
        } else {
            showStatus(`✗ ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatus(`✗ ошибка: ${error.message}`, 'error');
    }
};

// ===== ТОЛЬКО ТЕКСТ МЕРОПРИЯТИЯ =====
window.createEventInvite = function() {
    console.log('createEventInvite');
    const name = document.getElementById('eventName').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const place = document.getElementById('eventPlace').value;
    const dresscode = document.getElementById('eventDresscode').value;
    const bring = document.getElementById('eventBring').value;
    
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

// ===== ПОЛУЧЕНИЕ ID ГРУППЫ =====
function getSelectedGroup() {
    const selector = document.getElementById('groupSelector');
    if (selector.value === 'custom') {
        const input = document.getElementById('customGroupId');
        return input.value.trim() || null;
    }
    return selector.value;
}

// ===== ОТПРАВКА ОБЫЧНОГО СООБЩЕНИЯ =====
window.sendMessage = async function() {
    console.log('sendMessage');
    const message = document.getElementById('messageText').value.trim();
    const groupId = getSelectedGroup();
    
    if (!message) {
        showStatus('введите сообщение', 'error');
        return;
    }
    
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✓ отправлено', 'success');
            addToHistory(message, 'success');
            document.getElementById('messageText').value = '';
        } else {
            showStatus(`✗ ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatus(`✗ ошибка: ${error.message}`, 'error');
    }
};

// ===== ТЕСТ =====
window.sendTestMessage = function() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) { 
        showStatus('нет сообщения', 'error'); 
        return; 
    }
    showStatus('🔬 тест режим', 'info');
    addToHistory(`[тест] ${message}`, 'info');
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

function saveHistory() { 
    localStorage.setItem('edubot_history', JSON.stringify(messageHistory)); 
}

function loadHistory() {
    const saved = localStorage.getItem('edubot_history');
    if (saved) { 
        try { 
            messageHistory = JSON.parse(saved); 
            updateHistory(); 
        } catch (e) {} 
    }
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
        setTimeout(() => status.classList.add('hidden'), 2000);
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
