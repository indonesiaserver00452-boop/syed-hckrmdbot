# Syed-Hckrmdbot

**Syed-Hckrmdbot** ek advanced WhatsApp bot hai jo mukhtalif tasks aur automation ke liye design kiya gaya hai. Yeh bot users ko messaging, media handling, aur dusre interactive features ke zariye behtar tajurba faraham karta hai.

## Features

*   **Advanced Messaging:** Text messages, media (photos, videos, audio), aur documents ko handle karta hai.
*   **Interactive Commands:** Mukhtalif commands ke zariye users bot se interact kar sakte hain.
*   **Media Processing:** Images aur videos ko process karne ki salahiyat rakhta hai.
*   **Customizable Settings:** Bot ki settings ko asani se customize kiya ja sakta hai.
*   **Anti-Link Feature:** Groups mein unwanted links ko detect aur remove karta hai.
*   **Auto-React:** Messages par automatically react karta hai.
*   **Database Integration:** User data aur settings ko store karne ke liye database ka istemal karta hai.

## Setup Guide

Bot ko set up karne ke liye in steps ko follow karein:

### 1. Repository Clone Karein

Sab se pehle, is repository ko apne local system par clone karein:

```bash
git clone https://github.com/indonesiaserver00452-boop/syed-hckrmdbot.git
cd syed-hckrmdbot
```

### 2. Dependencies Install Karein

Zaroori dependencies install karne ke liye `npm` ka istemal karein:

```bash
npm install
```

### 3. Configuration

`setting.json` aur `setting/config.js` files mein apni zaroorat ke mutabiq settings configure karein. Khaas taur par, `drenox.js` file mein **Groq API Key** ko update karna na bhulein:

```javascript
// drenox.js file mein is line ko dhoondein:
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE'; // Apni asli Groq API key yahan dalein
```

### 4. Bot Run Karein

Bot ko start karne ke liye yeh command use karein:

```bash
npm start
```

Ya `pm2` ka istemal kar sakte hain background mein run karne ke liye:

```bash
pm2 start ecosystem.config.js
```

## Usage

Bot start hone ke baad, aap isse WhatsApp par mukhtalif commands ke zariye interact kar sakte hain. Commands ki complete list ke liye bot ko message karein ya `commands/` directory mein files check karein.

## Contributing

Agar aap is project mein contribute karna chahte hain, to pull requests ka khair maqdam hai. Mazeed maloomat ke liye `CONTRIBUTING.md` file (agar maujood ho) check karein.

## License

Yeh project [MIT License](LICENSE) ke तहत license shuda hai.
