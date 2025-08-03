from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sys
import os

# Import your existing main.py functions
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import collect_repo_content, analyze_repo

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

@app.route('/')
def index():
    return "GitHub Architecture Analyzer Backend is running!"

@app.route('/analyze', methods=['POST'])
def analyze_repository():
    try:
        data = request.get_json()
        owner = data.get('owner')
        repo = data.get('repo')
        
        if not owner or not repo:
            return jsonify({'error': 'Both owner and repo are required'}), 400
        
        print(f"Analyzing repository: {owner}/{repo}")
        
        # Get GitHub token from environment variable
        github_token = os.getenv('GITHUB_TOKEN')
        
        # Use your existing functions with GitHub token
        repo_content = collect_repo_content(owner, repo, github_token)
        analysis, services_array = analyze_repo(repo_content)
        
        return jsonify({
            'success': True,
            'owner': owner,
            'repo': repo,
            'analysis': analysis,
            'services_array': services_array
        })
        
    except Exception as e:
        print(f"Error analyzing repository: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
