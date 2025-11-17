import * as vscode from 'vscode';
import { TerminalMonitor } from './terminalMonitor';

let terminalMonitor: TerminalMonitor | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('CLI Alarm extension is now active!');

    // Initialize terminal monitor
    terminalMonitor = new TerminalMonitor(context);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('cli-alarm.enable', () => {
            if (terminalMonitor) {
                terminalMonitor.enableAll();
                vscode.workspace.getConfiguration('cliAlarm').update('enabled', true, true);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cli-alarm.disable', () => {
            if (terminalMonitor) {
                terminalMonitor.disableAll();
                vscode.workspace.getConfiguration('cliAlarm').update('enabled', false, true);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cli-alarm.toggle', () => {
            const config = vscode.workspace.getConfiguration('cliAlarm');
            const currentState = config.get<boolean>('enabled', true);
            const newState = !currentState;

            config.update('enabled', newState, true);

            if (terminalMonitor) {
                if (newState) {
                    terminalMonitor.enableAll();
                } else {
                    terminalMonitor.disableAll();
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cli-alarm.watchCurrentTerminal', () => {
            const activeTerminal = vscode.window.activeTerminal;
            if (activeTerminal && terminalMonitor) {
                terminalMonitor.watchTerminal(activeTerminal);
            } else {
                vscode.window.showWarningMessage('No active terminal to watch');
            }
        })
    );

    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'cli-alarm.toggle';
    context.subscriptions.push(statusBarItem);

    // Update status bar
    const updateStatusBar = () => {
        const config = vscode.workspace.getConfiguration('cliAlarm');
        const enabled = config.get<boolean>('enabled', true);
        const watchingCount = terminalMonitor?.getWatchingCount() || 0;

        if (enabled) {
            statusBarItem.text = `$(bell) CLI Alarm (${watchingCount})`;
            statusBarItem.tooltip = `CLI Alarm is enabled. Watching ${watchingCount} terminal(s). Click to toggle.`;
            statusBarItem.backgroundColor = undefined;
        } else {
            statusBarItem.text = `$(bell-slash) CLI Alarm`;
            statusBarItem.tooltip = 'CLI Alarm is disabled. Click to enable.';
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }

        statusBarItem.show();
    };

    // Initial status bar update
    updateStatusBar();

    // Update status bar when configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cliAlarm')) {
                updateStatusBar();
            }
        })
    );

    // Update status bar when terminals change
    context.subscriptions.push(
        vscode.window.onDidOpenTerminal(() => updateStatusBar())
    );
    context.subscriptions.push(
        vscode.window.onDidCloseTerminal(() => updateStatusBar())
    );

    // Periodic status bar update
    const statusBarInterval = setInterval(updateStatusBar, 2000);
    context.subscriptions.push({
        dispose: () => clearInterval(statusBarInterval)
    });

    // Show welcome message
    const hasShownWelcome = context.globalState.get('cliAlarm.hasShownWelcome', false);
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage(
            'CLI Alarm is now active! You\'ll be notified when long-running terminal commands complete.',
            'Configure',
            'Got it'
        ).then(action => {
            if (action === 'Configure') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'cliAlarm');
            }
        });
        context.globalState.update('cliAlarm.hasShownWelcome', true);
    }
}

export function deactivate() {
    if (terminalMonitor) {
        terminalMonitor.dispose();
        terminalMonitor = undefined;
    }
}
