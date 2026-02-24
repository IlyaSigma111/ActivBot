// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    BOT_TOKEN: '8526725790:AAEu_vqnQ0hcn4gJUstOb2-bTCO7kIalQ7U',
    TEST_GROUP: '-5169688120',
    API_URL: 'https://api.telegram.org/bot'
};

// ===== СОСТОЯНИЕ =====
let messageHistory = [];
let sessionStartTime = new Date();
let messagesCount = 0;

// ===== ШАБЛОНЫ =====
const TEMPLATES = {
    // Активность под постом
    activity: (link = '[ссылка]') => 
        `🔥 РЕБЯТА, ПОАКТИВНИЧАЙТЕ!\n\nНам очень важна ваша поддержка под этим постом:\n${link}\n\nЖду реакции и комментарии! 🙏`,

    // Быстрый опрос
    quickPoll: () => 
        `📊 КТО ИДЕТ?\n\n👍 - Пойду\n🤔 - Не уверен\n👎 - Не пойду\n\nНажимайте на кнопки ниже!`,

    // Простое напоминание
    deadlineSimple: (task = 'задание', date = 'завтра') => 
        `⏰ НАПОМИНАНИЕ\n\n${task} нужно сдать до ${date}.\n\nНе откладывайте!`,

    // Сбор ссылок простой
    linksSimple: (project = 'проекта') => 
        `🔗 СБОР ССЫЛОК\n\nСкидывайте в комментарии ссылки на работы по ${project}.\n\nФормат: Фамилия - ссылка`,

    // Поздравление
    congrats: (holiday = 'праздником') => 
        `🎉 ПОЗДРАВЛЯЮ!\n\nС ${holiday}! Желаю успехов, вдохновения и отличного настроения! ✨`,

    // Срочное
    urgent: (message = '') => 
        `⚠️ СРОЧНО!\n\n${message}\n\nПрошу всех ознакомиться!`,

    // Отчет
    report: (event = 'мероприятия') => 
        `📝 ОТЧЕТ О МЕРОПРИЯТИИ\n\nДелитесь впечатлениями о ${event} в комментариях!\n\nЧто понравилось? Что можно улучшить?`,

    // День рождения
    birthday: (name = 'именинника') => 
        `🎂 С ДНЕМ РОЖДЕНИЯ, ${name}!\n\nЖелаем счастья, здоровья, успехов в учебе и отличного настроения! 🎁🎈`
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateSessionTime();
    loadHistory();
    addToHistory('система готова', 'info');
    
    // Показываем токен (скрытый)
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
}

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
async function sendMessage() {
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
}

// ===== ТЕСТ (БЕЗ ОТПРАВКИ) =====
function sendTestMessage() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showStatus('нет сообщения', 'error');
        return;
    }
    showStatus('🔬 тест режим (сообщение не отправлено)', 'info');
    addToHistory(`[тест] ${message}`, 'info');
}

// ===== КОПИРОВАТЬ В БУФЕР =====
function copyToClipboard() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showStatus('нечего копировать', 'error');
        return;
    }
    
    navigator.clipboard.writeText(message).then(() => {
        showStatus('✓ скопировано', 'success');
    }).catch(() => {
        showStatus('✗ ошибка копирования', 'error');
    });
}

// ===== ОТПРАВКА С КНОПКАМИ (ГОЛОСОВАНИЕ) =====
async function sendPoll() {
    const question = prompt('Вопрос для голосования:', 'Кто идет на мероприятие?');
    if (question === null) return;
    
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    const message = `📊 ГОЛОСОВАНИЕ\n\n${question}\n\nНажмите на кнопку ниже:`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: "✅ Пойду", callback_data: "vote_yes" },
                { text: "🤔 Не уверен", callback_data: "vote_maybe" },
                { text: "❌ Не пойду", callback_data: "vote_no" }
            ]
        ]
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: message,
                reply_markup: keyboard,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✓ голосование создано', 'success');
            addToHistory('голосование', 'success');
        } else {
            showStatus(`✗ ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatus(`✗ ошибка: ${error.message}`, 'error');
    }
}

// ===== БЫСТРЫЙ ОПРОС =====
async function sendQuickPoll() {
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    const message = TEMPLATES.quickPoll();
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: "✅ Пойду", callback_data: "quick_yes" },
                { text: "🤔 Не уверен", callback_data: "quick_maybe" },
                { text: "❌ Не пойду", callback_data: "quick_no" }
            ]
        ]
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: message,
                reply_markup: keyboard,
                parse_mode: 'HTML'
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
}

// ===== СБОР ССЫЛОК С КНОПКОЙ =====
async function sendLinksRequest() {
    const project = prompt('По какому проекту собираем ссылки?', 'проекта');
    if (project === null) return;
    
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    const message = `🔗 СБОР ССЫЛОК\n\nСкидывайте ссылки на работы по ${project}.\n\nФормат: Фамилия - ссылка`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: "🔗 Отправить ссылку", callback_data: "send_link" },
                { text: "👀 Мои ссылки", callback_data: "my_links" }
            ]
        ]
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: message,
                reply_markup: keyboard,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✓ запрос ссылок отправлен', 'success');
            addToHistory('запрос ссылок', 'success');
        } else {
            showStatus(`✗ ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatus(`✗ ошибка: ${error.message}`, 'error');
    }
}

// ===== НАПОМИНАНИЕ С КНОПКОЙ =====
async function sendDeadlineReminder() {
    const task = prompt('Какое задание?', 'проект');
    const date = prompt('Дедлайн?', 'завтра');
    if (task === null || date === null) return;
    
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    const message = `⏰ НАПОМИНАНИЕ\n\n${task} нужно сдать до ${date}.\n\nПодтвердите, что приняли информацию:`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: "✅ Принял(а)", callback_data: "deadline_ok" }
            ]
        ]
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: message,
                reply_markup: keyboard,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✓ напоминание отправлено', 'success');
            addToHistory('напоминание', 'success');
        } else {
            showStatus(`✗ ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatus(`✗ ошибка: ${error.message}`, 'error');
    }
}

// ===== ВАЖНОЕ С ПОДТВЕРЖДЕНИЕМ =====
async function sendConfirmationPoll() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showStatus('введите текст объявления', 'error');
        return;
    }
    
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    const text = `⚠️ ВАЖНОЕ ОБЪЯВЛЕНИЕ\n\n${message}\n\nНажмите "Прочитано" чтобы отметить себя:`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: "✅ Прочитано", callback_data: "confirm_read" }
            ]
        ]
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: text,
                reply_markup: keyboard,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✓ объявление отправлено', 'success');
            addToHistory('важное объявление', 'success');
            document.getElementById('messageText').value = '';
        } else {
            showStatus(`✗ ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatus(`✗ ошибка: ${error.message}`, 'error');
    }
}

// ===== ИСПОЛЬЗОВАНИЕ ПРОСТЫХ ШАБЛОНОВ =====
function useTemplate(type) {
    const textarea = document.getElementById('messageText');
    
    switch(type) {
        case 'activity':
            const link = prompt('Ссылка на пост:', 'https://t.me/...');
            if (link !== null) {
                textarea.value = TEMPLATES.activity(link || 'ссылка не указана');
            }
            break;
            
        case 'links_old':
            const project = prompt('Проект:', 'проекта');
            textarea.value = TEMPLATES.linksSimple(project || 'проекта');
            break;
            
        case 'congrats':
            const holiday = prompt('Праздник:', 'праздником');
            textarea.value = TEMPLATES.congrats(holiday || 'праздником');
            break;
            
        case 'deadline_simple':
            const task = prompt('Задание:', 'проект');
            const date = prompt('Дедлайн:', 'завтра');
            textarea.value = TEMPLATES.deadlineSimple(task || 'задание', date || 'завтра');
            break;
            
        case 'urgent':
            const urgentMsg = prompt('Текст срочного объявления:');
            if (urgentMsg !== null) {
                textarea.value = TEMPLATES.urgent(urgentMsg || 'СРОЧНО!');
            }
            break;
            
        case 'report':
            const event = prompt('Мероприятие:', 'мероприятия');
            textarea.value = TEMPLATES.report(event || 'мероприятия');
            break;
            
        case 'birthday':
            const name = prompt('Имя именинника:', 'Друг');
            textarea.value = TEMPLATES.birthday(name || 'Друг');
            break;
    }
    
    // Подсветка
    textarea.style.transition = 'all 0.2s';
    textarea.style.borderColor = '#6c8cff';
    setTimeout(() => textarea.style.borderColor = '', 300);
    
    showStatus('✓ шаблон вставлен', 'success');
}

// ===== МОДАЛКА МЕРОПРИЯТИЯ =====
function openEventModal() {
    document.getElementById('eventModal').classList.add('show');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('show');
}

// ===== ОТПРАВКА МЕРОПРИЯТИЯ С ГОЛОСОВАНИЕМ =====
async function sendEventPoll() {
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
    
    const message = 
        `🎪 МЕРОПРИЯТИЕ: ${name}\n\n` +
        `📅 Дата: ${date}\n` +
        `⏰ Время: ${time}\n` +
        `📍 Место: ${place || 'не указано'}\n\n` +
        `👔 Дресс-код: ${dresscode || 'любой'}\n` +
        `🎒 С собой: ${bring || 'ничего'}\n\n` +
        `Кто идет? 👇`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: "✅ Иду", callback_data: "event_yes" },
                { text: "🤔 Возможно", callback_data: "event_maybe" },
                { text: "❌ Не смогу", callback_data: "event_no" }
            ]
        ]
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: message,
                reply_markup: keyboard,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✓ приглашение отправлено', 'success');
            addToHistory(`мероприятие: ${name}`, 'success');
            closeEventModal();
            
            // Очистка полей
            ['eventName', 'eventDate', 'eventTime', 'eventPlace', 'eventDresscode', 'eventBring']
                .forEach(id => document.getElementById(id).value = '');
        } else {
            showStatus(`✗ ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatus(`✗ ошибка: ${error.message}`, 'error');
    }
}

// ===== ТОЛЬКО ТЕКСТ МЕРОПРИЯТИЯ =====
function createEventInvite() {
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
    closeEventModal();
    
    // Очистка полей
    ['eventName', 'eventDate', 'eventTime', 'eventPlace', 'eventDresscode', 'eventBring']
        .forEach(id => document.getElementById(id).value = '');
    
    showStatus('✓ текст мероприятия создан', 'success');
}

// ===== МОДАЛКА СВОЕГО СООБЩЕНИЯ =====
function openCustomModal() {
    document.getElementById('customMessageModal').classList.add('show');
}

function closeCustomModal() {
    document.getElementById('customMessageModal').classList.remove('show');
}

async function sendCustomMessage() {
    const message = document.getElementById('customMessageText').value.trim();
    if (!message) {
        showStatus('введите сообщение', 'error');
        return;
    }
    
    document.getElementById('messageText').value = message;
    closeCustomModal();
    showStatus('✓ сообщение вставлено', 'success');
}

// ===== ИСТОРИЯ =====
function addToHistory(text, type = 'info') {
    const time = new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    messageHistory.unshift({
        text: text.length > 40 ? text.substring(0, 40) + '…' : text,
        time,
        type
    });
    
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
        html += `
            <div class="history-item">
                <span>${item.text}</span>
                <span class="history-item-time">${item.time}</span>
            </div>
        `;
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

function clearHistory() {
    if (confirm('Очистить историю?')) {
        messageHistory = [];
        updateHistory();
        saveHistory();
        showStatus('✓ история очищена', 'info');
    }
}

function exportHistory() {
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
}

// ===== СТАТУСЫ =====
function showStatus(message, type = 'info', keep = false) {
    const status = document.getElementById('messageStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = `status-line ${type}`;
    status.classList.remove('hidden');
    
    if (!keep) {
        setTimeout(() => {
            status.classList.add('hidden');
        }, 2000);
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

// ===== ОЧИСТИТЬ РЕДАКТОР =====
function clearEditor() {
    document.getElementById('messageText').value = '';
    showStatus('✓ редактор очищен', 'info');
}

// ===== ЗАКРЫТИЕ МОДАЛОК ПО КЛИКУ ВНЕ =====
window.onclick = (event) => {
    const eventModal = document.getElementById('eventModal');
    const customModal = document.getElementById('customMessageModal');
    
    if (event.target === eventModal) {
        closeEventModal();
    }
    if (event.target === customModal) {
        closeCustomModal();
    }
};
