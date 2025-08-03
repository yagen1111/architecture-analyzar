// Message.js - JavaScript for message.html page
console.log("Message.js loaded!");

// Get repository, OpenAI response, and services array from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const repo = urlParams.get('repo');
const openaiResponse = urlParams.get('response');
const servicesParam = urlParams.get('services');
const messageContent = document.getElementById('messageContent');

// Parse services array
let servicesArray = [];
console.log("=== FRONTEND DEBUG ===");
console.log("Services parameter received:", servicesParam);

if (servicesParam) {
    try {
        servicesArray = JSON.parse(decodeURIComponent(servicesParam));
        console.log("Successfully parsed services array:", servicesArray);
        console.log("Array length:", servicesArray.length);
    } catch (e) {
        console.error("Error parsing services array:", e);
        console.error("Raw services parameter:", servicesParam);
        servicesArray = [];
    }
} else {
    console.log("No services parameter received");
}

// Service to image mapping
const serviceImageMap = {
    'AWS EC2': '../images/EC2.jpeg',
    'EC2': '../images/EC2.jpeg',
    'AWS Lambda': '../images/lambda.jpeg',
    'Lambda': '../images/lambda.jpeg',
    'AWS ECS': '../images/ecs.png',
    'ECS': '../images/ecs.png',
    'AWS SMS': '../images/sms.png',
    'SMS': '../images/sms.png',
    'Flask': '../images/flask.png',
    'Docker': '../images/docker.png',
    'MySQL': '../images/MySQL.png',
    'Python': '../images/python.png'
};

// Service categorization for architecture diagram
const serviceCategories = {
    'webServer': ['Flask', 'Django', 'Express', 'Node.js', 'Spring Boot', 'ASP.NET', 'Nginx', 'Apache'],
    'database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server'],
    'cloud': ['AWS', 'Azure', 'GCP', 'EC2', 'Lambda', 'S3', 'RDS', 'ECS', 'SMS', 'Cloud Functions', 'App Engine'],
    'container': ['Docker', 'Kubernetes', 'Podman'],
    'frontend': ['React', 'Vue', 'Angular', 'jQuery', 'HTML', 'CSS', 'JavaScript'],
    'api': ['REST', 'GraphQL', 'gRPC'],
    'messaging': ['Kafka', 'RabbitMQ', 'SQS', 'SNS'],
    'storage': ['S3', 'Azure Blob', 'Google Cloud Storage'],
    'auth': ['OAuth', 'JWT', 'Auth0', 'Firebase Auth']
};

// Categorize services
function categorizeServices(services) {
    const categorized = {
        webServer: [],
        database: [],
        cloud: [],
        container: [],
        frontend: [],
        api: [],
        messaging: [],
        storage: [],
        auth: [],
        other: []
    };
    
    services.forEach(service => {
        let categorizedFlag = false;
        for (const [category, keywords] of Object.entries(serviceCategories)) {
            if (keywords.some(keyword => 
                service.toLowerCase().includes(keyword.toLowerCase()) || 
                keyword.toLowerCase().includes(service.toLowerCase())
            )) {
                categorized[category].push(service);
                categorizedFlag = true;
                break;
            }
        }
        if (!categorizedFlag) {
            categorized.other.push(service);
        }
    });
    
    return categorized;
}

// Generate architecture diagram
function generateArchitectureDiagram(categorizedServices) {
    // Create SVG container
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "500");
    svg.setAttribute("viewBox", "0 0 800 500");
    svg.style.border = "1px solid #ddd";
    svg.style.borderRadius = "8px";
    svg.style.backgroundColor = "#f8f9fa";
    
    // Add title
    const title = document.createElementNS(svgNS, "text");
    title.setAttribute("x", "400");
    title.setAttribute("y", "30");
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("font-size", "20");
    title.setAttribute("font-weight", "bold");
    title.textContent = "Architecture Diagram";
    svg.appendChild(title);
    
    // Positioning variables
    let xPos = 100;
    let yPos = 100;
    const componentWidth = 120;
    const componentHeight = 80;
    const vSpacing = 150;
    const hSpacing = 200;
    
    // Store component positions for connections
    const componentPositions = {};
    
    // Draw components by category
    const categoriesToDraw = ['frontend', 'webServer', 'api', 'database', 'cloud', 'container'];
    let currentY = yPos;
    
    categoriesToDraw.forEach((category, categoryIndex) => {
        if (categorizedServices[category].length > 0) {
            const categoryTitle = document.createElementNS(svgNS, "text");
            categoryTitle.setAttribute("x", "50");
            categoryTitle.setAttribute("y", currentY - 20);
            categoryTitle.setAttribute("font-size", "14");
            categoryTitle.setAttribute("font-weight", "bold");
            categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            svg.appendChild(categoryTitle);
            
            categorizedServices[category].forEach((service, serviceIndex) => {
                // Component group
                const group = document.createElementNS(svgNS, "g");
                
                // Component rectangle
                const rect = document.createElementNS(svgNS, "rect");
                const x = 100 + serviceIndex * hSpacing;
                const y = currentY;
                rect.setAttribute("x", x);
                rect.setAttribute("y", y);
                rect.setAttribute("width", componentWidth);
                rect.setAttribute("height", componentHeight);
                rect.setAttribute("rx", "10");
                rect.setAttribute("ry", "10");
                rect.setAttribute("fill", getCategoryColor(category));
                rect.setAttribute("stroke", "#333");
                rect.setAttribute("stroke-width", "2");
                group.appendChild(rect);
                
                // Component label
                const label = document.createElementNS(svgNS, "text");
                label.setAttribute("x", x + componentWidth/2);
                label.setAttribute("y", y + componentHeight/2);
                label.setAttribute("text-anchor", "middle");
                label.setAttribute("dominant-baseline", "middle");
                label.setAttribute("font-size", "12");
                label.setAttribute("font-weight", "bold");
                label.textContent = service;
                group.appendChild(label);
                
                // Store position for connections
                componentPositions[service] = { x: x + componentWidth/2, y: y + componentHeight/2 };
                
                svg.appendChild(group);
            });
            
            currentY += vSpacing;
        }
    });
    
    // Draw connections
    drawConnections(svg, categorizedServices, componentPositions);
    
    return svg;
}

// Get color for category
function getCategoryColor(category) {
    const colors = {
        'frontend': '#4CAF50',
        'webServer': '#2196F3',
        'api': '#9C27B0',
        'database': '#FF9800',
        'cloud': '#00BCD4',
        'container': '#795548',
        'messaging': '#FF5722',
        'storage': '#8BC34A',
        'auth': '#E91E63'
    };
    return colors[category] || '#9E9E9E';
}

// Draw connections between components
function drawConnections(svg, categorizedServices, positions) {
    const svgNS = "http://www.w3.org/2000/svg";
    
    // Define common connection patterns
    const connections = [];
    
    // Frontend to Web Server
    if (categorizedServices.frontend.length > 0 && categorizedServices.webServer.length > 0) {
        connections.push([categorizedServices.frontend[0], categorizedServices.webServer[0]]);
    }
    
    // Web Server to API
    if (categorizedServices.webServer.length > 0 && categorizedServices.api.length > 0) {
        connections.push([categorizedServices.webServer[0], categorizedServices.api[0]]);
    }
    
    // API to Database
    if (categorizedServices.api.length > 0 && categorizedServices.database.length > 0) {
        connections.push([categorizedServices.api[0], categorizedServices.database[0]]);
