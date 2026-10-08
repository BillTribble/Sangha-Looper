const https = require('https');
const fs = require('fs');

const icons = {
    microphone: [
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/packages/icons/icons/microphone.svg',
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/packages/icons/icons/microphone-2.svg',
        'https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/microphone.svg',
        'https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/microphone-stage.svg'
    ],
    synthesizer: [
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/packages/icons/icons/piano.svg',
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/packages/icons/icons/music.svg',
        'https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/piano-keys.svg',
        'https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/music-notes.svg'
    ],
    guitar: [
        'https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/guitar.svg',
        'https://raw.githubusercontent.com/tabler/tabler-icons/master/packages/icons/icons/guitar-pick.svg'
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
    let counts = { microphone: 3, synthesizer: 3, guitar: 3 }; // start from previous successes
    for (const [category, urls] of Object.entries(icons)) {
        for (let i = 0; i < urls.length; i++) {
            counts[category]++;
            const dest = `/Users/billt/Sites/Sangha-Looper/assets/svg_options/${category}_${counts[category]}.svg`;
            console.log(`Downloading ${dest}...`);
            try {
                await download(urls[i], dest);
            } catch (e) {
                console.error(`Failed to download ${urls[i]}: ${e}`);
                counts[category]--;
            }
        }
    }
}

run();
