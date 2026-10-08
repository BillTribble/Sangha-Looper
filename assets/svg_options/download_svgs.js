const https = require('https');
const fs = require('fs');

const icons = {
    microphone: [
        'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/mic.svg',
        'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/mic-2.svg',
        'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/mic-vocal.svg',
        'https://raw.githubusercontent.com/feathericons/feather/master/icons/mic.svg',
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/microphone.svg'
    ],
    synthesizer: [
        'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/piano.svg',
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/piano.svg',
        'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/music-4.svg',
        'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/audio-waveform.svg',
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/keyboard.svg'
    ],
    guitar: [
        'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/guitar.svg',
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/guitar-pick.svg',
        'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/music.svg',
        'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/music-2.svg',
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/music.svg'
    ]
};

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                download(response.headers.location, dest).then(resolve).catch(reject);
            } else {
                reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err.message));
        });
    });
}

async function run() {
    for (const [category, urls] of Object.entries(icons)) {
        for (let i = 0; i < urls.length; i++) {
            const dest = `/Users/billt/Sites/Sangha-Looper/assets/svg_options/${category}_${i + 1}.svg`;
            console.log(`Downloading ${dest}...`);
            try {
                await download(urls[i], dest);
            } catch (e) {
                console.error(`Failed to download ${urls[i]}: ${e}`);
            }
        }
    }
}

run();
