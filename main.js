console.log("Hello World, from Electron App.")

const {app, BrowserWindow, ipcMain} = require("electron");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');

let win;

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 890,
        frame: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })
    
    /* win.loadURL("https://ranjeth-ravichandran.github.io/portfolio/")
    const contents = win.webContents;
    console.log(contents) */

    win.loadFile("src/foundation.html")
}

app.on('ready', () => {
    createWindow()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

ipcMain.on('close-app', () => {
    app.quit();
});

ipcMain.on('minimise-app', () => {
    win.minimize();
});

// Handle API request for fetching Quote
ipcMain.handle('fetch-quote', async () => {
    try {
        const response = await axios.get('https://zenquotes.io/api/random');
        return response.data[0];
    } catch (error) {
        console.error("API Fetch Error:", error.message);
        return { q: "Failed to fetch quote", a: "Error" };
    }
});

// Handle API request for Current Weather
ipcMain.handle('fetch-weather', async (event, lat, lon) => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,dew_point_2m,wind_speed_10m`
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Fetch Error:", error.message);
        return {error:  "Failed to fetch weather"};
    }
});

// Hnadle API request for Hourly Weather
ipcMain.handle('fetch-hourly-weather', async (event, lat, lon, date) => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&start_date=${date}&end_date=${date}`
        const response = await fetch(url);
        const data = await response.json();
        //console.log(data)
        //console.log(date)
        return data;
    } catch (error) {
        console.error("API Fetch Error:", error.message);
        return {error:  "Failed to fetch weather"};
    }
});

// Hnadle API request for Weekly Weather
ipcMain.handle('fetch-weekly-weather', async (event, lat, lon, startDate, endDate) => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&start_date=${startDate}&end_date=${endDate}`
        const response = await fetch(url);
        const data = await response.json();
        //console.log(data.daily)
        return data.daily;
    } catch (error) {
        console.error("API Fetch Error:", error.message);
        return {error:  "Failed to fetch weather"};
    }
});

// Handle API request for Image
// Create a subdirectory within the temp directory for your app's images
const tempPath = path.join(tmpdir(), 'ElectronDashboardImages');

// Create the directory if it doesn't exist (important!)
fs.mkdirSync(tempPath, { recursive: true });

ipcMain.handle('fetch-image', async (event) => {
    const imageUrl = 'https://picsum.photos/400/200';
    const savePath = path.join(tempPath, `random-${Date.now()}.jpg`); // Unique filename with timestamp

    try {
        const response = await axios({
            url: imageUrl,
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(savePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(savePath));
            writer.on('error', reject);
        });

    } catch (error) {
        console.error("Error fetching image:", error);
        throw error;
    }
});

// Cleanup on startup (this is the key addition)
function cleanupTempFiles() {
    fs.readdirSync(tempPath).forEach(file => {
        const filePath = path.join(tempPath, file);
        fs.unlinkSync(filePath);
    });
}
cleanupTempFiles();

app.on('will-quit', () => {
    fs.rmdirSync(tempPath, { recursive: true, force: true }); // Delete the directory and contents
});

// Enable live reload for all the files inside your project directory
require('electron-reload')(__dirname);