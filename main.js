'use strict';

const electron = require('electron'),
      GlobalShortcut = require('electron').globalShortcut,
      Clipboard = require('electron').clipboard,
      BrowserWindow = electron.BrowserWindow,
      Dialog = require('electron').dialog,
      Ipc = require('electron').ipcMain,
      App = electron.app,
      Fs = require('fs');
      
let   mainWindow = null,subWindow = null;
  
// 当所有窗口关闭时 结束进程.
App.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    App.quit();
  }
});

// 程序成功启动事件
App.on('ready', function() {
  // 创建操作窗口
  mainWindow = new BrowserWindow({width: 92, height: 36, 
    resizable: false, //不能改变窗口大小
    frame: false,
    alwaysOnTop: true,//始终在最前端
    //fullscreen: true,
    skipTaskbar: true//是否在任务栏中显示窗口
  });
  
  //注册快捷键
  //取消截图
  GlobalShortcut.register('ctrl+shift+q', function () {
    mainWindow.webContents.send('global-shortcut-quit', 1);
  });
  //开始截图
  GlobalShortcut.register('ctrl+shift+c', function () {
    mainWindow.webContents.send('global-shortcut-capture', 1);
  });
  
  
  // 加载软件主页面.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
  
  Ipc.on('close', function () {
    App.quit();
  });
  
  Ipc.on('create-sub-window', function (e, wh) {
    mainWindow.hide();
    subWindow = new BrowserWindow({
      width: wh[0], 
      height: wh[1], 
      resizable: false, //不可改变大小
      skipTaskbar: true, //无任务栏图标
      frame: false, //
      alwaysOnTop: true,//总是在最前
      hasShadow:false,
      transparent:true,
      show:false
    });
    //subWindow.webContents.openDevTools()
    let webContents = subWindow.webContents;
    subWindow.loadURL('file://' + __dirname + '/sub.html');
    webContents.on('did-finish-load', (event) => {
      subWindow.show();
    });
  });
  
  Ipc.on('close-subwindow', function () {
    subWindow.close();
    mainWindow.show();
  });
  
  Ipc.on('cut', function (e, arg) {
    subWindow.capturePage(arg, function (image) {
      Clipboard.writeImage(image)
      subWindow.close()
      mainWindow.show()
    })
  })
  
  Ipc.on('save-to-fs', function (e, arg) {
    subWindow.capturePage(arg, function (image) {
      subWindow.setAlwaysOnTop(false)
      Dialog.showSaveDialog({title: '请选择保存路径', defaultPath: 'E:/', filters: [
        { name: 'Images', extensions: ['png'] }
      ]}, function (p) {
        Fs.writeFile(p, image.toPng(), function () {
          subWindow.close()
          mainWindow.show()
        })
      })
    })
  })
});