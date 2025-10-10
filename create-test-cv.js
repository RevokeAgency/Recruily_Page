#!/usr/bin/env node

/**
 * Create a proper test CV file for testing PDF extraction
 */

const fs = require('fs');
const path = require('path');

// Create a comprehensive text-based CV
const sampleCV = `John Smith
Senior Software Engineer
john.smith@email.com | (555) 123-4567 | LinkedIn: linkedin.com/in/johnsmith
San Francisco, CA | GitHub: github.com/johnsmith

PROFESSIONAL SUMMARY
Experienced software engineer with 8+ years of expertise in full-stack development, 
cloud architecture, and team leadership. Proven track record of delivering scalable 
applications and leading cross-functional teams to success.

TECHNICAL SKILLS
• Programming Languages: JavaScript, TypeScript, Python, Java, Go, SQL
• Frontend: React, Vue.js, Angular, HTML5, CSS3, Sass, Webpack, Vite
• Backend: Node.js, Express.js, Django, Spring Boot, FastAPI
• Databases: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch
• Cloud & DevOps: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, Jenkins, CI/CD
• Tools & Methodologies: Git, Jira, Agile, Scrum, Test-Driven Development

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechCorp Inc. | January 2020 - Present
• Led development of microservices architecture serving 1M+ daily users
• Built real-time analytics dashboard using React and WebSocket connections
• Implemented automated CI/CD pipelines reducing deployment time by 60%
• Mentored 5 junior developers and conducted technical interviews
• Collaborated with product managers to define technical requirements

Software Engineer | StartupXYZ | March 2018 - December 2019
• Developed RESTful APIs using Node.js and Express serving 100K+ requests/day
• Created responsive web applications with React and Redux
• Integrated third-party payment systems (Stripe, PayPal) with 99.9% uptime
• Optimized database queries improving application performance by 40%
• Participated in code reviews and maintained coding standards

Junior Developer | WebSolutions LLC | June 2016 - February 2018
• Built custom WordPress themes and plugins for enterprise clients
• Developed e-commerce solutions using PHP and MySQL
• Implemented SEO best practices increasing organic traffic by 200%
• Collaborated with designers to create pixel-perfect user interfaces

EDUCATION

Bachelor of Science in Computer Science | University of California, Berkeley | 2016
• Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering
• Senior Project: Machine Learning-based Recommendation System
• GPA: 3.8/4.0

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2021)
• Google Cloud Professional Developer (2020)
• MongoDB Certified Developer (2019)

PROJECTS

E-commerce Platform | Personal Project | 2023
• Full-stack application built with MERN stack
• Features: user authentication, payment integration, admin dashboard
• Deployed on AWS with auto-scaling and load balancing
• Tech Stack: React, Node.js, MongoDB, AWS, Docker

Task Management API | Open Source | 2022
• RESTful API with real-time notifications
• 500+ stars on GitHub, active contributor community
• Tech Stack: Express.js, PostgreSQL, WebSocket, Jest

LANGUAGES
• English (Native)
• Spanish (Conversational)
• French (Basic)

ADDITIONAL INFORMATION
• Active contributor to open-source projects
• Speaker at local JavaScript meetups
• Volunteer coding instructor for underserved communities`;

// Create the text file
const textFilePath = path.join(__dirname, 'test-cv-john-smith.txt');
fs.writeFileSync(textFilePath, sampleCV);

console.log('✅ Created comprehensive test CV file:', textFilePath);
console.log('📄 File size:', fs.statSync(textFilePath).size, 'bytes');
console.log('📝 Content preview (first 300 chars):');
console.log(sampleCV.substring(0, 300) + '...');

// Also create a minimal CV for comparison
const minimalCV = `Jane Doe
Frontend Developer
jane.doe@email.com
(555) 987-6543

SKILLS:
React, JavaScript, HTML, CSS, Git

EXPERIENCE:
Frontend Developer at WebCorp (2022-2024)
- Built responsive web applications
- Worked with React and TypeScript

EDUCATION:
BS Computer Science, State University (2022)`;

const minimalFilePath = path.join(__dirname, 'test-cv-jane-doe.txt');
fs.writeFileSync(minimalFilePath, minimalCV);

console.log('\n✅ Created minimal test CV file:', minimalFilePath);
console.log('📄 File size:', fs.statSync(minimalFilePath).size, 'bytes');

console.log('\n🔧 You can now test these files with the CV parsing API or run:');
console.log('node test-gemini-pdf.js');
console.log('\nTo test the API directly, you can use:');
console.log('curl -X POST http://localhost:3000/api/parse-cv \\');
console.log('  -F "file=@test-cv-john-smith.txt" \\');
console.log('  -F "jobId=test-job-123"');