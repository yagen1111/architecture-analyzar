

import requests
import base64
import os
from openai import OpenAI

# Get API keys from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')  # optional, for private repos or higher rate limit

# Important files to include
IMPORTANT_EXTENSIONS = (".md", ".yml", ".yaml", ".py", ".json", ".txt", ".env", "Dockerfile", "package.json", "requirements.txt", "pom.xml", "build.gradle", "composer.json", "Gemfile", "Cargo.toml", "go.mod", "package-lock.json", "yarn.lock")

def get_openai_client():
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    return OpenAI(api_key=OPENAI_API_KEY)

def fetch_repo_files(owner, repo, token=None):
    """Fetch all files from the repository root"""
    headers = {"Authorization": f"token {token}"} if token else {}
    url = f"https://api.github.com/repos/{owner}/{repo}/contents"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def fetch_file_content(file_info, token=None):
    """Fetch content of a specific file"""
    headers = {"Authorization": f"token {token}"} if token else {}
    if file_info['type'] == 'file':
        res = requests.get(file_info['download_url'], headers=headers)
        if res.status_code == 200:
            return f"# File: {file_info['name']}\n" + res.text
    return ""

def is_important_file(filename):
    """Check if file is important based on extension or name"""
    return any(filename.endswith(ext) for ext in IMPORTANT_EXTENSIONS) or filename in [
        "README", "README.md", "README.txt", "LICENSE", "Dockerfile", "docker-compose.yml",
        "package.json", "requirements.txt", "pom.xml", "build.gradle", "composer.json",
        "Gemfile", "Cargo.toml", "go.mod", "Makefile", ".gitignore", ".env.example"
    ]


def collect_repo_content(owner, repo, token=None):
    """Collect important files from the repository"""
    try:
        print(f"Fetching files from {owner}/{repo}")
        files = fetch_repo_files(owner, repo, token)
        
        repo_content = f"Repository: {owner}/{repo}\n\n"
        important_files = []
        
        for file_info in files:
            if file_info['type'] == 'file' and is_important_file(file_info['name']):
                print(f"Fetching content of {file_info['name']}")
                content = fetch_file_content(file_info, token)
                if content:
                    important_files.append(content)
        
        # Also check for common subdirectories
        for file_info in files:
            if file_info['type'] == 'dir' and file_info['name'] in ['src', 'app', 'backend', 'frontend', 'api', 'lib', 'utils']:
                try:
                    subdir_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_info['name']}"
                    headers = {"Authorization": f"token {token}"} if token else {}
                    subdir_response = requests.get(subdir_url, headers=headers)
                    if subdir_response.status_code == 200:
                        subdir_files = subdir_response.json()
                        for subfile in subdir_files:
                            if subfile['type'] == 'file' and is_important_file(subfile['name']):
                                print(f"Fetching content of {file_info['name']}/{subfile['name']}")
                                content = fetch_file_content(subfile, token)
                                if content:
                                    important_files.append(content)
                except Exception as e:
                    print(f"Error fetching subdirectory {file_info['name']}: {e}")
        
        repo_content += "\n".join(important_files)
        return repo_content
        
    except Exception as e:
        print(f"Error collecting repository content: {e}")
        return f"Repository: {owner}/{repo}\nError fetching repository content: {str(e)}"


def analyze_repo(repo_text):
    """Analyze repository content using OpenAI API"""
    try:
        client = get_openai_client()
        
        prompt = f"""
You are a senior software architect analyzing a GitHub repository.

Your tasks:
1. Write a short and accurate description of what this project does (max 5 lines) under a markdown heading titled `### Project Description`.
2. Return the list of services the project uses (like databases, APIs, external services, frameworks, etc.) as a **JSON array** under a markdown heading titled `### Services Used`.

IMPORTANT: The services must be returned as a valid JSON array format like this:
### Services Used
["Python", "Flask", "MongoDB", "AWS S3"]

Focus on:
- Programming languages and frameworks
- Databases and storage services
- Cloud services (AWS, Azure, GCP, etc.)
- External APIs and services
- Development tools and platforms
- Deployment and infrastructure tools

Here is the repository content:
{repo_text}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional software project analyst."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000
        )

        analysis_text = response.choices[0].message.content
        print(f"=== OPENAI RESPONSE DEBUG ===")
        print(f"Full OpenAI response: {analysis_text}")
        
        # Extract the services array from the response
        services_array = extract_services_array(analysis_text)
        print(f"Final extracted services array: {services_array}")
        
        # If services array is empty, try to create a basic one from common patterns
        if not services_array:
            print("Services array is empty, trying to create basic services list...")
            basic_services = []
            
            # Look for common technologies in the analysis text
            common_techs = [
                "Python", "JavaScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift",
                "React", "Vue", "Angular", "Node.js", "Express", "Flask", "Django", "Spring",
                "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch",
                "AWS", "Azure", "GCP", "Docker", "Kubernetes", "GitHub", "GitLab",
                "REST", "API", "GraphQL", "JWT", "OAuth"
            ]
            
            for tech in common_techs:
                if tech.lower() in analysis_text.lower():
                    basic_services.append(tech)
            
            if basic_services:
                print(f"Created basic services list: {basic_services}")
                services_array = basic_services
        
        return analysis_text, services_array
        
    except Exception as e:
        print(f"Error analyzing repository: {e}")
        error_text = f"""
### Project Description
Error analyzing repository: {str(e)}

### Services Used
["Error occurred during analysis"]
"""
        return error_text, ["Error occurred during analysis"]


def extract_services_array(analysis_text):
    """Extract the services array from the OpenAI response"""
    try:
        import re
        import json
        
        print(f"=== DEBUG: Analyzing OpenAI response ===")
        print(f"Full response length: {len(analysis_text)}")
        print(f"Response preview: {analysis_text[:500]}...")
        
        # Look for the "### Services Used" section
        services_match = re.search(r'### Services Used\s*\n(.*?)(?=\n###|\n$)', analysis_text, re.DOTALL)
        
        if services_match:
            services_content = services_match.group(1).strip()
            print(f"Found Services Used section: {services_content}")
            
            # Try to extract JSON array from the content
            # Look for array patterns like ["service1", "service2"] or ['service1', 'service2']
            json_match = re.search(r'\[.*?\]', services_content)
            
            if json_match:
                json_str = json_match.group(0)
                print(f"Found JSON array: {json_str}")
                # Parse the JSON array
                services_array = json.loads(json_str)
                print(f"Extracted services array: {services_array}")
                return services_array
            else:
                print("No JSON array found, trying alternative extraction methods...")
                # If no JSON array found, try to extract individual services
                # Look for quoted strings or bullet points
                services = re.findall(r'["\']([^"\']+)["\']', services_content)
                if services:
                    print(f"Extracted services from quotes: {services}")
                    return services
                else:
                    # Look for bullet points or numbered lists
                    services = re.findall(r'[-*]\s*([^\n]+)', services_content)
                    if services:
                        services = [s.strip() for s in services]
                        print(f"Extracted services from bullets: {services}")
                        return services
                    else:
                        # Try to extract any text that looks like services
                        print("Trying to extract any service-like text...")
                        # Look for common service patterns
                        service_patterns = [
                            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',  # Capitalized words
                            r'([A-Z]{2,})',  # Acronyms like AWS, API, etc.
                        ]
                        
                        for pattern in service_patterns:
                            potential_services = re.findall(pattern, services_content)
                            if potential_services:
                                # Filter out common words that aren't services
                                common_words = ['the', 'and', 'or', 'for', 'with', 'that', 'this', 'are', 'used', 'services', 'project', 'repository']
                                filtered_services = [s for s in potential_services if s.lower() not in common_words and len(s) > 2]
                                if filtered_services:
                                    print(f"Extracted potential services: {filtered_services}")
                                    return filtered_services[:10]  # Limit to first 10
        
        # If no services section found, return empty array
        print("No services section found in response")
        print(f"Full response for debugging: {analysis_text}")
        return []
        
    except Exception as e:
        print(f"Error extracting services array: {e}")
        return ["Error extracting services"]

# The analyze_repo function is now implemented above with OpenAI integration


# === MAIN EXECUTION ===
# Commented out for Flask app integration - now called via app.py

# repo_content = collect_repo_content(GITHUB_OWNER, GITHUB_REPO)
# summary = analyze_repo(repo_content)
# 
# print(summary)
