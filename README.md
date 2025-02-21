# Learning Electron by creating my first application.
[Electron Docs](https://www.electronjs.org/docs/latest/)
```bash
    npm run start
```
This line runs the application in electron, in the package.json the module 
```json 
    "start": "electron ."
```
runs the application when npm run start is called.

# To Create an Window in Electron
```javascript
const {app, BrowserWindow} = require("electron");
```
These two imports are needed:
- app, which controls your application's event lifecycle.
- BrowserWindow, which creates and manages app windows.

The createWindow function loads the web page into a new BrowserWindow
```javascript
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.loadFile("src/index.html")
}
```

This function is calle when the app is ready
```javascript
app.whenReady().then(() => {
    createWindow()
})
```
Many of electrons core modules are Node.js "event emitters" that adhere to Node's async event-driven architecture. "app" module is one of these emitters.

The application creates the window once the promise is fufilled.

```javascript
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})
```
This function quits the app for windows and linux.

```javascript
app.whenReady().then(() => {
    createWindow()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})
```
This function is edited therefore the window is only opened once, so there are not multiple instances of the application.

# Electron is a package
Electron can seemlessly function with other npm packages, such as Front End Frameworks like React, Vue, Next. Electron makes it possible to create applications using the browser to create instances of windows which can render HTML/CSS/JS websites which can be edited and function like a webpage but on the desktop.

# Electron doesn't have in-built reloading for changes done.
Installed the package electron-reload, therefore changes made to the application are rendered on the application in real-time. Without needing to manually load the application persistantly.

# Packaging Electron Application for Distribution
Using Electron Forge which is installed through npm
```bash
npm install --save-dev @electron-forge/cli
npx electron-forge import
```
Forge will update/add new scripts to package.json and new forge.config.js that exports configuration object.

To create a distributable, using the applications make script, which runs which ```electron-forge make```.
```bash
npm run make
```
This command will call the script ```electron-forge make``` under the package.json scripts. The distributed code will be in an out folder containing the packaged application.

# Code Signing for Distribution


# API's Used
- [Weather API](https://open-meteo.com/)
- [Quotes API](https://zenquotes.io/)
- [Pictures API](https://picsum.photos/)
- 

# Can find saved files within %APPDATA% in Roaming on windows.