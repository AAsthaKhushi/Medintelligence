# Netlify Deployment Guide

This guide will help you deploy your MedIntelligence application to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Netlify CLI**: Install globally with `npm install -g netlify-cli`
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## Environment Variables Setup

Before deploying, you need to set up these environment variables in Netlify:

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string with pgvector | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `NODE_ENV` | Environment mode | `production` |

### Optional Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | Session encryption key | `random-secret-string` |

## Deployment Steps

### 1. Install Dependencies

```bash
# Navigate to your project directory
cd MedIntelligence

# Install dependencies
npm install
```

### 2. Test Build Locally

```bash
# Test the Netlify build command
npm run build:netlify

# Test with Netlify CLI locally
netlify dev
```

### 3. Deploy to Netlify

#### Option A: Using Netlify CLI

```bash
# Login to Netlify
netlify login

# Initialize Netlify (if not already done)
netlify init

# Deploy
netlify deploy --prod
```

#### Option B: Using Git Integration

1. **Connect Repository**:
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Choose your Git provider and repository

2. **Configure Build Settings**:
   - **Build command**: `npm run build:netlify`
   - **Publish directory**: `dist/public`
   - **Functions directory**: `netlify/functions`

3. **Set Environment Variables**:
   - Go to Site settings > Environment variables
   - Add all required environment variables

4. **Deploy**:
   - Click "Deploy site"

### 4. Configure Domain (Optional)

1. Go to Site settings > Domain management
2. Add your custom domain
3. Configure DNS settings as instructed

## Database Setup

### Option A: Neon Database (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new PostgreSQL database
3. Enable pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy the connection string to your Netlify environment variables

### Option B: Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Enable pgvector extension in the SQL editor
4. Use the connection string in your environment variables

## File Upload Configuration

Since Netlify Functions have limitations with file uploads, you have a few options:

### Option A: Use External Storage

1. **AWS S3**: Configure S3 for file storage
2. **Cloudinary**: Use Cloudinary for image processing
3. **Supabase Storage**: Use Supabase storage

### Option B: Limit File Size

Update your upload configuration to limit file sizes to work within Netlify's limits.

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check build logs
netlify logs

# Test build locally
npm run build:netlify
```

#### Function Timeouts

- Netlify Functions have a 10-second timeout limit
- Optimize your AI processing for faster responses
- Consider using background jobs for long-running tasks

#### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check pgvector extension
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

#### API Endpoints Not Working

- Ensure all API calls use the correct base URL (`/.netlify/functions/api`)
- Check that the `netlify.toml` redirects are configured correctly
- Verify that the serverless function is building properly

### Performance Optimization

1. **Enable Caching**: Configure caching headers in `netlify.toml`
2. **Optimize Images**: Use WebP format and proper sizing
3. **Code Splitting**: Ensure your React app uses code splitting
4. **CDN**: Netlify automatically provides CDN for static assets

## Monitoring

### Netlify Analytics

1. Enable Netlify Analytics in your site settings
2. Monitor function invocations and performance
3. Set up alerts for function failures

### Logs

```bash
# View function logs
netlify logs --functions

# View build logs
netlify logs --build
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **CORS**: Configure CORS properly for your domain
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Input Validation**: Validate all user inputs

## Cost Optimization

1. **Function Invocations**: Monitor function usage to avoid overages
2. **Database Connections**: Use connection pooling
3. **Caching**: Implement proper caching strategies
4. **CDN**: Leverage Netlify's CDN for static assets

## Support

- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Netlify Community**: [community.netlify.com](https://community.netlify.com)
- **Function Limits**: [docs.netlify.com/functions/overview](https://docs.netlify.com/functions/overview)

---

Your MedIntelligence application should now be successfully deployed on Netlify! 🚀 