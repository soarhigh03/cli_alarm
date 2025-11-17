# CLI Alarm

> Hey Mac, wake me up when the task is done... only when the task is done!

A VSCode extension that monitors your terminal sessions and alerts you when long-running commands complete. Perfect for those build scripts, test suites, or any CLI task that takes more than a few seconds.

## Features

- **Multi-Terminal Monitoring**: Automatically watches all terminal sessions simultaneously
- **Smart Detection**: Only alerts on commands that exceed a configurable duration threshold
- **Multiple Alert Types**:
  - Visual notifications with command details
  - System sounds (macOS, Linux, Windows)
  - Optional terminal focus
- **Flexible Configuration**: Customize alert behavior, minimum duration, and monitoring preferences
- **Status Bar Integration**: See monitoring status at a glance
- **Shell Integration**: Uses VSCode's shell integration API for accurate command detection

## Installation

### Development Mode

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/cli_alarm.git
   cd cli_alarm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Open in VSCode:
   ```bash
   code .
   ```

5. Press `F5` to open a new VSCode window with the extension loaded

### From VSIX (Coming Soon)

```bash
code --install-extension cli-alarm-0.0.1.vsix
```

## Usage

### Basic Usage

Once installed, CLI Alarm automatically starts monitoring all terminals. By default:
- Commands that run for **5+ seconds** trigger an alert
- You'll get a **notification** with command details
- A **sound** plays to grab your attention

### Commands

Access these commands via the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`):

- `CLI Alarm: Enable Monitoring` - Enable monitoring for all terminals
- `CLI Alarm: Disable Monitoring` - Disable monitoring for all terminals
- `CLI Alarm: Toggle Monitoring` - Toggle monitoring on/off
- `CLI Alarm: Watch Current Terminal` - Explicitly watch the active terminal

### Status Bar

The status bar shows:
- Bell icon when active: `$(bell) CLI Alarm (3)` - monitoring 3 terminals
- Slashed bell when disabled: `$(bell-slash) CLI Alarm`
- Click to toggle monitoring on/off

## Configuration

Access settings via `Preferences > Settings > CLI Alarm` or directly in `settings.json`:

```json
{
  "cliAlarm.enabled": true,                      // Enable/disable monitoring
  "cliAlarm.minDuration": 5,                     // Minimum seconds to trigger alert
  "cliAlarm.showNotification": true,             // Show visual notification
  "cliAlarm.useSystemNotification": true,        // Use system notifications (macOS/Windows/Linux)
  "cliAlarm.playSound": true,                    // Play completion sound
  "cliAlarm.focusTerminal": false,               // Auto-focus terminal on completion
  "cliAlarm.includeCommandInNotification": true, // Show command name in notification
  "cliAlarm.watchAllTerminals": true             // Auto-watch all terminals
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Master enable/disable switch |
| `minDuration` | number | `5` | Minimum command duration (seconds) to trigger alert |
| `showNotification` | boolean | `true` | Display notification when command completes |
| `useSystemNotification` | boolean | `true` | Use system-wide notifications (macOS Notification Center, Windows Action Center, Linux notify-send). Set to false for Remote SSH. |
| `playSound` | boolean | `true` | Play system sound on completion |
| `focusTerminal` | boolean | `false` | Automatically show terminal when command completes |
| `includeCommandInNotification` | boolean | `true` | Include command name in notification message |
| `watchAllTerminals` | boolean | `true` | Automatically monitor all terminals (vs. manual selection) |

## Use Cases

### Long Builds
```bash
npm run build  # Takes 2 minutes
# Get notified when complete!
```

### Test Suites
```bash
pytest tests/  # Takes 30 seconds
# Focus back on VSCode when tests finish
```

### Docker Operations
```bash
docker-compose up --build  # Takes 5 minutes
# Get alerted when containers are ready
```

### Package Installation
```bash
npm install  # Large dependency tree
# Know when it's done without watching
```

## Platform Support

- **macOS**: Uses system sounds via `afplay`
- **Linux**: Uses PulseAudio (`paplay`) or ALSA (`aplay`)
- **Windows**: Uses PowerShell beep

## Requirements

- VSCode version 1.85.0 or higher
- Terminal shell integration enabled (VSCode automatically enables this for most shells)

## Remote SSH Support

CLI Alarm works seamlessly with VSCode Remote SSH! The extension runs on the remote server and monitors terminal sessions there.

### Setup for Remote SSH

1. **Install the extension** on your remote server (VSCode will prompt you automatically)

2. **No configuration needed!**
   - The extension **automatically detects** Remote SSH mode
   - Automatically uses VSCode notifications (appear on your local machine)
   - No need to change `useSystemNotification` setting

3. **All features work remotely**:
   - Terminal monitoring on remote server ✅
   - Notifications appear on your **local machine** ✅
   - Click notifications to jump to remote terminal ✅
   - Status bar shows on local machine ✅

### Remote SSH Tips

- **Automatic Remote Detection**: Extension detects Remote SSH and uses VSCode notifications
- **Local Notifications**: All notifications appear on your local machine automatically
- **Why not system notifications?**: Extensions run on the remote server, so macOS system notifications would appear there (not helpful). VSCode notifications are better for remote work.
- Click "Show Terminal" in the notification to jump to the remote terminal
- All settings can be configured in your remote workspace settings

## How It Works

CLI Alarm uses VSCode's terminal API to:
1. Monitor all terminal instances
2. Detect when commands start and complete using shell integration
3. Calculate execution duration
4. Trigger configurable alerts for long-running commands

The extension is lightweight and runs in the background without impacting terminal performance.

## Development

### Project Structure

```
cli_alarm/
├── src/
│   ├── extension.ts         # Extension entry point
│   ├── terminalMonitor.ts   # Terminal monitoring logic
│   └── alertService.ts      # Alert handling
├── package.json             # Extension manifest
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

### Building

```bash
npm run compile      # Compile TypeScript
npm run watch        # Watch mode for development
npm run package      # Package as VSIX
```

### Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Troubleshooting

### Not getting alerts?

1. Check that monitoring is enabled (status bar shows bell icon)
2. Verify `minDuration` setting - command might be too fast
3. Ensure shell integration is working (`echo $TERM_PROGRAM` should show `vscode`)
4. Check VSCode settings: `terminal.integrated.shellIntegration.enabled` should be `true`

### Sound not playing?

- **macOS**: System sound files should exist at `/System/Library/Sounds/`
- **Linux**: Install `pulseaudio-utils` or `alsa-utils`
- **Windows**: PowerShell should be available

### Only some terminals are monitored?

- Check `cliAlarm.watchAllTerminals` setting
- Manually enable with `CLI Alarm: Watch Current Terminal` command

## License

MIT

## Acknowledgments

Built with inspiration from those countless hours waiting for builds to complete!
