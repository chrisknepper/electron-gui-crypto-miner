// @flow
import { app, Menu, shell, BrowserWindow } from 'electron';

export default class MenuBuilder {
  mainWindow: BrowserWindow;
  licenseWindow: BrowserWindow;
  rootExtraDir: String;

  constructor(mainWindow: BrowserWindow, rootExtraDir: string) {
    this.mainWindow = mainWindow;
    this.licenseWindow = null;
    this.aboutWindow = null;
    this.rootExtraDir = rootExtraDir;
  }

  buildMenu(rootExtraDir) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
      this.setupDevelopmentEnvironment();
    }

    let template;

    if (process.platform === 'darwin') {
      template = this.buildDarwinTemplate();
    } else {
      template = this.buildDefaultTemplate();
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu
        .buildFromTemplate([{
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }])
        .popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Freedom XMR Miner',
      submenu: [
        { label: 'About FreedomXMR', click: () => { this.openAboutWindow(); } },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide Freedom XMR Miner', accelerator: 'Command+H', selector: 'hide:' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', selector: 'hideOtherApplications:' },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => { app.quit(); } }
      ]
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'Command+A', selector: 'selectAll:' }
      ]
    };
    const subMenuViewDev = {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'Command+R', click: () => { this.mainWindow.webContents.reload(); } },
        { label: 'Toggle Full Screen', accelerator: 'Ctrl+Command+F', click: () => { this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen()); } },
        { label: 'Toggle Developer Tools', accelerator: 'Alt+Command+I', click: () => { this.mainWindow.toggleDevTools(); } }
      ]
    };
    const subMenuViewProd = {
      label: 'View',
      submenu: [
        { label: 'Toggle Full Screen', accelerator: 'Ctrl+Command+F', click: () => { this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen()); } }
      ]
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Command+M', selector: 'performMiniaturize:' },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        { label: 'Learn More', click() { shell.openExternal('https://github.com/chrisknepper/electron-gui-crypto-miner'); } },
        { label: 'Open Dev Tools (plz no bully)', click: () => { this.mainWindow.toggleDevTools(); } },
        { label: 'Open Source Licenses', click: () => { this.openLicenseWindow(); } }
      ]
    };

    const subMenuView = process.env.NODE_ENV === 'development'
      ? subMenuViewDev
      : subMenuViewProd;

    return [
      subMenuAbout,
      subMenuEdit,
      subMenuView,
      subMenuWindow,
      subMenuHelp
    ];
  }

  buildDefaultTemplate() {
    const templateDefault = [{
      label: '&File',
      submenu: [{
        label: '&Open',
        accelerator: 'Ctrl+O'
      }, {
        label: '&Close',
        accelerator: 'Ctrl+W',
        click: () => {
          this.mainWindow.close();
        }
      }]
    }, {
      label: '&View',
      submenu: (process.env.NODE_ENV === 'development') ? [{
        label: '&Reload',
        accelerator: 'Ctrl+R',
        click: () => {
          this.mainWindow.webContents.reload();
        }
      }, {
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click: () => {
          this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
        }
      }, {
        label: 'Toggle &Developer Tools',
        accelerator: 'Alt+Ctrl+I',
        click: () => {
          this.mainWindow.toggleDevTools();
        }
      }] : [{
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click: () => {
          this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
        }
      }]
    }, {
      label: 'Help',
      submenu: [
        { label: 'Learn More', click() { shell.openExternal('https://github.com/chrisknepper/electron-gui-crypto-miner'); } },
        { label: 'Open Dev Tools (plz no bully)', click: () => { this.mainWindow.toggleDevTools(); } },
        { label: 'Open Source Licenses', click: () => { this.openLicenseWindow(); } },
        { label: 'About FreedomXMR', click: () => { this.openAboutWindow(); } }
      ]
    }];

    return templateDefault;
  }

  openLicenseWindow() {
    if (this.licenseWindow) {
      this.licenseWindow.focus();
      return;
    }

    this.licenseWindow = new BrowserWindow({
      height: 450,
      resizable: false,
      width: 360,
      title: 'Open Source Licenses',
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      titleBarStyle: 'hiddenInset'
    });

    this.licenseWindow.setMenu(null);

    this.licenseWindow.loadURL('file://' + this.rootExtraDir + '/OpenSourceLicenses.html');

    this.licenseWindow.on('closed', () => {
      this.licenseWindow = null;
    });
  }

  openAboutWindow() {
    if (this.aboutWindow) {
      this.aboutWindow.focus();
      return;
    }

    this.aboutWindow = new BrowserWindow({
      height: 450,
      resizable: false,
      width: 360,
      title: 'About',
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      titleBarStyle: 'hiddenInset'
    });

    this.aboutWindow.setMenu(null);

    this.aboutWindow.loadURL('file://' + this.rootExtraDir + '/About.html');

    this.aboutWindow.on('closed', () => {
      this.aboutWindow = null;
    });
  }
}
