# MedGenie 2.0 - AI-Powered Prescription Management System

A comprehensive medical prescription management system that leverages AI technologies for document processing, data extraction, and intelligent chatbot assistance.

## Features

- **AI Document Processing**: Upload prescription images (PDF, PNG, JPG, DOCX) and extract structured medical data using OpenAI GPT-4o Vision
- **Vector Search**: Semantic search across prescription database using PostgreSQL pgvector extension
- **Intelligent Chat**: AI assistant provides contextual responses about prescription data
- **Real-time Processing**: Live status updates during AI extraction
- **Responsive Design**: Modern UI built with React, TypeScript, and Tailwind CSS

## Prerequisites

- Node.js v16 or higher
- PostgreSQL database with pgvector extension
- OpenAI API key

## Installation & Setup

### 1. Download and Extract

Download the project zip file and extract it to your desired location.

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL and pgvector extension
createdb medgenie
psql medgenie -c "CREATE EXTENSION vector;"
```

**Option B: Cloud Database (Recommended)**
- Sign up at [neon.tech](https://neon.tech) (free tier available)
- Create a new PostgreSQL database
- Enable the pgvector extension in the SQL editor:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
OPENAI_API_KEY=sk-your_openai_api_key_here
PORT=5000
NODE_ENV=development
```

Use `.env.example` as a reference for all required variables.

### 5. Database Schema Setup

Initialize the database tables:

```bash
npm run db:push
```

### 6. Start the Application

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

The application will be available at `http://localhost:5000`

## Usage

1. **Upload Prescriptions**: Drag and drop prescription images to extract medical data
2. **View Prescriptions**: Browse processed prescriptions with extracted information
3. **Chat Interface**: Ask questions about your prescription data
4. **Search**: Find prescriptions using semantic search

## Project Structure

```
medgenie/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Application pages
│   │   └── lib/           # Utilities and types
├── server/                # Express.js backend
│   ├── services/          # OpenAI and file processing
│   ├── routes.ts          # API endpoints
│   └── storage.ts         # Database operations
├── shared/                # Shared types and schema
└── uploads/               # File storage directory
```

## API Endpoints

- `POST /api/prescriptions/upload` - Upload prescription files
- `GET /api/prescriptions` - List user prescriptions
- `GET /api/prescriptions/:id` - Get specific prescription
- `POST /api/chat` - Chat with AI assistant
- `GET /api/chat/history` - Get chat history

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment mode | No |

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running (if using local database)
- Check that pgvector extension is installed

### OpenAI API Issues
- Confirm your API key is valid
- Ensure you have sufficient credits in your OpenAI account
- Check API key permissions for GPT-4o and embeddings

### File Upload Problems
- Check file size limits (10MB max)
- Supported formats: PDF, PNG, JPG, JPEG, DOCX
- Ensure `/uploads` directory has write permissions

### Windows PowerShell Issues
If you encounter environment variable issues on Windows:

```powershell
$env:DATABASE_URL="your_connection_string"
$env:OPENAI_API_KEY="your_api_key"
npm run dev
```

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/ui for components
- TanStack Query for state management

**Backend:**
- Express.js with TypeScript
- Drizzle ORM for database operations
- Multer for file uploads
- OpenAI API for AI processing

**Database:**
- PostgreSQL with pgvector extension
- Vector embeddings for semantic search

## License

This project is for educational and demonstration purposes.

## Support

For issues and questions, please check the troubleshooting section or review the configuration files.