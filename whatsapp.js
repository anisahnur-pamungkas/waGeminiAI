import dotenv from 'dotenv';
import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const client = new Client();

client.on('qr', (qr) => {
    console.log("QR code generated!");  
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');  
});

client.on('message', async (msg) => {
    console.log('Message received: ', msg.body);  

    if (msg.body === 'Hallo') {
        msg.reply('Hallo Kak! Nama saya Anisahnur Oktaviany, bagaimana saya bisa membantu kamu hari ini?');
    } else if (msg.body === '!ping') {
        msg.reply('pong');
    } else if (msg.body.startsWith('!echo ')) {
        // Replies with the same message
        msg.reply(msg.body.slice(6));
    } else if (msg.body.toLowerCase().startsWith('ask me')) {
        const userQuestion = msg.body.slice(7); 
        
        const response = await generateResponse(userQuestion);
        
        msg.reply(response);
    } else if (msg.body.toLowerCase().startsWith('Rekomendasi mata kuliah')) {
        msg.reply("Kak, profesi apa yang kamu inginkan? Dan berapa mata kuliah maksimal yang bisa kamu ambil?");
        
        client.on('message', async (response) => {
            const userInput = response.body.toLowerCase();
            let profession = '';
            let maxCourses = 0;
            
            if (userInput.includes("entrepreneur")) {
                profession = 'Entrepreneur';
            } else if (userInput.includes("analyst")) {
                profession = 'Business Analyst';
            } else if (userInput.includes("data scientist")) {
                profession = 'Data Scientist';
            } else if (userInput.includes("tech specialist")) {
                profession = 'Tech Specialist';
            } else if (userInput.includes("manager")) {
                profession = 'Manager';
            } else if (userInput.includes("financial analyst")) {
                profession = 'Financial Analyst';
            }

            const match = userInput.match(/\d+/);
            if (match) {
                maxCourses = parseInt(match[0]);
            }

            if (profession && maxCourses) {
                const recommendedCourses = recommendCourses(profession, maxCourses);
                msg.reply(`Untuk profesi ${profession}, kamu bisa mengambil mata kuliah berikut: ${recommendedCourses}`);
            } else {
                msg.reply("Maaf Kak, saya tidak dapat memahami input kamu. Coba lagi dengan menyebutkan profesi dan jumlah maksimal mata kuliah.");
            }
        });
    } else {
        msg.reply("Maaf Kak, saya tidak mengerti pertanyaan kamu. Silakan coba lagi atau hubungi kami di team@microcredential.id untuk bantuan lebih lanjut.");
    }

    // Gemini takover
    if (msg.body.toLowerCase().includes('help')) {
        const response = await getAICustomerServiceResponse(msg.body);
        console.log("AI Response: ", response); 
        msg.reply(response);
    }
});

// Function response from Gemini AI
async function generateResponse(userMessage) {
    const prompt = `
        Kamu adalah customer service untuk program beasiswa Microcredential Bisnis Digital dari Kementerian Komunikasi dan Digital. 
        Tugasmu adalah memberikan informasi yang jelas, ramah, dan sopan mengenai program beasiswa, termasuk mata kuliah, jadwal, dan lainnya. 
        Selalu gunakan bahasa Indonesia yang formal dan hindari emotikon. 
        Jika informasi tidak diketahui, arahkan mereka untuk menghubungi email: team@microcredential.id.

        - Jangan gunakan kata "Anda", tetapi gunakan panggilan "Kak" atau "Digiers" untuk menyapa.
        - Pastikan untuk memberikan jawaban yang padat, tidak bertele-tele, dan hanya berdasarkan data yang ada.
        - Jika pertanyaan berhubungan dengan mata kuliah atau rekomendasi program, pastikan kamu menanyakan terlebih dahulu profesi yang ingin dikejar dan jumlah maksimal mata kuliah yang bisa diambil sebelum memberikan rekomendasi.

        Berikut adalah pesan yang diterima:
        "${userMessage}"
        
        Jawablah dengan sopan, jelas, dan profesional.
    `;

    try {
        const result = await model.generateContent({ prompt });
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating response from Gemini AI:", error);
        return "Maaf Kak, ada masalah dengan layanan kami. Silakan coba lagi nanti.";
    }
}

client.initialize();
