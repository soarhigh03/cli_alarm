import * as vscode from 'vscode';
import notifier from 'node-notifier';

export class AlertService {
    private context: vscode.ExtensionContext;
    private config: vscode.WorkspaceConfiguration;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = vscode.workspace.getConfiguration('cliAlarm');

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cliAlarm')) {
                this.config = vscode.workspace.getConfiguration('cliAlarm');
            }
        });
    }

    public async sendAlert(
        terminal: vscode.Terminal,
        commandName: string,
        duration: number,
        exitCode: number | undefined
    ) {
        const enabled = this.config.get<boolean>('enabled', true);
        if (!enabled) {
            return;
        }

        // Play sound
        if (this.config.get<boolean>('playSound', true)) {
            this.playSound();
        }

        // Show notification
        if (this.config.get<boolean>('showNotification', true)) {
            await this.showNotification(terminal, commandName, duration, exitCode);
        }

        // Focus terminal
        if (this.config.get<boolean>('focusTerminal', false)) {
            terminal.show();
        }
    }

    private playSound() {
        // VSCode doesn't have built-in sound API, but we can use the system bell
        // or execute a system command
        try {
            // On macOS, use afplay with system sound
            if (process.platform === 'darwin') {
                const cp = require('child_process');
                // Use system notification sound
                cp.exec('afplay /System/Library/Sounds/Glass.aiff', (error: any) => {
                    if (error) {
                        console.log('[CLI Alarm] Could not play sound:', error);
                    }
                });
            } else if (process.platform === 'linux') {
                const cp = require('child_process');
                // Try to use paplay (PulseAudio) or aplay (ALSA)
                cp.exec('paplay /usr/share/sounds/freedesktop/stereo/complete.oga || aplay /usr/share/sounds/alsa/Front_Center.wav', (error: any) => {
                    if (error) {
                        console.log('[CLI Alarm] Could not play sound:', error);
                    }
                });
            } else if (process.platform === 'win32') {
                const cp = require('child_process');
                // Windows - use powershell to play a beep
                cp.exec('powershell -c [console]::beep(800,300)', (error: any) => {
                    if (error) {
                        console.log('[CLI Alarm] Could not play sound:', error);
                    }
                });
            }
        } catch (error) {
            console.log('[CLI Alarm] Error playing sound:', error);
        }
    }

    private async showNotification(
        terminal: vscode.Terminal,
        commandName: string,
        duration: number,
        exitCode: number | undefined
    ) {
        const durationSeconds = Math.round(duration / 1000);
        const includeCommand = this.config.get<boolean>('includeCommandInNotification', true);
        const useSystemNotification = this.config.get<boolean>('useSystemNotification', true);

        let title = 'CLI Alarm - Task Complete';
        let message = '';

        if (includeCommand) {
            message = `"${commandName}" finished in ${durationSeconds}s`;
        } else {
            message = `Task in ${terminal.name} finished in ${durationSeconds}s`;
        }

        // Add exit code if available and non-zero
        if (exitCode !== undefined && exitCode !== 0) {
            title = 'CLI Alarm - Task Failed';
            message += ` (Exit code: ${exitCode})`;
        }

        // Check if running in remote environment
        const isRemote = vscode.env.remoteName !== undefined;

        // In remote mode, always use VSCode notifications (they appear on local machine)
        // System notifications would only appear on the remote server
        if (isRemote) {
            console.log('[CLI Alarm] Remote environment detected, using VSCode notifications');
            await this.sendVSCodeNotification(terminal, title, message);
        } else if (useSystemNotification) {
            this.sendSystemNotification(terminal, title, message);
        } else {
            await this.sendVSCodeNotification(terminal, title, message);
        }
    }

    private sendSystemNotification(terminal: vscode.Terminal, title: string, message: string) {
        try {
            console.log('[CLI Alarm] Attempting to send system notification...');
            console.log('[CLI Alarm] Platform:', process.platform);
            console.log('[CLI Alarm] Title:', title);
            console.log('[CLI Alarm] Message:', message);

            if (process.platform === 'darwin') {
                // Use osascript for macOS - more reliable than node-notifier
                this.sendMacOSNotification(terminal, title, message);
            } else {
                // Use node-notifier for Windows and Linux
                const notificationOptions: any = {
                    title: title,
                    message: message,
                    sound: false,
                    wait: false,
                    timeout: 10,
                };

                if (process.platform === 'win32') {
                    notificationOptions.appID = 'CLI Alarm';
                }

                notifier.notify(notificationOptions, (err, response, metadata) => {
                    console.log('[CLI Alarm] Notification callback:', { err, response, metadata });
                    if (err) {
                        console.error('[CLI Alarm] Notification error:', err);
                    }
                });

                console.log('[CLI Alarm] System notification sent successfully');
            }
        } catch (error) {
            console.error('[CLI Alarm] Failed to send system notification:', error);
            // Fallback to VSCode notification
            this.sendVSCodeNotification(terminal, title, message);
        }
    }

    private sendMacOSNotification(terminal: vscode.Terminal, title: string, message: string) {
        const cp = require('child_process');

        // Escape quotes in message and title
        const safeTitle = title.replace(/"/g, '\\"');
        const safeMessage = message.replace(/"/g, '\\"');
        const safeSubtitle = terminal.name.replace(/"/g, '\\"');

        // Use AppleScript to show notification
        const script = `display notification "${safeMessage}" with title "${safeTitle}" subtitle "${safeSubtitle}"`;

        console.log('[CLI Alarm] Using osascript for macOS notification');
        console.log('[CLI Alarm] Script:', script);

        cp.exec(`osascript -e '${script}'`, (error: any, stdout: any, stderr: any) => {
            if (error) {
                console.error('[CLI Alarm] osascript error:', error);
                console.error('[CLI Alarm] stderr:', stderr);
                // Fallback to VSCode notification
                this.sendVSCodeNotification(terminal, title, message);
            } else {
                console.log('[CLI Alarm] macOS notification sent successfully');
                console.log('[CLI Alarm] stdout:', stdout);
            }
        });
    }

    private async sendVSCodeNotification(terminal: vscode.Terminal, title: string, message: string) {
        const action = await vscode.window.showInformationMessage(
            `${title}: ${message}`,
            'Show Terminal',
            'Dismiss'
        );

        if (action === 'Show Terminal') {
            terminal.show();
        }
    }

    public dispose() {
        // Cleanup if needed
    }
}
