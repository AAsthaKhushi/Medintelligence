# MedIntelligence - AI-Powered Healthcare Management System

A comprehensive healthcare management platform that combines AI-powered prescription processing, intelligent medication scheduling, patient profile management, and healthcare analytics. Built with modern web technologies and designed for both patients and healthcare providers.

![MedIntelligence Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue)

## 🚀 Features

### 🤖 AI-Powered Prescription Management
- **Document Processing**: Upload prescription images (PDF, PNG, JPG, DOCX) and extract structured medical data using OpenAI GPT-4o Vision
- **Intelligent Data Extraction**: Automatically extract medication names, dosages, frequencies, and instructions
- **Vector Search**: Semantic search across prescription database using PostgreSQL pgvector extension
- **AI Chat Assistant**: Contextual AI assistant for prescription queries and medical information

### 📅 Smart Medication Timeline
- **Intelligent Scheduling**: Automatic parsing of medication frequencies (BID, TID, QID, etc.) into specific time slots
- **Conflict Detection**: Real-time detection of medication timing conflicts and drug interactions
- **Adherence Tracking**: Track medication compliance with visual status indicators
- **24-Hour Timeline View**: Comprehensive daily medication schedule with color-coded status
- **Schedule Optimization**: AI-powered suggestions for optimal medication timing

### 👤 Comprehensive Patient Profile
- **Personal Information**: Editable personal details, contact information, and emergency contacts
- **Medical History**: Track medical conditions, allergies, and health metrics
- **Health Analytics**: Visual charts and progress tracking for vital signs
- **Mobile Responsive**: Fully responsive design for all device sizes

### 💊 Medications Management
- **Automated Medicine List**: AI-extracted medications from prescriptions with detailed information
- **Side Effects & Warnings**: AI-generated general side effects and warnings for each medication
- **Search & Filter**: Advanced search capabilities across medication database
- **Real-time Updates**: Automatic updates as new prescriptions are processed

### 📊 Healthcare Analytics
- **Progress Tracking**: Monitor health metrics over time with interactive charts
- **Medication Adherence**: Detailed adherence analytics and reports
- **Health Trends**: Visual representation of health data trends
- **Export Functionality**: Export health data and medication schedules

### 🎨 Modern User Interface
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark/Light Mode**: Theme switching with system preference detection
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Real-time Updates**: Live status updates during AI processing

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast build tooling and development server
- **Tailwind CSS** for utility-first styling
- **Shadcn/ui** for beautiful, accessible components
- **TanStack Query** for server state management
- **Framer Motion** for smooth animations
- **Recharts** for data visualization

### Backend
- **Express.js** with TypeScript for robust API development
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** with pgvector extension for vector search
- **OpenAI API** for AI-powered features
- **Multer** for file upload handling
- **WebSocket** for real-time communication

### Database
- **PostgreSQL** with pgvector extension for vector embeddings
- **Drizzle Kit** for database migrations and schema management
- **Neon Database** (cloud) or local PostgreSQL for data storage

## 📋 Prerequisites

- **Node.js** v16 or higher
- **PostgreSQL** database with pgvector extension
- **OpenAI API** key with GPT-4o access
- **npm** or **yarn** package manager

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd MedIntelligence

# Install dependencies
npm install
```

### 2. Database Setup

**Option A: Cloud Database (Recommended)**
```bash
# Sign up at neon.tech (free tier available)
# Create a new PostgreSQL database
# Enable pgvector extension in the SQL editor:
CREATE EXTENSION IF NOT EXISTS vector;
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL and pgvector extension
createdb medintelligence
psql medintelligence -c "CREATE EXTENSION vector;"
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: Session Secret
SESSION_SECRET=your_session_secret_here
```

### 4. Database Schema Setup

```bash
# Initialize database tables
npm run db:push
```

### 5. Start Development Server

```bash
# Start in development mode
npm run dev
```

The application will be available at `http://localhost:5000`

## 🏗️ Production Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

### Deployment Options

#### Option 1: Traditional VPS/Server
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name medintelligence

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Option 2: Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

#### Option 3: Cloud Platforms
- **Railway**: Connect GitHub repository and set environment variables
- **Render**: Deploy as a web service with PostgreSQL add-on
- **Heroku**: Use Heroku PostgreSQL and set buildpacks

### Environment Variables for Production

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY` | OpenAI API key | Yes | `sk-...` |
| `PORT` | Server port | No | `5000` |
| `NODE_ENV` | Environment mode | No | `production` |
| `SESSION_SECRET` | Session encryption key | No | `random-secret-string` |

## 📱 Usage Guide

### Getting Started

1. **Access the Application**: Navigate to `http://localhost:5000`
2. **Upload Prescriptions**: Drag and drop prescription files to extract medical data
3. **View Timeline**: Check the medication timeline for scheduling
4. **Manage Profile**: Update personal and medical information
5. **Chat with AI**: Ask questions about your prescriptions and medications

### Key Features

#### Prescription Upload
- Supported formats: PDF, PNG, JPG, JPEG, DOCX
- Maximum file size: 10MB
- AI extraction provides structured data automatically

#### Medication Timeline
- Navigate between days using date picker
- Mark medications as taken, missed, or skipped
- View conflicts and get optimization suggestions
- Add notes to medication actions

#### Patient Profile
- Edit personal information and emergency contacts
- Track health metrics and medical conditions
- View health analytics and progress charts

#### AI Assistant
- Ask questions about prescriptions and medications
- Get information about side effects and interactions
- Receive personalized health recommendations

## 🏗️ Project Structure

```
MedIntelligence/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ai/       # AI-related components
│   │   │   ├── chat/     # Chat interface components
│   │   │   ├── layout/   # Layout and navigation
│   │   │   ├── prescriptions/ # Prescription management
│   │   │   ├── timeline/ # Timeline and scheduling
│   │   │   └── ui/       # Base UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and configurations
│   │   ├── pages/        # Application pages
│   │   └── types/        # TypeScript type definitions
│   ├── index.html        # HTML entry point
│   └── vite.config.ts    # Vite configuration
├── server/               # Express.js backend
│   ├── services/         # Business logic services
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database operations
│   ├── db.ts            # Database connection
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
├── uploads/             # File storage directory
├── migrations/          # Database migration files
└── package.json         # Project dependencies and scripts
```

## 🔌 API Endpoints

### Prescriptions
- `POST /api/prescriptions/upload` - Upload prescription files
- `GET /api/prescriptions` - List user prescriptions
- `GET /api/prescriptions/:id` - Get specific prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

### Timeline
- `GET /api/timeline/schedules` - Get medication schedules for a date
- `GET /api/timeline/status` - Get medication status for a date
- `PUT /api/timeline/status/:scheduleId` - Update medication status
- `GET /api/timeline/conflicts` - Get medication conflicts
- `POST /api/timeline/generate-schedules` - Generate schedules for prescription

### Chat
- `POST /api/chat` - Send message to AI assistant
- `GET /api/chat/history` - Get chat history

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Medications
- `GET /api/medications` - List all medications
- `GET /api/medicine-info` - Get medicine information and side effects

## 🔧 Configuration

### Database Configuration
```typescript
// drizzle.config.ts
export default {
  schema: "./shared/schema.ts",
  out: "./server/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
}
```

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
})
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Verify database connection
psql $DATABASE_URL -c "SELECT version();"

# Check pgvector extension
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

#### OpenAI API Issues
```bash
# Test OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### File Upload Problems
- Check file size limits (10MB max)
- Verify supported formats: PDF, PNG, JPG, JPEG, DOCX
- Ensure `/uploads` directory has write permissions

#### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run check
```

### Windows PowerShell Issues
```powershell
# Set environment variables
$env:DATABASE_URL="your_connection_string"
$env:OPENAI_API_KEY="your_api_key"
npm run dev
```

## 🔒 Security & Privacy

### Data Protection
- All sensitive data is encrypted at rest
- User authentication required for all operations
- HIPAA-compliant data handling practices
- Regular security audits and updates

### Privacy Features
- User-controlled data sharing
- Anonymized analytics (optional)
- Secure data export and deletion
- Audit trails for all actions

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Install dependencies: `npm install`
4. Set up environment variables
5. Run development server: `npm run dev`
6. Make changes and test thoroughly
7. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Use React hooks for state management
- Implement proper error handling
- Write comprehensive tests
- Document all new features

### Testing
```bash
# Run type checking
npm run check

# Run tests (when implemented)
npm test

# Run linting (when implemented)
npm run lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue in the project repository
- **Discussions**: Use GitHub Discussions for questions and ideas

### Feature Requests
- Submit feature requests through GitHub Issues
- Include detailed descriptions and use cases
- Consider contributing the feature yourself

### Bug Reports
- Include steps to reproduce the issue
- Provide error messages and stack traces
- Include system information and browser details

## 🙏 Acknowledgments

- **OpenAI** for providing the AI capabilities
- **Shadcn/ui** for the beautiful component library
- **Vite** for the fast build tooling
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** and **pgvector** for vector search capabilities

---

**MedIntelligence** - Empowering healthcare through intelligent technology.

*Built with ❤️ for better healthcare management*