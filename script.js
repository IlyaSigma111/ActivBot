// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    BOT_TOKEN: '8526725790:AAEu_vqnQ0hcn4gJUstOb2-bTCO7kIalQ7U',
    TEST_GROUP: '-5169688120',
    API_URL: 'https://api.telegram.org/bot'
};

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
let messageHistory = [];
let sessionStartTime = new Date();
let messagesCount = 0;

// ===== ШАБЛОНЫ СООБЩЕНИЙ =====
const TEMPLATES = {
    activity: (link = '[вставьте ссылку]') => 
        `🔥 Ребята, прошу вас поактивничать над постом!\n\n` +
        `Нам очень важна ваша поддержка. Поставьте реакции и напишите комментарии под этим постом:\n` +
        `${link}\n\n` +
        `Спасибо за активность! 🙏`,

    poll: () => 
        `📊 Друзья, небольшой опрос!\n\n` +
        `Кто планирует участвовать в мероприятии?\n\n` +
        `👍 - Буду обязательно\n` +
        `🤔 - Пока не уверен\n` +
        `👎 - Не смогу в этот раз\n\n` +
        `Ждем ваши реакции!`,

    deadline: (task = 'задание', date = 'завтра') => 
        `⏰ Напоминание о дедлайне!\n\n` +
        `Дорогие ребята, напоминаю, что ${task} нужно сдать до ${date}.\n\n` +
        `Не откладывайте на последний момент! 💪`,

    links: (project = 'проекта') => 
        `🔗 Сбор ссылок на работы!\n\n` +
        `Ребята, скидывайте в ответ на это сообщение ссылки на ваши работы по ${project}.\n\n` +
        `Формат: Фамилия - ссылка\n\n` +
        `Жду до вечера!`,

    congrats: (holiday = 'праздником') => 
        `🎉 Поздравляю всех с ${holiday}!\n\n` +
        `Желаю успехов, вдохновения и отличного настроения!\n` +
        `Пусть все задуманное обязательно сбудется! ✨`,

    urgent: (message = 'ВАЖНАЯ ИНФОРМАЦИЯ') => 
        `⚠️ СРОЧНОЕ ОБЪЯВЛЕНИЕ ⚠️\n\n` +
        `${message}\n\n` +
        `Прошу всех ознакомиться!`,

    report: (event = 'мероприятия') => 
        `📝 Делимся впечатлениями о ${event}!\n\n` +
        `Ребята, напишите в комментариях:\n` +
        `• Что больше всего понравилось?\n` +
        `• Что можно улучшить?\n` +
        `• Ваши фото с мероприятия\n\n` +
        `Жду обратную связь! 💬`
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    updateSessionTime();
    loadHistory();
    initializeTheme();
});

function initializeApp() {
    // Устанавливаем тестовую группу по умолчанию
    const groupSelector = document.getElementById('groupSelector');
    if (groupSelector) {
        groupSelector.value = CONFIG.TEST_GROUP;
    }
    
    // Настраиваем обработчики
    setupEventListeners();
    
    // Показываем приветствие
    addToHistory('Система запущена', 'info');
}

function setupEventListeners() {
    // Обработчик выбора группы
    const groupSelector = document.getElementById('groupSelector');
    const customGroupInput = document.getElementById('customGroupInput');
    
    if (groupSelector) {
        groupSelector.addEventListener('change', function() {
            if (this.value === 'custom') {
                customGroupInput.classList.remove('hidden');
            } else {
                customGroupInput.classList.add('hidden');
            }
        });
    }
}

// ===== ТЕМА =====
function initializeTheme() {
    const themeSwitcher = document.getElementById('themeSwitcher');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Применяем сохраненную тему
    document.body.className = savedTheme + '-theme';
    
    themeSwitcher.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    });
}

// ===== ОТПРАВКА СООБЩЕНИЙ =====
async function sendMessage() {
    const message = document.getElementById('messageText').value.trim();
    const groupId = getSelectedGroup();
    
    if (!message) {
        showStatus('Введите сообщение для отправки', 'error');
        return;
    }
    
    if (!groupId) {
        showStatus('Выберите группу получателя', 'error');
        return;
    }
    
    showStatus('Отправка...', 'info', true);
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: groupId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            messagesCount++;
            updateMessagesCount();
            showStatus('✅ Сообщение успешно отправлено!', 'success');
            addToHistory(message, 'success');
            document.getElementById('messageText').value = '';
        } else {
            throw new Error(data.description || 'Ошибка отправки');
        }
    } catch (error) {
        showStatus(`❌ Ошибка: ${error.message}`, 'error');
        addToHistory(`Ошибка: ${error.message}`, 'error');
    }
}

function getSelectedGroup() {
    const selector = document.getElementById('groupSelector');
    
    if (selector.value === 'custom') {
        const customInput = document.querySelector('#customGroupInput input');
        return customInput.value.trim() || null;
    }
    
    return selector.value;
}

// ===== ТЕСТОВОЕ СООБЩЕНИЕ =====
async function sendTestMessage() {
    const message = document.getElementById('messageText').value.trim();
    
    if (!message) {
        showStatus('Введите тестовое сообщение', 'error');
        return;
    }
    
    showStatus('🔬 Тестовый режим: сообщение не отправлено в Telegram', 'info');
    addToHistory(`[ТЕСТ] ${message}`, 'info');
}

// ===== РАБОТА С ШАБЛОНАМИ =====
function useTemplate(type) {
    const textarea = document.getElementById('messageText');
    
    switch(type) {
        case 'activity':
            const link = prompt('Вставьте ссылку на пост:', 'https://t.me/...');
            if (link !== null) {
                textarea.value = TEMPLATES.activity(link || '[ссылка не указана]');
            }
            break;
            
        case 'poll':
            textarea.value = TEMPLATES.poll();
            break;
            
        case 'deadline':
            const task = prompt('Какое задание?', 'проект');
            const date = prompt('Дедлайн?', 'завтра');
            if (task !== null && date !== null) {
                textarea.value = TEMPLATES.deadline(task || 'задание', date || 'завтра');
            }
            break;
            
        case 'links':
            const project = prompt('По какому проекту собираем ссылки?', 'проекта');
            textarea.value = TEMPLATES.links(project || 'проекта');
            break;
            
        case 'congrats':
            const holiday = prompt('С каким праздником поздравляем?', 'праздником');
            textarea.value = TEMPLATES.congrats(holiday || 'праздником');
            break;
            
        case 'urgent':
            const urgentMsg = prompt('Текст срочного объявления:');
            if (urgentMsg !== null) {
                textarea.value = TEMPLATES.urgent(urgentMsg || 'ВАЖНАЯ ИНФОРМАЦИЯ');
            }
            break;
            
        case 'report':
            const event = prompt('О каком мероприятии отчет?', 'мероприятия');
            textarea.value = TEMPLATES.report(event || 'мероприятия');
            break;
            
        default:
            textarea.value = 'Шаблон не найден';
    }
    
    // Подсвечиваем текстовое поле
    textarea.style.transition = 'all 0.3s';
    textarea.style.boxShadow = '0 0 0 3px var(--primary)';
    setTimeout(() => {
        textarea.style.boxShadow = 'none';
    }, 500);
}

// ===== МОДАЛЬНОЕ ОКНО ДЛЯ МЕРОПРИЯТИЯ =====
function openEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.add('show');
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('show');
}

function createEventInvite() {
    const name = document.getElementById('eventName').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const place = document.getElementById('eventPlace').value;
    const dresscode = document.getElementById('eventDresscode').value;
    const bring = document.getElementById('eventBring').value;
    
    if (!name || !date || !time) {
        showStatus('Заполните обязательные поля', 'error');
        return;
    }
    
    const message = 
        `🎪 ПРИГЛАШЕНИЕ НА МЕРОПРИЯТИЕ 🎪\n\n` +
        `📌 <b>${name}</b>\n\n` +
        `📅 Дата: ${date}\n` +
        `⏰ Время: ${time}\n` +
        `📍 Место: ${place || 'Не указано'}\n\n` +
        `👔 Форма одежды: ${dresscode || 'Любая удобная'}\n` +
        `🎒 С собой: ${bring || 'Хорошее настроение'}\n\n` +
        `❗️ ОБЯЗАТЕЛЬНО ОТМЕТЬТЕСЬ РЕАКЦИЕЙ:\n` +
        `👍 - Буду обязательно\n` +
        `❓ - Пока не уверен\n` +
        `👎 - Не смогу прийти\n\n` +
        `Ждем всех! ✨`;
    
    document.getElementById('messageText').value = message;
    closeEventModal();
    
    // Очищаем поля
    ['eventName', 'eventDate', 'eventTime', 'eventPlace', 'eventDresscode', 'eventBring'].forEach(id => {
        document.getElementById(id).value = '';
    });
    
    showStatus('Шаблон мероприятия создан! Осталось отправить', 'success');
}

// ===== РАБОТА С ИСТОРИЕЙ =====
function addToHistory(text, type = 'info') {
    const time = new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    messageHistory.unshift({
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        time,
        type
    });
    
    if (messageHistory.length > 20) {
        messageHistory.pop();
    }
    
    updateHistoryDisplay();
    saveHistory();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    const historyCount = document.getElementById('historyCount');
    
    if (messageHistory.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-inbox"></i>
                <p>История пуста</p>
            </div>
        `;
        historyCount.textContent = '0';
        return;
    }
    
    historyCount.textContent = messageHistory.length;
    
    let html = '';
    messageHistory.forEach(item => {
        html += `
            <div class="history-item">
                <span>${item.text}</span>
                <span class="history-item-time">${item.time}</span>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}

function saveHistory() {
    localStorage.setItem('messageHistory', JSON.stringify(messageHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('messageHistory');
    if (saved) {
        try {
            messageHistory = JSON.parse(saved);
            updateHistoryDisplay();
        } catch (e) {
            console.error('Ошибка загрузки истории');
        }
    }
}

function clearHistory() {
    messageHistory = [];
    updateHistoryDisplay();
    saveHistory();
    showStatus('История очищена', 'info');
}

// ===== СТАТУСЫ И УВЕДОМЛЕНИЯ =====
function showStatus(message, type = 'info', keep = false) {
    const statusDiv = document.getElementById('messageStatus');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.classList.remove('hidden');
    
    if (!keep) {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }
}

function updateMessagesCount() {
    document.getElementById('messagesCount').textContent = messagesCount;
}

function updateSessionTime() {
    setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - sessionStartTime) / 1000);
        const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        
        document.getElementById('sessionTime').textContent = `${hours}:${minutes}`;
    }, 1000);
}

function clearEditor() {
    document.getElementById('messageText').value = '';
    showStatus('Редактор очищен', 'info');
}

// ===== ЭКСПОРТ =====
function exportHistory() {
    const dataStr = JSON.stringify(messageHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `bot-history-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showStatus('История экспортирована', 'success');
}

// Закрытие модального окна по клику вне
window.onclick = function(event) {
    const modal = document.getElementById('eventModal');
    if (event.target === modal) {
        closeEventModal();
    }
};
