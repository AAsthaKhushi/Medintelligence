# MedGenie 2.0 - AI-Powered Prescription Management System

## Overview

MedGenie 2.0 is a comprehensive medical prescription management system that leverages AI technologies for document processing, data extraction, and intelligent chatbot assistance. The application enables healthcare professionals to upload prescription documents, automatically extract structured medical data using OpenAI's GPT-4o, store information in a searchable database, and interact with an AI assistant for prescription-related queries.

## System Architecture

### Full-Stack Monorepo Structure
- **Frontend**: React-based SPA with TypeScript, Vite, and Tailwind CSS
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM and vector search capabilities
- **AI Integration**: OpenAI GPT-4o for document extraction and chat responses
- **File Processing**: Multer for file uploads with support for PDF, images, and DOCX
- **UI Framework**: Shadcn/ui components with Radix UI primitives

### Development Environment
- Replit-hosted with integrated PostgreSQL database
- Hot module replacement via Vite in development
- ESM modules throughout the stack
- Shared type definitions between client and server

## Key Components

### Database Schema (`shared/schema.ts`)
- **Users**: Authentication and user management
- **Prescriptions**: Core prescription documents with AI processing status
- **Medicines**: Extracted medication details linked to prescriptions  
- **Chat Conversations**: AI assistant conversation history
- **Vector Embeddings**: 1536-dimension vectors for semantic search using OpenAI embeddings

### File Processing Service (`server/services/fileProcessor.ts`)
- Multi-format support: PDF, JPEG, PNG, DOCX
- 10MB file size limit
- In-memory processing with Multer
- Secure file validation and storage

### AI Services (`server/services/openai.ts`)
- **Document Extraction**: Structured data extraction from prescription images/documents
- **Embedding Generation**: Text-to-vector conversion for semantic search
- **Chat Responses**: Context-aware AI assistance using prescription data
- **Confidence Scoring**: AI extraction reliability metrics

### Frontend Architecture
- **React Query**: Server state management and caching
- **Wouter**: Lightweight client-side routing
- **Component-driven**: Modular UI with Shadcn/ui design system
- **Responsive Design**: Mobile-first Tailwind CSS implementation

## Data Flow

1. **Document Upload**: User uploads prescription files via drag-and-drop interface
2. **AI Processing**: OpenAI GPT-4o extracts structured medical data from documents
3. **Data Storage**: Extracted information stored in PostgreSQL with generated embeddings
4. **Vector Search**: Semantic similarity search across prescription database
5. **Chat Interface**: AI assistant provides contextual responses using prescription data
6. **Real-time Updates**: WebSocket-like polling for processing status updates

## External Dependencies

### AI & Machine Learning
- **OpenAI API**: GPT-4o model for document extraction and chat completions
- **Vector Search**: PostgreSQL pgvector extension for semantic search
- **Neon Database**: Serverless PostgreSQL with vector capabilities

### Frontend Libraries
- **React 18**: Core UI framework with hooks and suspense
- **Tanstack Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide Icons**: Consistent iconography

### Backend Infrastructure
- **Express.js**: Web server framework
- **Drizzle ORM**: Type-safe database operations
- **Multer**: File upload middleware
- **ws**: WebSocket support for real-time features

## Deployment Strategy

### Replit Configuration
- **Build Process**: Vite client build + ESBuild server compilation
- **Production Mode**: Node.js server serving static assets
- **Development Mode**: Vite dev server with Express API proxy
- **Database**: Neon PostgreSQL with connection pooling

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `NODE_ENV`: Environment configuration

### Port Configuration
- **Development**: Port 5000 for local development
- **Production**: Port 80 for external access
- **Auto-scaling**: Replit autoscale deployment target

## Changelog

```
Changelog:
- June 16, 2025. Initial setup
- June 16, 2025. AI extraction workflow completed and tested successfully
  - GPT-4o Vision successfully extracted data from handwritten prescription
  - Timeout handling added to prevent API call delays
  - Complete prescription processing pipeline validated
  - Database vector search and chat functionality verified
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```