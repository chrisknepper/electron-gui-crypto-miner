// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';

const child_process = require('child_process');
const electron = require('electron');
const path = require('path');
const currentWindow = electron.remote.getCurrentWindow();

const { shell } = require('electron');

const IS_MAC = (process.platform === 'darwin');
const IS_WINDOWS = (process.platform === 'win32');

export default class Home extends Component {
  
  constructor(props) {
    super(props);

    this.openRedditLink = this.openRedditLink.bind(this);
    this.end = this.end.bind(this);
    this.mine = this.mine.bind(this);
    this.getMiningExecutable = this.getMiningExecutable.bind(this);
    this.getMiningConfig = this.getMiningConfig.bind(this);
    this.getMiningStatusText = this.getMiningStatusText.bind(this);

    this.state = {
      miningProcess: null,
      walletAddress: ''
    }
  }

  openRedditLink() {
    shell.openExternal('https://www.reddit.com/r/Monero/comments/7hhgjx/monero_gui_01110_helium_hydra_megathread_download/');
  }


  mine() {
    console.log('mounted!', process.platform);
    console.log('static', __dirname);
    console.log('path to bundled program');
    console.log('running at ', currentWindow.appInfo.path);
    const miningProg = this.getMiningExecutable();
    const miningProgConfig = this.getMiningConfig();
    console.log('going to run ', miningProg);
    const externalProcess = child_process.spawn(miningProg, [
      `--config`,
      miningProgConfig
    ]);
    externalProcess.on('message',  (data) => {
      const dataStr = data.toString();
      console.log('message from external program', dataStr);
    });
    externalProcess.stdout.on('data',  (data) => {
      const dataStr = data.toString();
      console.log('data from external program ', dataStr);
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
  
  getMiningExecutable() {
    const rootBinDir = path.resolve(__dirname, 'bin');

    let prog = null;
    if (IS_MAC) {
      prog = path.resolve(rootBinDir, 'miner', 'xmr-stak', 'bin', 'xmr-stak');
    } else {
      console.warn('Mining not yet implemented for this platform');
    }

    return prog;
  }

  getMiningConfig() {
    const rootBinDir = path.resolve(__dirname, 'bin');

    let prog = null;
    if (IS_MAC) {
      prog = path.resolve(rootBinDir, 'miner', 'xmr-stak', 'bin', 'config.txt');
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
        <button className={styles.button} onClick={this.mine}>Start Mining</button>
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

  render() {
    return (
      <div>
        <div className={styles.container} data-tid="container">
          <div className={styles.header}>
            <h1>Freedom<span className={styles.alt}>XMR</span></h1>
            <h2><a href="#" target="_blank" onClick={this.openRedditLink}>Wallet GUI Download</a></h2>
            <h2>Wallet Address: <input type="text" size="75" value="46KzZqwjZyQZKKLfCqyHSW9vnmaQJPMpHQHPqmmT63sxVu1ZKuXh7bg2EMUwxLkkv7KJRoTr2BtbPSyamSZ4CiogBed2MC6" /></h2>
          </div>
          <div className={styles.body}>
            <h2>System status: {this.getMiningStatusText()}</h2>
            { this.maybeRenderStartMiningButton() }
            { this.maybeRenderStopMiningButton() }
            { /*<button className={styles.button} ><Link to="/counter">Start Mining</Link></button> */ }
          </div>
        </div>
      </div>
    );
  }

  // Based on electron-react-boilerplate
}
