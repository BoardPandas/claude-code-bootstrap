---
name: go-desktop-agent-guidelines
description: Go/Wails v2 desktop agent development with dual executable architecture and cross-platform building
---

# Go Desktop Agent Development Guidelines

Guidelines for developing desktop agents in Go with Wails v2.

## Tech Stack

- **Language**: Go 1.23+
- **GUI Framework**: Wails v2 (WebView2/WebKit)
- **Platforms**: Windows (production), macOS (development)
- **Architecture**: Dual executable system (systray + window)
- **Build Tools**: WiX Toolset (MSI), DMG packaging (macOS)

## MVP Principles for Go

### Always Follow
- **Simple functions** over complex abstractions
- **Explicit error handling** with early returns
- **Minimal dependencies** - only add when absolutely needed
- **Direct implementations** over interfaces (unless truly needed for platform abstraction)
- **Standard library first** - avoid external packages when stdlib suffices
- **Clear naming** - prefer verbose names over abbreviations

### Never Use (for MVP)
- Complex interface hierarchies "just in case"
- Premature optimization or caching
- Reflection unless absolutely necessary
- Channels when simple function calls work
- Code generation for simple tasks
- Third-party frameworks when stdlib/Wails provides it

## Project Structure

```
desktop_agent/
├── cmd/
│   └── systray/           # Systray executable (background service)
├── internal/
│   ├── agent/            # Core agent logic
│   │   ├── simple.go     # Main agent implementation
│   │   ├── updater_*.go  # Platform-specific auto-update
│   │   └── rollback_*.go # Platform-specific rollback
│   ├── screenshot/       # Screenshot capture service
│   ├── sysinfo/          # System information collection
│   ├── ui/               # Wails UI components
│   └── config/           # Configuration management
├── main.go               # Wails window entry point
├── scripts/              # Build automation
└── msi/                  # MSI packaging templates
```

## Go Code Patterns

### ✅ CORRECT - Simple Functions with Error Handling

```go
// Simple function with explicit error handling
func submitTicket(subject, email string, screenshots []string) (string, error) {
    // Validate inputs early
    if subject == "" {
        return "", errors.New("subject is required")
    }
    if !strings.Contains(email, "@") {
        return "", errors.New("invalid email address")
    }

    // Build request
    payload := map[string]interface{}{
        "subject":     subject,
        "email":       email,
        "screenshots": screenshots,
    }

    data, err := json.Marshal(payload)
    if err != nil {
        return "", fmt.Errorf("failed to marshal payload: %w", err)
    }

    // Make HTTP request
    resp, err := http.Post(apiURL, "application/json", bytes.NewReader(data))
    if err != nil {
        return "", fmt.Errorf("failed to submit ticket: %w", err)
    }
    defer resp.Body.Close()

    // Parse response
    var result map[string]string
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return "", fmt.Errorf("failed to decode response: %w", err)
    }

    return result["ticketId"], nil
}
```

### ❌ WRONG - Over-Abstraction

```go
// DON'T DO THIS - Too complex for MVP
type TicketSubmitter interface {
    Submit(context.Context, *TicketRequest) (*TicketResponse, error)
}

type HTTPTicketSubmitter struct {
    client HTTPClient
    logger Logger
    config SubmitterConfig
}

func NewHTTPTicketSubmitter(opts ...Option) TicketSubmitter {
    // ... unnecessary complexity
}
```

## Error Handling

### Standard Pattern

```go
// Wrap errors with context using %w for error chains
func processScreenshots(dir string) ([]string, error) {
    files, err := os.ReadDir(dir)
    if err != nil {
        return nil, fmt.Errorf("failed to read directory %s: %w", dir, err)
    }

    var screenshots []string
    for _, file := range files {
        if filepath.Ext(file.Name()) == ".png" {
            screenshots = append(screenshots, filepath.Join(dir, file.Name()))
        }
    }

    if len(screenshots) == 0 {
        return nil, errors.New("no screenshots found")
    }

    return screenshots, nil
}
```

### Early Returns

```go
// Prefer early returns over nested if-else
func validateConfig(cfg *Config) error {
    if cfg == nil {
        return errors.New("config is nil")
    }

    if cfg.APIKey == "" {
        return errors.New("API key is required")
    }

    if cfg.ClientID == "" {
        return errors.New("client ID is required")
    }

    // All validation passed
    return nil
}
```

## Platform-Specific Code

### Build Tags

```go
// updater_darwin.go
//go:build darwin

package agent

import "os/exec"

// MacOSUpdater handles auto-updates on macOS
type MacOSUpdater struct {
    agent *SimpleAgent
}

func (u *MacOSUpdater) StartUpdate(url, version string) error {
    // macOS-specific implementation
    cmd := exec.Command("open", url)
    return cmd.Run()
}
```

```go
// updater_windows.go
//go:build windows

package agent

import "os/exec"

// WindowsUpdater handles auto-updates on Windows
type WindowsUpdater struct {
    agent *SimpleAgent
}

func (u *WindowsUpdater) StartUpdate(url, version string) error {
    // Windows-specific implementation using msiexec
    cmd := exec.Command("msiexec", "/i", msiPath, "/quiet", "/norestart")
    return cmd.Start()
}
```

### File Naming Convention

- `file.go` - Cross-platform code
- `file_darwin.go` - macOS only
- `file_windows.go` - Windows only
- `file_linux.go` - Linux only
- `file_other.go` - All platforms except main ones

## Wails Integration

### Exposing Go Methods to Frontend

```go
// WebViewManager provides Wails bindings
type WebViewManager struct {
    agent *agent.SimpleAgent
}

// SubmitTicket is exposed to JavaScript via Wails
func (m *WebViewManager) SubmitTicket(subject, email, phone string, urgency int) (string, error) {
    // Input validation
    if subject == "" {
        return "", errors.New("Subject is required")
    }

    // Call agent method
    ticketID, err := m.agent.CreateTicket(subject, email, phone, urgency)
    if err != nil {
        return "", fmt.Errorf("failed to create ticket: %w", err)
    }

    return ticketID, nil
}

// GetSystemInfo returns system information to UI
func (m *WebViewManager) GetSystemInfo() map[string]string {
    return map[string]string{
        "version":  m.agent.GetVersion(),
        "platform": runtime.GOOS,
        "hostname": getHostname(),
    }
}
```

### Frontend JavaScript Calls

```javascript
// In React/TypeScript frontend
import { SubmitTicket, GetSystemInfo } from '../wailsjs/go/ui/WebViewManager';

// Call Go function from JavaScript
async function handleSubmit() {
    try {
        const ticketId = await SubmitTicket(subject, email, phone, urgency);
        console.log('Ticket created:', ticketId);
    } catch (error) {
        console.error('Submission failed:', error);
    }
}

// Get system info
const sysInfo = await GetSystemInfo();
```

## HTTP Client Pattern

### Simple HTTP Requests

```go
// Simple HTTP POST with timeout
func sendHeartbeat(agentID, version string) error {
    client := &http.Client{
        Timeout: 10 * time.Second,
    }

    payload := map[string]string{
        "agentId": agentID,
        "version": version,
        "status":  "active",
    }

    data, err := json.Marshal(payload)
    if err != nil {
        return fmt.Errorf("marshal failed: %w", err)
    }

    req, err := http.NewRequest("POST", apiURL+"/heartbeat", bytes.NewReader(data))
    if err != nil {
        return fmt.Errorf("request creation failed: %w", err)
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+apiKey)

    resp, err := client.Do(req)
    if err != nil {
        return fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return fmt.Errorf("server returned %d: %s", resp.StatusCode, body)
    }

    return nil
}
```

## Concurrency Patterns

### Background Services with Context

```go
// Screenshot service with graceful shutdown
type ScreenshotService struct {
    interval time.Duration
    savePath string
}

func (s *ScreenshotService) Start(ctx context.Context) error {
    ticker := time.NewTicker(s.interval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            // Graceful shutdown
            log.Println("Screenshot service stopping...")
            return ctx.Err()

        case <-ticker.C:
            // Take screenshot
            if err := s.captureScreenshot(); err != nil {
                log.Printf("Screenshot failed: %v", err)
                // Continue running despite errors
            }
        }
    }
}

func (s *ScreenshotService) captureScreenshot() error {
    // Platform-specific screenshot implementation
    img, err := takeScreenshot()
    if err != nil {
        return fmt.Errorf("capture failed: %w", err)
    }

    filename := fmt.Sprintf("screenshot_%d.png", time.Now().Unix())
    filepath := filepath.Join(s.savePath, filename)

    return saveImage(img, filepath)
}
```

## Configuration Management

### Build-Time Configuration

```go
// config/build_overrides.go
//go:build client_your_client

package config

const (
    DefaultClientID   = "your-client-id"
    DefaultClientName = "Your Client Name"
    DefaultAPIKey     = "your_api_key_xxx"
)
```

```go
// config/config.go
package config

import "os"

// Config holds runtime configuration
type Config struct {
    ClientID   string
    ClientName string
    APIKey     string
    APIURL     string
}

// Load returns configuration with priority:
// 1. Environment variables
// 2. Build-time constants
// 3. Registry/config file (Windows/macOS)
func Load() *Config {
    cfg := &Config{
        ClientID:   DefaultClientID,
        ClientName: DefaultClientName,
        APIKey:     DefaultAPIKey,
        APIURL:     "https://api.your-domain.com",
    }

    // Environment variable overrides
    if key := os.Getenv("YOUR_API_KEY"); key != "" {
        cfg.APIKey = key
    }
    if id := os.Getenv("YOUR_CLIENT_ID"); id != "" {
        cfg.ClientID = id
    }

    return cfg
}
```

## File Operations

### Safe File Writing

```go
// Write file atomically with temp file and rename
func saveScreenshot(img image.Image, path string) error {
    // Create temp file in same directory
    dir := filepath.Dir(path)
    tmpFile, err := os.CreateTemp(dir, "screenshot-*.tmp")
    if err != nil {
        return fmt.Errorf("failed to create temp file: %w", err)
    }
    tmpPath := tmpFile.Name()
    defer os.Remove(tmpPath) // Cleanup on error

    // Encode image to temp file
    if err := png.Encode(tmpFile, img); err != nil {
        tmpFile.Close()
        return fmt.Errorf("failed to encode PNG: %w", err)
    }

    if err := tmpFile.Close(); err != nil {
        return fmt.Errorf("failed to close temp file: %w", err)
    }

    // Atomic rename
    if err := os.Rename(tmpPath, path); err != nil {
        return fmt.Errorf("failed to rename file: %w", err)
    }

    return nil
}
```

## Testing

### Table-Driven Tests

```go
func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
    }{
        {
            name:    "valid email",
            email:   "test@example.com",
            wantErr: false,
        },
        {
            name:    "missing @",
            email:   "testexample.com",
            wantErr: true,
        },
        {
            name:    "empty email",
            email:   "",
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := validateEmail(tt.email)
            if (err != nil) != tt.wantErr {
                t.Errorf("validateEmail() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Testing Platform-Specific Code

```go
//go:build windows

func TestWindowsUpdater(t *testing.T) {
    updater := &WindowsUpdater{}

    // Test MSI download and install
    err := updater.StartUpdate("https://example.com/agent.msi", "1.0.0")
    if err != nil {
        t.Fatalf("StartUpdate failed: %v", err)
    }
}
```

## Build Scripts

### Windows Build Script Pattern

```batch
@echo off
REM build-your-client.bat

set AGENT_VERSION=1.0.0
set BUILD_HASH=%1
if "%BUILD_HASH%"=="" set BUILD_HASH=dev

echo Building Your Client Agent v%AGENT_VERSION%...

REM Build systray (no console window)
go build -tags "client_your_client" ^
  -ldflags "-H=windowsgui -w -s -X main.BuildVersion=%AGENT_VERSION% -X main.BuildHash=%BUILD_HASH%" ^
  -o dist\your-client\your-agent.exe ^
  .\cmd\systray

if errorlevel 1 (
    echo Systray build failed!
    exit /b 1
)

REM Build Wails window
cd ..
wails build -tags "client_your_client" ^
  -ldflags "-w -s -X main.BuildVersion=%AGENT_VERSION% -X main.BuildHash=%BUILD_HASH%" ^
  -o "your-client-window.exe"

if errorlevel 1 (
    echo Wails build failed!
    exit /b 1
)

echo Build complete!
```

## Common Patterns

### Circular Buffer for Screenshots

```go
type ScreenshotBuffer struct {
    maxSize int
    files   []string
    mu      sync.Mutex
}

func (b *ScreenshotBuffer) Add(filepath string) {
    b.mu.Lock()
    defer b.mu.Unlock()

    // Add to buffer
    b.files = append(b.files, filepath)

    // Remove oldest if exceeding max size
    if len(b.files) > b.maxSize {
        oldFile := b.files[0]
        os.Remove(oldFile) // Delete oldest screenshot
        b.files = b.files[1:]
    }
}

func (b *ScreenshotBuffer) GetAll() []string {
    b.mu.Lock()
    defer b.mu.Unlock()

    // Return copy to avoid race conditions
    result := make([]string, len(b.files))
    copy(result, b.files)
    return result
}
```

### Graceful Shutdown

```go
func (a *SimpleAgent) Shutdown() error {
    log.Println("Shutting down agent...")

    // Cancel context to stop all goroutines
    a.cancel()

    // Stop screenshot service
    if a.screenshotService != nil {
        a.screenshotService.Stop()
    }

    // Stop heartbeat ticker
    if a.heartbeatTicker != nil {
        a.heartbeatTicker.Stop()
    }

    log.Println("Agent shutdown complete")
    return nil
}
```

## Checklist Before Committing

- [ ] Following Go idioms (error returns, early returns, etc.)
- [ ] Platform-specific code uses build tags
- [ ] Error handling with `fmt.Errorf` and `%w` for wrapping
- [ ] No premature abstractions (interfaces only when needed)
- [ ] HTTP timeouts configured
- [ ] Context used for cancellation
- [ ] Tests written for core logic
- [ ] Build script updated if new dependencies added
- [ ] Cross-platform compatibility considered

## Common Mistakes to Avoid

### ❌ Ignoring Errors

```go
// DON'T ignore errors
data, _ := json.Marshal(payload)
```

```go
// DO handle errors explicitly
data, err := json.Marshal(payload)
if err != nil {
    return fmt.Errorf("failed to marshal: %w", err)
}
```

### ❌ Goroutine Leaks

```go
// DON'T start goroutines without cleanup
go func() {
    for {
        time.Sleep(time.Second)
        doWork()
    }
}()
```

```go
// DO use context for cancellation
go func() {
    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            doWork()
        }
    }
}()
```

### ❌ Mutation Without Locks

```go
// DON'T mutate shared state without locks
func (s *Service) Add(item string) {
    s.items = append(s.items, item) // RACE CONDITION
}
```

```go
// DO use mutexes for shared state
func (s *Service) Add(item string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.items = append(s.items, item)
}
```

## Remember

- **Simplicity > Cleverness** - Boring code is good code
- **Explicit > Implicit** - Clear error handling and flow
- **Standard library first** - Avoid dependencies when possible
- **Test the happy path** - Then test error cases
- **Platform-specific when needed** - But keep most code cross-platform
- **Context for cancellation** - Always support graceful shutdown

When in doubt, ask: "Would a Go beginner understand this in 30 seconds?"
