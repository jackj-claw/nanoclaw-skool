# NanoClaw launchd install notes

The `com.nanoclaw.plist` in this directory is a template. `npx tsx setup/index.ts --step service` renders and installs the real file to `~/Library/LaunchAgents/com.nanoclaw.plist`.

## Required env vars in the installed plist

On macOS Tahoe (26+) with Apple Container runtime, the installed plist needs:

```xml
<key>EnvironmentVariables</key>
<dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin</string>
    <key>HOME</key>
    <string>$HOME</string>
    <key>CREDENTIAL_PROXY_HOST</key>
    <string>0.0.0.0</string>
</dict>
```

- `/opt/homebrew/bin` must be in PATH so NanoClaw can find the `container` binary (Apple Container).
- `CREDENTIAL_PROXY_HOST=0.0.0.0` is required by the apple-container codepath (`src/container-runtime.ts`); without it, startup fails. `.env` is NOT read by the launchd-launched process.

The upstream `setup/service.ts` step doesn't emit those two entries yet — after running it, edit the installed plist or add the entries to the template here.

## Verify running

```bash
launchctl list | grep nanoclaw
tail logs/nanoclaw.log
tail logs/nanoclaw.error.log
```

## Restart

```bash
launchctl kickstart -k gui/$UID/com.nanoclaw
```

## Stop / unload

```bash
launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist
```
