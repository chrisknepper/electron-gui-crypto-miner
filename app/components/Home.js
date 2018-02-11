// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';

const child_process = require('child_process');
const electron = require('electron');
const path = require('path');
const currentWindow = electron.remote.getCurrentWindow();
const LOCAL_APP_VERSION = currentWindow.appInfo.version;

const { shell } = require('electron');

const IS_MAC = (process.platform === 'darwin');
const IS_WINDOWS = (process.platform === 'win32');

console.log('hey dawg, the resources path is', currentWindow.appInfo.resourcesPath);
console.log('hey dawg, the environment is production?', currentWindow.appInfo.isProduction);
console.log('hey dawg, the bin directory is', currentWindow.appInfo.rootBinDir);

export default class Home extends Component {
  
  constructor(props) {
    super(props);

    this.openWalletArticleLink = this.openWalletArticleLink.bind(this);
    this.openUpdateLink = this.openUpdateLink.bind(this);
    this.end = this.end.bind(this);
    this.mine = this.mine.bind(this);
    this.appendLog = this.appendLog.bind(this);
    this.handleWalletAddressChange = this.handleWalletAddressChange.bind(this);
    this.getMiningExecutable = this.getMiningExecutable.bind(this);
    this.getMiningConfig = this.getMiningConfig.bind(this);
    this.getCpuMiningConfig = this.getCpuMiningConfig.bind(this);
    this.getMiningStatusText = this.getMiningStatusText.bind(this);

    this.getLatestVersionOfApp = this.getLatestVersionOfApp.bind(this);

    this.renderAppVersion = this.renderAppVersion.bind(this);

    this.state = {
      miningProcess: null,
      walletAddress: '',
      appOutOfDate: false,
      showLog: false,
      logArray: []
    }
  }

  async componentDidMount() {

    const storedWalletAddress = localStorage.getItem('walletAddress');
    if (storedWalletAddress) {
      this.setState({ walletAddress: storedWalletAddress });
    }

    const latestLocalVersion = LOCAL_APP_VERSION;
    const latestRemoteVersion = await this.getLatestVersionOfApp();

    if (latestLocalVersion && latestRemoteVersion) {
      const outOfDate = this.determineVersionOutOfDate(latestLocalVersion, latestRemoteVersion);

      if (outOfDate) {
        console.warn('not on latest version!');
        this.setState({appOutOfDate: true});
      }
    }
    
  }

  componentWillUnmount() {
    this.end();
  }

  async getLatestVersionOfApp() {
    const url = 'https://api.github.com/repos/chrisknepper/electron-gui-crypto-miner/releases/latest';

    try {
      const rawLatestVersion = await fetch(url, {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      });

      const jsonLatestVersion = await rawLatestVersion.json();

      if (jsonLatestVersion && 'tag_name' in jsonLatestVersion) {
        const latestVersion = jsonLatestVersion.tag_name;
        console.log('latest version', latestVersion);
        return latestVersion;
      }


    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  determineVersionOutOfDate(localVersion, remoteVersion) {
    const localVersionNum = this.determineVersionStringToNumber(localVersion);
    const remoteVersionNum = this.determineVersionStringToNumber(remoteVersion);
    return remoteVersionNum > localVersionNum;
  }

  determineVersionStringToNumber(versionStr) {
    return Number(versionStr.replace('v', '').replace(/\./g, ''));
  }

  handleWalletAddressChange(event) {
    const newValue = event.target.value;
    this.setState({walletAddress: newValue}, () => {
      localStorage.setItem('walletAddress', newValue);
    });
  }

  openWalletArticleLink() {
    shell.openExternal('https://medium.com/@samradavid/the-easiest-monero-wallet-installation-guide-e51e5cecb38d');
  }

  openUpdateLink() {
    shell.openExternal('https://github.com/chrisknepper/electron-gui-crypto-miner');
  }

  mine() {
    console.log('mounted!', process.platform);
    console.log('static', __dirname);
    console.log('path to bundled program');
    console.log('running at ', currentWindow.appInfo.path);
    const miningProg = this.getMiningExecutable();
    const miningProgConfig = this.getMiningConfig();
    const cpuMiningConfig = this.getCpuMiningConfig();
    // const externalProcess = child_process.spawn(miningProg, [
    //   `--config`,
    //   miningProgConfig
    // ]);
    const externalProcess = child_process.spawn(miningProg, [
      '--config',
      miningProgConfig,
      '--cpu',
      cpuMiningConfig,
      `--url`,
      '45.79.200.148:3333',
      '--user',
      this.state.walletAddress
    ]);
    externalProcess.on('message',  (data) => {
      const dataStr = data.toString();
      console.log('message from external program', dataStr);
    });
    externalProcess.stdout.on('data',  (data) => {
      const dataStr = data.toString();
      console.log('data from external program ', dataStr);
      this.appendLog(dataStr);
    });
    externalProcess.stderr.on('data',  (data) => {
      const dataStr = data.toString();
      console.log('error from external program ', dataStr);
    });
    externalProcess.on('close',  (code) => {
      console.log('external program closed ', code);
      this.setState({miningProcess: null});
    });

    process.on('exit', () => this.end());

    this.setState({miningProcess: externalProcess});
  }

  end() {
    if (this.state.miningProcess) {
      console.warn('trying to kill mining process');
      
      this.state.miningProcess.kill('SIGTERM');
    }
  }

  appendLog(line) {
    if (this.state.showLog) {
      const newLogArray = [...this.state.logArray];
      if (this.state.logArray.length > 10) {
        newLogArray.shift();
      }
      newLogArray.push(line);
      this.setState({ logArray: newLogArray });
    }
  }
  
  getMiningExecutable() {
    const { rootBinDir } = currentWindow.appInfo;

    let prog = null;
    if (IS_MAC) {
      prog = path.resolve(rootBinDir, 'miner', 'xmr-stak', 'bin', 'xmr-stak');
    } else if (IS_WINDOWS) {
      console.warn('windows!');
      prog = path.resolve(rootBinDir, 'miner', 'xmr-stak', 'bin', 'xmr-stak.exe');
    } else {
      console.warn('Mining not yet implemented for this platform');
    }
    console.log('the exe to run is at', prog);
    return prog;
  }

  getMiningConfig() {
    const { rootBinDir } = currentWindow.appInfo;

    let prog = null;
    if (IS_MAC) {
      prog = path.resolve(rootBinDir, 'miner', 'xmr-stak', 'bin', 'config.txt');
    } else if (IS_WINDOWS) {
      prog = path.resolve(rootBinDir, 'miner', 'xmr-stak', 'bin', 'config.txt');
    } else {
      console.warn('Mining config not yet implemented for this platform');
    }

    return prog;
  }

  getCpuMiningConfig() {
    const { rootBinDir } = currentWindow.appInfo;

    let prog = null;
    if (IS_MAC) {
      prog = path.resolve(rootBinDir, 'miner', 'xmr-stak', 'bin', 'cpu.txt');
    } else if (IS_WINDOWS) {
      prog = path.resolve(rootBinDir, 'miner', 'xmr-stak', 'bin', 'cpu.txt');
    } else {
      console.warn('Mining config not yet implemented for this platform');
    }

    return prog;
  }

  getMiningStatusText() {
    if (this.state.miningProcess) {
      return 'Mining';
    } else {
      return 'Not mining';
    }
  }

  maybeRenderStartMiningButton() {
    if (!this.state.miningProcess) {
      return (
        <button className={styles.button} disabled={(!this.state.walletAddress.length)} onClick={this.mine}>Start Mining</button>
      );
    }
  }

  maybeRenderStopMiningButton() {
    if (this.state.miningProcess) {
      return (
        <button className={styles.button2} onClick={this.end}>Stop Mining</button>
      );
    }
  }

  renderAppVersion() {
    return (
      <h4 className={styles.version}><a href="#" onClick={this.openUpdateLink}>v{LOCAL_APP_VERSION}</a></h4>
    );
  }

  renderOutOfDateNotification() {
    if (this.state.appOutOfDate) {
      return <h5 className={styles.versionOutOfDate}><a href="#" onClick={this.openUpdateLink}>You are running an old version! Click here to update.</a></h5>
    }
  }

  renderConsoleLogCheckbox() {
    return (
      <div className={styles.showLogCheckbox}>
        <label>
          <input
            name="showLog"
            type="checkbox"
            checked={this.state.showLog}
            onChange={(event) => {console.log('checked?', event.target.checked); this.setState({showLog: event.target.checked})}} /> Display Logs
        </label>
      </div>
    
    );
  }

  renderConsoleLog() {
    if (this.state.showLog) {
      return (
        <div className={styles.logContainer}>
          { this.state.logArray.map((log) => {
              return <span className={styles.log}>{log}</span>
            })
          }
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <div className={styles.header}>
            <img src="assets/icon.png" alt="Logo for Freedom XMR" />
            <h1 className={styles.headerText}>Freedom <span className={styles.alt}>XMR</span></h1>
            <h2>Wallet Address: <input type="text" size="40" className={styles.walletAddressInput} onChange={this.handleWalletAddressChange} value={this.state.walletAddress} placeholder={'Enter your wallet address here'} disabled={(this.state.miningProcess)} /></h2>
            <h3><a href="#" onClick={this.openWalletArticleLink}>Wallet Download Guide</a></h3>
          </div>
          <div className={styles.body}>
            <h2>System status: {this.getMiningStatusText()}</h2>
            { this.maybeRenderStartMiningButton() }
            { this.maybeRenderStopMiningButton() }
            { /*<button className={styles.button} ><Link to="/counter">Start Mining</Link></button> */ }
            { this.renderConsoleLog() }
            <div>
              { this.renderAppVersion() }
              { this.renderOutOfDateNotification() }
              { this.renderConsoleLogCheckbox() }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Based on electron-react-boilerplate
}
