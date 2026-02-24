// ===== КОНФИГУРАЦИЯ =====
const BOT_TOKEN = '8526725790:AAEu_vqnQ0hcn4gJUstOb2-bTCO7kIalQ7U';
const CHAT_ID = '-1004695039051'; // Попробуйте также -4695039051

// ===== СОСТОЯНИЕ =====
let messagesCount = 0;
let messageHistory = [];

// ===== ШАБЛОНЫ =====
const TEMPLATES = {
    activity: (link) => `🔥 РЕБЯТА, ПОАКТИВНИЧАЙТЕ!\n\n${link}\n\nЖду реакции! 🙏`,
    deadline: (task, date) => `⏰ НАПОМИНАНИЕ\n\n${task} нужно сдать до ${date}.`,
    congrats: (holiday) => `🎉 ПОЗДРАВЛЯЮ!\n\nС ${holiday}! ✨`,
    urgent: (text) => `⚠️ СРОЧНО!\n\n${text}`,
    birthday: (name) => `🎂 С ДНЕМ РОЖДЕНИЯ, ${name}! 🎁`
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('EduBot запущен');
    loadHistory();
});

// ===== ОТПРАВКА =====
window.sendMessage = async function() {
    const text = document.getElementById('messageText')?.value.trim();
    if (!text) return alert('Введите текст');
    
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text })
        });
        const data = await res.json();
        alert(data.ok ? '✓ Отправлено!' : `✗ Ошибка: ${data.description}`);
    } catch (e) {
        alert(`✗ Ошибка: ${e.message}`);
    }
};

// ===== ОПРОС =====
window.sendPoll = async function(question) {
    if (!question) question = prompt('Вопрос для опроса?');
    if (!question) return;
    
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: CHAT_ID,
                question,
                options: ["✅ Пойду", "🤔 Не уверен", "❌ Не пойду"],
                is_anonymous: false
            })
        });
        const data = await res.json();
        alert(data.ok ? '✓ Опрос создан!' : `✗ Ошибка: ${data.description}`);
    } catch (e) {
        alert(`✗ Ошибка: ${e.message}`);
    }
};

// ===== ШАБЛОНЫ =====
window.useTemplate = function(type) {
    const textarea = document.getElementById('messageText');
    if (!textarea) return;
    
    switch(type) {
        case 'activity':
            const link = prompt('Ссылка на пост:');
            if (link) textarea.value = TEMPLATES.activity(link);
            break;
        case 'deadline':
            const task = prompt('Задание:');
            const date = prompt('Дедлайн:');
            if (task && date) textarea.value = TEMPLATES.deadline(task, date);
            break;
        case 'congrats':
            const holiday = prompt('Праздник:');
            if (holiday) textarea.value = TEMPLATES.congrats(holiday);
            break;
        case 'urgent':
            const text = prompt('Текст:');
            if (text) textarea.value = TEMPLATES.urgent(text);
            break;
        case 'birthday':
            const name = prompt('Имя:');
            if (name) textarea.value = TEMPLATES.birthday(name);
            break;
    }
};

// ===== ПРОВЕРКА =====
window.checkBot = async function() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const data = await res.json();
        alert(data.ok ? '✓ Бот работает!' : '✗ Бот не отвечает');
    } catch (e) {
        alert(`✗ Ошибка: ${e.message}`);
    }
};

// Загружаем историю
function loadHistory() {
    const saved = localStorage.getItem('history');
    if (saved) messageHistory = JSON.parse(saved);
}
