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

// Хранилище голосований (в реальном проекте - база данных)
let polls = {};

// ===== ШАБЛОНЫ =====
const TEMPLATES = {
    activity: (link = '[ссылка]') => 
        `🔥 ЗАПРОС АКТИВНОСТИ\n\nРебята, прошу вас поактивничать над постом!\n\n${link}\n\nЖду реакции и комментарии!`,

    poll: (question = "Кто идет на мероприятие?") => 
        `👥 ГОЛОСОВАНИЕ\n\n${question}\n\nНажмите на кнопку ниже, чтобы проголосовать 👇`,

    deadline: (task = 'задание', date = 'завтра') => 
        `⏰ НАПОМИНАНИЕ\n\n${task} нужно сдать до ${date}.\n\nПодтвердите, что приняли информацию 👇`,

    links: (project = 'проекта') => 
        `🔗 СБОР ССЫЛОК\n\nСкидывайте ссылки на ваши работы по ${project} в комментарии или нажмите кнопку ниже 👇`,

    congrats: (holiday = 'праздником') => 
        `🎉 ПОЗДРАВЛЯЮ\n\nС ${holiday}! Желаю успехов, вдохновения и отличного настроения! ✨`,

    urgent: (message = '') => 
        `⚠️ СРОЧНОЕ ОБЪЯВЛЕНИЕ\n\n${message}\n\nПрошу всех ознакомиться! Нажмите "Прочитано" 👇`,

    report: (event = 'мероприятия') => 
        `📝 ОТЧЕТ О МЕРОПРИЯТИИ\n\nДелитесь впечатлениями о ${event} в комментариях!\n\nЧто понравилось? Что можно улучшить?`
};

// ===== ФУНКЦИИ ДЛЯ ГОЛОСОВАНИЙ =====

/**
 * Создает текст с отображением статистики голосования
 */
function formatPollResults(pollData) {
    const total = pollData.yes.length + pollData.maybe.length + pollData.no.length;
    
    let result = `👥 ГОЛОСОВАНИЕ\n\n`;
    result += `${pollData.question}\n\n`;
    
    // Сортируем по алфавиту для красоты
    const sortUsers = (users) => users.sort((a, b) => a.localeCompare(b));
    
    if (pollData.yes.length > 0) {
        result += `✅ Пойдут (${pollData.yes.length}):\n`;
        sortUsers(pollData.yes).forEach(user => {
            result += `${user}\n`;
        });
        result += '\n';
    }
    
    if (pollData.maybe.length > 0) {
        result += `🤔 Не уверены (${pollData.maybe.length}):\n`;
        sortUsers(pollData.maybe).forEach(user => {
            result += `${user}\n`;
        });
        result += '\n';
    }
    
    if (pollData.no.length > 0) {
        result += `❌ Не пойдут (${pollData.no.length}):\n`;
        sortUsers(pollData.no).forEach(user => {
            result += `${user}\n`;
        });
        result += '\n';
    }
    
    if (total === 0) {
        result += `Пока никто не проголосовал. Будь первым! 👇\n\n`;
    } else {
        result += `Всего проголосовало: ${total}\n\n`;
    }
    
    return result;
}

/**
 * Создает клавиатуру для голосования
 */
function createPollKeyboard(pollId) {
    return {
        inline_keyboard: [
            [
                { text: "✅ Пойду", callback_data: `poll_${pollId}_yes` },
                { text: "🤔 Не уверен", callback_data: `poll_${pollId}_maybe` },
                { text: "❌ Не пойду", callback_data: `poll_${pollId}_no` }
            ],
            [
                { text: "🔄 Обновить статистику", callback_data: `poll_${pollId}_refresh` },
                { text: "📊 Кто проголосовал", callback_data: `poll_${pollId}_list` }
            ]
        ]
    };
}

/**
 * Отправляет голосование с вопросом
 */
async function sendPoll() {
    const question = prompt('Вопрос для голосования:', 'Кто идет на мероприятие?');
    if (question === null) return;
    
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    // Создаем уникальный ID для этого голосования
    const pollId = Date.now().toString();
    
    // Инициализируем голосование
    polls[pollId] = {
        id: pollId,
        question: question,
        yes: [],
        maybe: [],
        no: [],
        messageId: null,
        chatId: groupId
    };
    
    const message = formatPollResults(polls[pollId]);
    const keyboard = createPollKeyboard(pollId);
    
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
            // Сохраняем ID сообщения для будущих обновлений
            polls[pollId].messageId = data.result.message_id;
            
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✅ голосование создано!', 'success');
            addToHistory(`голосование: ${question}`, 'success');
        } else {
            throw new Error(data.description);
        }
    } catch (error) {
        showStatus(`❌ ошибка: ${error.message}`, 'error');
    }
}

/**
 * Обновляет сообщение с голосованием (показывает актуальные результаты)
 */
async function updatePollMessage(pollId) {
    const poll = polls[pollId];
    if (!poll || !poll.messageId) return;
    
    const newMessage = formatPollResults(poll);
    const keyboard = createPollKeyboard(pollId);
    
    try {
        await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: poll.chatId,
                message_id: poll.messageId,
                text: newMessage,
                reply_markup: keyboard,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('Ошибка обновления голосования:', error);
    }
}

/**
 * Отправляет список проголосовавших в чат
 */
async function sendVotersList(pollId) {
    const poll = polls[pollId];
    if (!poll) return;
    
    let message = `📊 СПИСОК ПРОГОЛОСОВАВШИХ\n\n`;
    
    if (poll.yes.length > 0) {
        message += `✅ Пойдут:\n${poll.yes.join('\n')}\n\n`;
    }
    
    if (poll.maybe.length > 0) {
        message += `🤔 Не уверены:\n${poll.maybe.join('\n')}\n\n`;
    }
    
    if (poll.no.length > 0) {
        message += `❌ Не пойдут:\n${poll.no.join('\n')}\n\n`;
    }
    
    if (poll.yes.length + poll.maybe.length + poll.no.length === 0) {
        message += 'Пока никто не проголосовал.';
    }
    
    try {
        await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: poll.chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('Ошибка отправки списка:', error);
    }
}

/**
 * Обработка нажатий на кнопки (вызывается из вебхука)
 */
async function handlePollButton(pollId, userId, userName, action) {
    const poll = polls[pollId];
    if (!poll) return false;
    
    const userMention = userName ? `@${userName}` : `user_${userId}`;
    
    // Удаляем пользователя из всех категорий (чтоб не было дублей)
    poll.yes = poll.yes.filter(u => !u.includes(userId.toString()) && !u.includes(userMention));
    poll.maybe = poll.maybe.filter(u => !u.includes(userId.toString()) && !u.includes(userMention));
    poll.no = poll.no.filter(u => !u.includes(userId.toString()) && !u.includes(userMention));
    
    // Добавляем в выбранную категорию
    switch(action) {
        case 'yes':
            poll.yes.push(userMention);
            break;
        case 'maybe':
            poll.maybe.push(userMention);
            break;
        case 'no':
            poll.no.push(userMention);
            break;
    }
    
    // Обновляем сообщение
    await updatePollMessage(pollId);
    
    return true;
}

// ===== СПЕЦИАЛИЗИРОВАННЫЕ ГОЛОСОВАНИЯ =====

/**
 * Голосование для мероприятия (с дополнительной информацией)
 */
async function sendEventPoll() {
    const name = document.getElementById('eventName').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const place = document.getElementById('eventPlace').value;
    
    if (!name || !date || !time) {
        showStatus('заполните название, дату и время', 'error');
        return;
    }
    
    const groupId = getSelectedGroup();
    if (!groupId) {
        showStatus('выберите группу', 'error');
        return;
    }
    
    const pollId = `event_${Date.now()}`;
    
    const question = 
        `🎪 МЕРОПРИЯТИЕ: ${name}\n` +
        `📅 ${date} | ${time}\n` +
        `📍 ${place || 'место не указано'}\n\n` +
        `Кто планирует участвовать?`;
    
    // Инициализируем голосование
    polls[pollId] = {
        id: pollId,
        question: question,
        yes: [],
        maybe: [],
        no: [],
        messageId: null,
        chatId: groupId,
        type: 'event',
        details: { name, date, time, place }
    };
    
    const message = formatPollResults(polls[pollId]);
    const keyboard = createPollKeyboard(pollId);
    
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
            polls[pollId].messageId = data.result.message_id;
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✅ голосование по мероприятию создано!', 'success');
            addToHistory(`мероприятие: ${name}`, 'success');
            closeEventModal();
            
            // Очищаем поля
            ['eventName', 'eventDate', 'eventTime', 'eventPlace', 'eventDresscode', 'eventBring']
                .forEach(id => document.getElementById(id).value = '');
        } else {
            throw new Error(data.description);
        }
    } catch (error) {
        showStatus(`❌ ошибка: ${error.message}`, 'error');
    }
}

/**
 * Голосование-подтверждение (для важных объявлений)
 */
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
    
    const pollId = `confirm_${Date.now()}`;
    
    const question = 
        `📢 ВАЖНОЕ ОБЪЯВЛЕНИЕ\n\n${message}\n\n` +
        `Подтвердите, что ознакомились:`;
    
    // Инициализируем голосование
    polls[pollId] = {
        id: pollId,
        question: question,
        yes: [], // прочитавшие
        no: [], // не использовано
        maybe: [], // не использовано
        messageId: null,
        chatId: groupId,
        type: 'confirmation'
    };
    
    // Специальная клавиатура для подтверждения
    const keyboard = {
        inline_keyboard: [
            [
                { text: "✅ Прочитано", callback_data: `poll_${pollId}_yes` },
                { text: "🔄 Обновить", callback_data: `poll_${pollId}_refresh` }
            ],
            [
                { text: "📋 Кто прочитал", callback_data: `poll_${pollId}_list` }
            ]
        ]
    };
    
    let pollText = `📢 ВАЖНОЕ ОБЪЯВЛЕНИЕ\n\n${message}\n\n`;
    pollText += `✅ Прочитали (${polls[pollId].yes.length}):\n`;
    if (polls[pollId].yes.length > 0) {
        pollText += polls[pollId].yes.join('\n') + '\n\n';
    }
    pollText += `Нажмите "Прочитано" чтобы отметить себя 👇`;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: pollText,
                reply_markup: keyboard,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            polls[pollId].messageId = data.result.message_id;
            messagesCount++;
            document.getElementById('messagesCount').textContent = messagesCount;
            showStatus('✅ объявление с подтверждением отправлено!', 'success');
            addToHistory('объявление с подтверждением', 'success');
            document.getElementById('messageText').value = '';
        } else {
            throw new Error(data.description);
        }
    } catch (error) {
        showStatus(`❌ ошибка: ${error.message}`, 'error');
    }
}

// ===== ВЕБХУК ОБРАБОТЧИК (для сервера) =====

/**
 * ЭТУ ФУНКЦИЮ ВЫЗЫВАЕТ ВАШ СЕРВЕР
 * Когда пользователь нажимает кнопку в Telegram
 */
async function processCallbackQuery(callbackQuery) {
    const { data, from, message } = callbackQuery;
    const userId = from.id;
    const userName = from.username || from.first_name;
    
    // Парсим callback_data (формат: poll_{pollId}_{action})
    const matches = data.match(/^poll_(.+)_(.+)$/);
    if (!matches) return false;
    
    const pollId = matches[1];
    const action = matches[2];
    
    const poll = polls[pollId];
    if (!poll) return false;
    
    switch(action) {
        case 'yes':
        case 'maybe':
        case 'no':
            await handlePollButton(pollId, userId, userName, action);
            
            // Отвечаем пользователю, что голос принят
            await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    callback_query_id: callbackQuery.id,
                    text: 'Ваш голос учтен! ✅'
                })
            });
            break;
            
        case 'refresh':
            // Просто обновляем сообщение (уже обновится в handlePollButton)
            await updatePollMessage(pollId);
            
            await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    callback_query_id: callbackQuery.id,
                    text: 'Статистика обновлена'
                })
            });
            break;
            
        case 'list':
            // Отправляем список проголосовавших в личку или в чат
            await sendVotersList(pollId);
            
            await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    callback_query_id: callbackQuery.id,
                    text: 'Список отправлен в чат'
                })
            });
            break;
    }
    
    return true;
}

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ) =====

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateSessionTime();
    loadHistory();
    addToHistory('система инициализирована', 'info');
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

// ОТПРАВКА ОБЫЧНОГО СООБЩЕНИЯ
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
    
    showStatus('отправка...', 'info', true);
    
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
            throw new Error(data.description);
        }
    } catch (error) {
        showStatus(`✗ ${error.message}`, 'error');
        addToHistory(`ошибка: ${error.message}`, 'error');
    }
}

function getSelectedGroup() {
    const selector = document.getElementById('groupSelector');
    if (selector.value === 'custom') {
        const input = document.querySelector('#customGroupInput input');
        return input.value.trim() || null;
    }
    return selector.value;
}

function sendTestMessage() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showStatus('нет сообщения', 'error');
        return;
    }
    showStatus('🔬 тест (без отправки)', 'info');
    addToHistory(`[тест] ${message}`, 'info');
}

// ШАБЛОНЫ (старые, без кнопок)
function useTemplate(type) {
    const textarea = document.getElementById('messageText');
    
    switch(type) {
        case 'activity':
            const link = prompt('ссылка на пост:', 'https://t.me/...');
            if (link !== null) textarea.value = TEMPLATES.activity(link || 'ссылка не указана');
            break;
            
        case 'links_old':
            const project = prompt('проект:', 'проекта');
            textarea.value = TEMPLATES.links(project || 'проекта');
            break;
            
        case 'congrats':
            const holiday = prompt('праздник:', 'праздником');
            textarea.value = TEMPLATES.congrats(holiday || 'праздником');
            break;
            
        case 'urgent_old':
            const urgentMsg = prompt('текст:');
            if (urgentMsg !== null) textarea.value = TEMPLATES.urgent(urgentMsg || 'срочно!');
            break;
            
        case 'report':
            const event = prompt('мероприятие:', 'мероприятия');
            textarea.value = TEMPLATES.report(event || 'мероприятия');
            break;
    }
    
    // Эффект
    textarea.style.transition = 'all 0.2s';
    textarea.style.borderColor = '#6c8cff';
    setTimeout(() => textarea.style.borderColor = '', 300);
}

// МОДАЛКА
function openEventModal() {
    document.getElementById('eventModal').classList.add('show');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('show');
}

// ИСТОРИЯ
function addToHistory(text, type = 'info') {
    const time = new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    messageHistory.unshift({
        text: text.substring(0, 40) + (text.length > 40 ? '…' : ''),
        time,
        type
    });
    
    if (messageHistory.length > 15) messageHistory.pop();
    
    updateHistory();
    saveHistory();
}

function updateHistory() {
    const list = document.getElementById('historyList');
    const count = document.getElementById('historyCount');
    
    if (messageHistory.length === 0) {
        list.innerHTML = '<div class="history-empty"><i class="fas fa-terminal"></i><p>нет записей</p></div>';
        count.textContent = '0';
        return;
    }
    
    count.textContent = messageHistory.length;
    
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
    localStorage.setItem('history', JSON.stringify(messageHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('history');
    if (saved) {
        try {
            messageHistory = JSON.parse(saved);
            updateHistory();
        } catch (e) {}
    }
}

function exportHistory() {
    const data = JSON.stringify(messageHistory, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showStatus('история экспортирована', 'success');
}

// СТАТУСЫ
function showStatus(message, type = 'info', keep = false) {
    const status = document.getElementById('messageStatus');
    status.textContent = message;
    status.className = `status-line ${type}`;
    status.classList.remove('hidden');
    
    if (!keep) {
        setTimeout(() => status.classList.add('hidden'), 2000);
    }
}

function updateSessionTime() {
    setInterval(() => {
        const diff = Math.floor((new Date() - sessionStartTime) / 1000);
        const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        document.getElementById('sessionTime').textContent = `${hours}:${minutes}`;
    }, 1000);
}

function clearEditor() {
    document.getElementById('messageText').value = '';
    showStatus('редактор очищен', 'info');
}

// Закрытие модалки по клику вне
window.onclick = (event) => {
    const modal = document.getElementById('eventModal');
    if (event.target === modal) closeEventModal();
};
