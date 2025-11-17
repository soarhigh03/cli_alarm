import * as vscode from 'vscode';
import { AlertService } from './alertService';

interface CommandExecution {
    commandLine: string;
    startTime: number;
    terminal: vscode.Terminal;
}

interface TerminalState {
    terminal: vscode.Terminal;
    isWatching: boolean;
}

export class TerminalMonitor {
    private terminals: Map<vscode.Terminal, TerminalState> = new Map();
    private executions: Map<vscode.TerminalShellExecution, CommandExecution> = new Map();
    private alertService: AlertService;
    private disposables: vscode.Disposable[] = [];
    private config: vscode.WorkspaceConfiguration;

    constructor(context: vscode.ExtensionContext) {
        this.alertService = new AlertService(context);
        this.config = vscode.workspace.getConfiguration('cliAlarm');

        this.initialize();
        this.setupEventListeners();
    }

    private initialize() {
        // Monitor existing terminals
        vscode.window.terminals.forEach(terminal => {
            this.addTerminal(terminal);
        });

        console.log('[CLI Alarm] Terminal monitor initialized');
    }

    private setupEventListeners() {
        // Listen for new terminals
        this.disposables.push(
            vscode.window.onDidOpenTerminal(terminal => {
                console.log(`[CLI Alarm] New terminal opened: ${terminal.name}`);
                this.addTerminal(terminal);
            })
        );

        // Listen for closed terminals
        this.disposables.push(
            vscode.window.onDidCloseTerminal(terminal => {
                console.log(`[CLI Alarm] Terminal closed: ${terminal.name}`);
                this.removeTerminal(terminal);
            })
        );

        // Listen for shell execution start
        this.disposables.push(
            vscode.window.onDidStartTerminalShellExecution(e => {
                this.handleExecutionStart(e);
            })
        );

        // Listen for shell execution end
        this.disposables.push(
            vscode.window.onDidEndTerminalShellExecution(e => {
                this.handleExecutionEnd(e);
            })
        );

        // Listen for configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('cliAlarm')) {
                    this.config = vscode.workspace.getConfiguration('cliAlarm');
                    console.log('[CLI Alarm] Configuration updated');
                }
            })
        );
    }

    private addTerminal(terminal: vscode.Terminal) {
        const watchAllTerminals = this.config.get<boolean>('watchAllTerminals', true);

        const state: TerminalState = {
            terminal,
            isWatching: watchAllTerminals
        };

        this.terminals.set(terminal, state);

        if (watchAllTerminals) {
            console.log(`[CLI Alarm] Now watching terminal: ${terminal.name}`);
        }
    }

    private removeTerminal(terminal: vscode.Terminal) {
        this.terminals.delete(terminal);
        console.log(`[CLI Alarm] Stopped watching terminal: ${terminal.name}`);
    }

    private handleExecutionStart(event: vscode.TerminalShellExecutionStartEvent) {
        const state = this.terminals.get(event.terminal);
        if (!state || !state.isWatching) {
            return;
        }

        const enabled = this.config.get<boolean>('enabled', true);
        if (!enabled) {
            return;
        }

        const commandLine = event.execution.commandLine.value;
        console.log(`[CLI Alarm] Command started: "${commandLine}" in ${event.terminal.name}`);

        const execution: CommandExecution = {
            commandLine,
            startTime: Date.now(),
            terminal: event.terminal
        };

        this.executions.set(event.execution, execution);
    }

    private handleExecutionEnd(event: vscode.TerminalShellExecutionEndEvent) {
        const execution = this.executions.get(event.execution);
        if (!execution) {
            return;
        }

        const state = this.terminals.get(execution.terminal);
        if (!state || !state.isWatching) {
            this.executions.delete(event.execution);
            return;
        }

        const enabled = this.config.get<boolean>('enabled', true);
        if (!enabled) {
            this.executions.delete(event.execution);
            return;
        }

        const duration = Date.now() - execution.startTime;
        const minDuration = this.config.get<number>('minDuration', 5) * 1000;

        console.log(`[CLI Alarm] Command ended: "${execution.commandLine}" (${duration}ms) in ${execution.terminal.name}`);

        if (duration >= minDuration) {
            console.log(`[CLI Alarm] Triggering alert (duration ${duration}ms >= threshold ${minDuration}ms)`);
            this.alertService.sendAlert(
                execution.terminal,
                execution.commandLine,
                duration,
                event.exitCode
            );
        } else {
            console.log(`[CLI Alarm] Duration too short, skipping alert (${duration}ms < ${minDuration}ms)`);
        }

        this.executions.delete(event.execution);
    }

    public watchTerminal(terminal: vscode.Terminal) {
        const state = this.terminals.get(terminal);
        if (state) {
            state.isWatching = true;
            vscode.window.showInformationMessage(`Now watching terminal: ${terminal.name}`);
        }
    }

    public unwatchTerminal(terminal: vscode.Terminal) {
        const state = this.terminals.get(terminal);
        if (state) {
            state.isWatching = false;
            vscode.window.showInformationMessage(`Stopped watching terminal: ${terminal.name}`);
        }
    }

    public enableAll() {
        for (const state of this.terminals.values()) {
            state.isWatching = true;
        }
        vscode.window.showInformationMessage('CLI Alarm: Monitoring enabled for all terminals');
    }

    public disableAll() {
        for (const state of this.terminals.values()) {
            state.isWatching = false;
        }
        vscode.window.showInformationMessage('CLI Alarm: Monitoring disabled for all terminals');
    }

    public getWatchingCount(): number {
        let count = 0;
        for (const state of this.terminals.values()) {
            if (state.isWatching) {
                count++;
            }
        }
        return count;
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
        this.terminals.clear();
        this.executions.clear();
    }
}
