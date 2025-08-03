# Setup Guide for GitHub Architecture Analyzer

## Required API Keys

### 1. OpenAI API Key (Required)
- Go to [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Set it as an environment variable: `OPENAI_API_KEY=your_key_here`

### 2. GitHub Token (Optional but Recommended)
- Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
- Create a new personal access token
- Set it as an environment variable: `GITHUB_TOKEN=your_token_here`

## Environment Variables

Set these environment variables before running the application:

```bash
# Windows (PowerShell)
$env:OPENAI_API_KEY="your_openai_api_key_here"
$env:GITHUB_TOKEN="your_github_token_here"

# Windows (Command Prompt)
set OPENAI_API_KEY=your_openai_api_key_here
set GITHUB_TOKEN=your_github_token_here

# Linux/Mac
export OPENAI_API_KEY="your_openai_api_key_here"
export GITHUB_TOKEN="your_github_token_here"
```

## Running the Application

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set your API keys as environment variables

3. Start the Flask backend:
   ```bash
   python app.py
   ```

4. Open `frontend/index.html` in your browser

## How It Works

1. User enters repository owner and name
2. Backend fetches important files from GitHub API
3. Files are sent to OpenAI API for analysis
4. OpenAI returns project description and services used
5. Results are displayed in the frontend

## Important Files Analyzed

The system looks for these important files:
- README files
- Configuration files (package.json, requirements.txt, etc.)
- Source code files (.py, .js, .java, etc.)
- Documentation files (.md, .txt)
- Deployment files (Dockerfile, docker-compose.yml)
- And more... 