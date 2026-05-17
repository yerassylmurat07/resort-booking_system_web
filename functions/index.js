const { onRequest } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// Телеграм настройки
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN";
const TELEGRAM_CHAT_IDS = (process.env.TELEGRAM_CHAT_IDS || "YOUR_CHAT_ID_1,YOUR_CHAT_ID_2").split(",");

// Ключ для Cloudflare Turnstile
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "SET_YOUR_SECRET_KEY_HERE";

exports.createBooking = onRequest({ cors: true }, async (req, res) => {
    // Только POST запросы
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const data = req.body.data || req.body;

        // 1. Проверяем Turnstile Token
        const turnstileToken = data.turnstileToken;
        if (!turnstileToken) {
            res.status(400).json({ error: 'Отсутствует токен проверки капчи.' });
            return;
        }

        try {
            const verifyRes = await axios.post(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                new URLSearchParams({
                    secret: TURNSTILE_SECRET_KEY,
                    response: turnstileToken
                }).toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );
            if (!verifyRes.data.success) {
                console.warn("Turnstile failed:", verifyRes.data);
                res.status(403).json({ error: 'Проверка на бота не пройдена.' });
                return;
            }
        } catch (err) {
            console.error("Turnstile check error:", err.message);
            res.status(403).json({ error: 'Ошибка при проверке капчи.' });
            return;
        }

        // 2. Валидация данных
        const bookingData = data.booking;
        if (!bookingData || !bookingData.name || !bookingData.phone || !bookingData.checkIn || !bookingData.checkOut || !bookingData.cabinNumber) {
            res.status(400).json({ error: 'Неполные данные бронирования.' });
            return;
        }

        const cleanName = String(bookingData.name).substring(0, 100);
        const cleanPhone = String(bookingData.phone).substring(0, 30);
        const phoneRegex = /^[\d\s\+\-\(\)]{7,30}$/;

        if (!phoneRegex.test(cleanPhone)) {
            res.status(400).json({ error: 'Некорректный номер телефона.' });
            return;
        }

        const cabinNum = parseInt(bookingData.cabinNumber);
        if (isNaN(cabinNum) || cabinNum < 1 || cabinNum > 7) {
            res.status(400).json({ error: 'Некорректный номер домика.' });
            return;
        }

        const safeBooking = {
            name: cleanName,
            phone: cleanPhone,
            cabinNumber: cabinNum,
            checkIn: String(bookingData.checkIn),
            checkOut: String(bookingData.checkOut),
            nights: parseInt(bookingData.nights) || 1,
            breakfast: Boolean(bookingData.breakfast),
            lateCheckout: Boolean(bookingData.lateCheckout),
            currency: bookingData.currency === 'USD' ? 'USD' : 'SOM',
            total: parseInt(bookingData.total) || 0,
            status: "booked",
            createdAt: new Date().toISOString()
        };

        // 3. Записываем в Firestore
        const bookingRef = await db.collection('bookings').add(safeBooking);

        // 4. Добавляем в public_availability
        let availabilityData = {};
        let d = new Date(safeBooking.checkIn);
        const outDate = new Date(safeBooking.checkOut);

        while (d < outDate) {
            const dateString = d.toISOString().split('T')[0];
            availabilityData[dateString] = "booked";
            d.setDate(d.getDate() + 1);
        }

        const availRef = db.collection('public_availability').doc(`cabin_${safeBooking.cabinNumber}`);
        await availRef.set(availabilityData, { merge: true });

        // 5. Отправляем в Telegram
        const sym = safeBooking.currency === 'USD' ? '$' : 'сом';
        const breakfastText = safeBooking.breakfast ? "✅ Да" : "❌ Нет";
        const lateText = safeBooking.lateCheckout ? "✅ Да (+2ч)" : "❌ Нет";

        const text = `🔔 НОВАЯ БРОНЬ (САЙТ)!\n\n` +
                     `🏠 Домик: №${safeBooking.cabinNumber}\n` +
                     `👤 Имя: ${safeBooking.name}\n` +
                     `📞 Телефон: ${safeBooking.phone}\n` +
                     `📅 Заезд: ${safeBooking.checkIn}\n` +
                     `📅 Выезд: ${safeBooking.checkOut}\n` +
                     `🍳 Завтрак: ${breakfastText}\n` +
                     `🕒 Поздний выезд: ${lateText}\n` +
                     `🌙 Ночей: ${safeBooking.nights}\n` +
                     `💰 Итого: ${safeBooking.total.toLocaleString('ru-RU')} ${sym}`;

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        for (const chatId of TELEGRAM_CHAT_IDS) {
            try {
                await axios.post(url, {
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'HTML'
                });
            } catch (e) {
                console.error(`Ошибка отправки в TG для ${chatId}:`, e.message);
            }
        }

        res.status(200).json({ result: { success: true, id: bookingRef.id } });

    } catch (error) {
        console.error("Ошибка при сохранении:", error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
});
