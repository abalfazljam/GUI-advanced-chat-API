# Advanced AI Chat (PHP)

A lightweight self-hosted AI chat interface written in PHP for local development.

## Features
- Multiple AI providers
- Streaming responses (Server-Sent Events)
- Markdown, KaTeX and syntax highlighting
- Chat history management
- Avatar and profile customization
- File upload support
- Dark theme interface
- Internationalization support

## Requirements
- PHP 8.0+
- Web server (Apache/Nginx)
- An OpenAI-compatible API endpoint (default: local)

## Installation

1. Clone the repository.
2. Place the project in your web server directory.
3. Open the application in your browser.
4. Configure your provider and API key from Settings.

## Project Structure

```
index.php      Frontend
backend.php    Backend and data management
api.php        Streaming API proxy
assets/        CSS, JavaScript and translations
```

## Security Notice

This project is intended primarily for local or self-hosted environments. Review the code and security configuration before exposing it to the public Internet.

## License

MIT License.
