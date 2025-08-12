# Senior Full-Stack Developer Challenge: Task Management Platform

## Overview
Build a collaborative task management platform with real-time features, advanced filtering, and team collaboration capabilities. This challenge tests your ability to architect scalable solutions, implement complex business logic, and create intuitive user experiences.

## Core Requirements

### Backend (Node.js, Python, or Go)
Choose your preferred backend technology:

**Node.js/Express** OR **Python/Django/FastAPI** OR **Go/Gin/Echo**

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Manager, Member)
  - Password reset functionality
  - Rate limiting on auth endpoints

- **Database Design**
  - Design schema for users, teams, projects, tasks, and comments
  - Implement proper relationships and constraints
  - Add database migrations
  - Include seed data for testing

- **API Endpoints**
  - RESTful API with proper HTTP status codes
  - CRUD operations for all entities
  - Advanced filtering and pagination
  - File upload for task attachments
  - Bulk operations (assign multiple tasks, update statuses)

- **Real-time Features**
  - WebSocket implementation for live updates
  - Real-time notifications for task assignments
  - Live collaboration indicators (who's viewing what)

### Frontend (React/Vue/Angular or your choice)
- **User Interface**
  - Responsive design (mobile-first approach)
  - Dark/light theme toggle
  - Drag-and-drop task management (Kanban board)
  - Advanced search and filtering
  - Data visualization (charts for task completion, team performance)

- **State Management**
  - Implement proper state management
  - Optimistic updates for better UX
  - Offline capability with sync when online
  - Cache management for improved performance

- **Advanced Features**
  - Infinite scrolling for task lists
  - Keyboard shortcuts for power users
  - Export functionality (PDF reports, CSV data)
  - Time tracking for tasks

## Technical Challenges

### 1. Performance & Scalability
- Implement database query optimization
- Add caching layer (Redis recommended)
- Lazy loading for large datasets
- Image optimization for uploaded files
- API response compression

### 2. Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- Secure file upload handling
- API versioning strategy

### 3. Testing
- Unit tests (minimum 80% coverage)
- Integration tests for API endpoints
- E2E tests for critical user flows
- Load testing for concurrent users
- Mock external services

### 4. DevOps & Deployment
- **Docker containerization** (Required)
  - Multi-stage Docker builds for optimization
  - Docker Compose for local development
  - Separate containers for frontend, backend, database
- Environment configuration management
- CI/CD pipeline setup (GitHub Actions)
- Database backup strategy
- Error monitoring and logging

## Bonus Features (Choose 2-3)
- **Email Notifications**: Send digest emails for task updates
- **Third-party Integrations**: GitHub/Slack webhooks
- **Advanced Analytics**: Custom dashboard with metrics
- **Mobile App**: React Native or Flutter companion app
- **AI Features**: Smart task categorization or priority suggestions
- **Audit Logging**: Track all user actions with timestamps

## Evaluation Criteria

### Code Quality (25%)
- Clean, readable, and maintainable code
- Proper error handling and edge cases
- Consistent coding standards
- Documentation and comments

### Architecture (25%)
- Scalable and modular design
- Proper separation of concerns
- Database design efficiency
- API design best practices

### Functionality (25%)
- All core features working correctly
- User experience and interface design
- Real-time features implementation
- Performance optimization

### Technical Excellence (25%)
- Security implementation
- Testing coverage and quality
- DevOps and deployment setup
- Bonus features implementation

## Timeline
- **Recommended Duration**: 5-7 days
- **Minimum Viable Product**: 3 days
- **Full Implementation**: 7 days

## Getting Started

### Project Structure Suggestion
```
task-management-platform/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── docs/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── Dockerfile (if using custom DB setup)
├── docs/
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

### Docker Requirements

### Local Development Setup
Your solution **must** include Docker configuration for easy local setup:

```bash
# Should work out of the box
git clone <your-fork>
cd <your-fork>
docker-compose up
```

### Required Docker Files
- **docker-compose.yml**: For local development environment
- **docker-compose.prod.yml**: For production deployment (optional)
- **Backend Dockerfile**: Multi-stage build for your chosen stack (Node.js/Python/Go)
- **Frontend Dockerfile**: Optimized build for React/Vue/Angular frontend
- **Environment Variables**: Properly configured for different environments

### Container Requirements
- **Frontend Container**: Serve built static files or run dev server
- **Backend Container**: API server with proper health checks
- **Database Container**: PostgreSQL/MySQL with persistent volumes
- **Redis Container**: For caching and session management
- **Reverse Proxy**: Nginx container for routing (bonus points)

All containers should start with a single `docker-compose up` command and be accessible via localhost with clear port documentation.

### Build Optimization

For faster Docker builds, several optimization strategies are implemented:

#### Quick Start Commands
```bash
# Fast optimized build
make build-fast

# Development with hot reload (Linux/macOS)
make up-dev

# Development for Windows (if file sharing issues)
make up-dev-windows

# Production build
make build && make up

# Clean and rebuild everything
make rebuild
```

#### Windows Users - Directory Sharing Fix
If you encounter "user declined directory sharing" error:

1. **Enable File Sharing in Docker Desktop:**
   - Open Docker Desktop → Settings → Resources → File Sharing
   - Add your project directory
   - Apply & Restart

2. **Alternative - Use Windows-specific development mode:**
   ```bash
   # No volume mounting required
   docker-compose -f docker-compose.dev.windows.yml up -d
   
   # Or use make
   make up-dev-windows
   ```

3. **Run the fix script:**
   ```bash
   scripts/fix-windows-docker.bat
   ```

#### Docker Cache Import Errors
If you encounter "importing cache manifest" errors:

1. **Build without cache first:**
   ```bash
   make build-no-cache
   # OR
   docker-compose build --no-cache
   ```

2. **Use cache fix command:**
   ```bash
   make fix-cache
   ```

3. **Alternative - Build services individually:**
   ```bash
   docker-compose build backend
   docker-compose build frontend
   ```

#### Build Performance Features
- **BuildKit enabled** for parallel builds and advanced caching
- **Multi-stage Dockerfiles** with optimized layer caching  
- **npm cache mounting** to persist dependencies between builds
- **Selective file copying** to minimize rebuild triggers
- **Parallel service builds** using Docker Compose `--parallel` flag
- **Reduced build context** via comprehensive `.dockerignore` files
- **Health check optimization** with faster intervals for development

#### Development Mode
```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Or use make command
make up-dev
```

The development setup includes:
- Volume mounting for source code hot reload
- Optimized health checks for faster startup
- Separated node_modules volumes for performance
- Reduced dependencies for development containers

#### Build Scripts
- `scripts/build-optimized.sh` - Linux/macOS optimized build
- `scripts/build-optimized.bat` - Windows optimized build
- `Makefile` - Cross-platform build targets

## Sample User Stories
1. As a team member, I want to see all my assigned tasks in a dashboard
2. As a manager, I want to create projects and assign tasks to team members
3. As a user, I want to receive real-time notifications when tasks are updated
4. As an admin, I want to view team performance analytics

## How to Submit Your Solution

### 1. Fork and Setup
1. **Fork this repository** to your GitHub account
2. **Clone your fork** locally and start building
3. **Organize your code** in a clear structure:
   ```
   your-fork/
   ├── README.md (this challenge)
   ├── SOLUTION.md (your documentation - required)
   ├── backend/
   ├── frontend/
   ├── database/
   └── docs/
   ```

### 2. Build Your Solution
- Follow the requirements outlined above
- Commit regularly with clear commit messages
- Focus on code quality and documentation

### 3. Document Your Work
Create a **SOLUTION.md** file containing:
- **Setup Instructions**: How to run locally (both Docker and non-Docker)
- **Docker Instructions**: `docker-compose up` should work out of the box
- **Technology Stack**: What you used and why
- **Architecture Overview**: High-level design decisions
- **API Documentation**: Endpoints and usage
- **Database Schema**: Structure and relationships
- **Demo Credentials**: Test accounts for different roles
- **Live Demo URL**: Deployed application link
- **Known Issues**: Any limitations or incomplete features

### 4. Deploy Your Application
Deploy to any free hosting service:
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, Render
- **Database**: Heroku Postgres, PlanetScale, Supabase

### 5. Final Submission
When ready, provide us with:
- **GitHub repository link** (your fork)
- **Live demo URL**
- **Any additional context** or notes

## Questions?

### Using GitHub Issues (Recommended)
We've set up issue templates to help you get quick, targeted assistance:

1. **Go to the [Issues tab](../../issues)** in this repository
2. **Click "New issue"** 
3. **Choose the appropriate template:**
   - 🔧 **Technical Question** - Implementation and coding issues
   - ❓ **Requirements Clarification** - Unclear requirements or specifications  
   - 📤 **Submission Help** - Process, documentation, or deployment questions
   - 🐛 **Bug Report** - Issues with challenge materials or instructions

4. **Fill out the template** with as much detail as possible
5. **We'll respond within 24-48 hours** during business days


---

**Technology Choice**: You can use **Node.js**, **Python**, or **Go** for the backend, and any modern frontend framework. The focus is on demonstrating senior-level problem-solving, architecture skills, and attention to detail. Quality over quantity - a well-implemented subset is better than a poorly executed full feature set.