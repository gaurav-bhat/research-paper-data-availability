# Configuration Templates

This directory contains sanitized configuration examples from the production payment portal described in the Research Paper.

## 📋 Files

### `env.example`
Complete environment variable template with all configuration options used in production.

**Sections:**
- Application settings (Node.js, ports, URLs)
- Session management (timeouts, encryption, Redis Standard Tier)
- Database configuration (primary + read replica)
- Authentication (OIDC/OAuth integration)
- Payment processors (Chase Paymentech, PCIPal)
- External system redirects
- Security & compliance settings
- Monitoring and observability
- Performance tuning parameters
- Feature flags

**Usage:**
```bash
# Copy to your project
cp env.example /path/to/project/.env

# Replace all [PLACEHOLDER] values
# Generate session encryption key:
openssl rand -hex 32

# Validate required variables
node -e "require('dotenv').config(); console.log(process.env.SESSION_ENCRYPTION_KEY ? '✓' : '✗ Missing SESSION_ENCRYPTION_KEY')"
```

### `session.config.ts`
TypeScript configuration demonstrating the session management approach.

**Key Features:**
- Redis Standard Tier driver for stateless Cloud Run deployment
- Security best practices (httpOnly, secure, sameSite)
- 30-minute session timeout with extension logic
- Type-safe session data structure

**Research Paper Reference:** Section 2.1 - Session Management Strategy

**Usage:**
```typescript
import { sessionConfig, sessionTimeoutConfig } from './session.config.ts'

// Use in AdonisJS configuration
export default defineConfig({
  session: sessionConfig,
  // ... other config
})
```

### `cloud-run.yaml`
Google Cloud Run service configuration for production deployment.

**Includes:**
- Primary region configuration (us-central1)
- Disaster recovery region setup (us-east1)
- Auto-scaling parameters (min: 1, max: 100)
- Resource limits (2Gi memory, 1 CPU)
- Health check probes
- VPC connector integration
- Secret Manager references

**Research Paper Reference:** Appendix A - Cloud Run Deployment Configuration

**Deployment:**
```bash
# Replace placeholders in cloud-run.yaml:
# - [PROJECT_ID]: Your GCP project ID
# - [SERVICE_ACCOUNT]: Your service account email

# Deploy to Cloud Run
gcloud run services replace cloud-run.yaml --region=us-central1

# Verify deployment
gcloud run services describe pay-portal-prod --region=us-central1
```

## 🔒 Security Considerations

**⚠️ IMPORTANT:**
- Never commit files with actual credentials to version control
- Use Google Secret Manager or equivalent for production secrets
- Rotate all credentials if accidentally exposed
- Test in staging environment before production

**Secret Management:**
```bash
# Store secrets in Google Secret Manager
echo -n "your-secret-value" | gcloud secrets create secret-name --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding secret-name \
  --member="serviceAccount:SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 🎓 Educational Use

These templates are designed for:
- Learning cloud-native application configuration
- Understanding payment system security requirements
- Studying environment management best practices
- Comparing legacy vs. modern configuration approaches

## 📖 Related Research Paper Sections

- **Section 2**: Planning the Migration (Architecture Decisions)
- **Appendix A**: Production Readiness (Security, Performance, Deployment)
- **Appendix A**: Metrics and Terminology (Environment Leakage definition)

## 🤝 Customization Guide

### Adapting for Different Cloud Providers

**AWS (ECS/Fargate):**
- Replace Cloud Run YAML with ECS task definition
- Use AWS Secrets Manager instead of GCP Secret Manager
- Adjust VPC and security group configurations

**Azure (Container Apps):**
- Convert to Azure Container Apps configuration
- Use Azure Key Vault for secrets
- Adjust networking for Azure Virtual Network

### Adapting for Different Frameworks

**Express.js:**
```javascript
// Convert session config to express-session
const session = require('express-session')
const RedisStore = require('connect-redis')(session)

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_ENCRYPTION_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 60 * 1000
  }
}))
```

**NestJS:**
```typescript
// Use @nestjs/config module
import { ConfigModule } from '@nestjs/config'
import sessionConfig from './session.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [sessionConfig],
      isGlobal: true,
    }),
  ],
})
```

## 🐛 Troubleshooting

**Common Issues:**

1. **"Invalid secret reference" in Cloud Run**
   - Ensure secret exists in Secret Manager
   - Verify service account has `secretAccessor` role
   - Check secret name matches exactly (case-sensitive)

2. **Session not persisting**
   - Verify Redis Standard Tier connection settings
   - Check `SESSION_DRIVER=redis` in environment
   - Ensure Redis Standard Tier instance is accessible from Cloud Run (VPC connector)

3. **CSRF token errors**
   - Verify `CSRF_ENABLED=true`
   - Check template includes CSRF meta tag
   - Ensure client sends `X-CSRF-TOKEN` header

## 📊 Validation Checklist

Before using in production:

- [ ] All `[PLACEHOLDER]` values replaced
- [ ] Session encryption key generated (32-byte hex)
- [ ] Database credentials tested and working
- [ ] Redis Standard Tier connection verified
- [ ] Payment processor API keys validated
- [ ] OIDC/OAuth configuration tested
- [ ] Health check endpoints responding
- [ ] Secrets stored in Secret Manager
- [ ] Service account permissions configured
- [ ] VPC connector created and tested
- [ ] Environment-specific values correct
- [ ] Feature flags set appropriately

## 💡 Best Practices

1. **Environment Separation**: Use separate configuration files per environment (`.env.dev`, `.env.prod`)
2. **Secret Rotation**: Rotate credentials quarterly or after team member departure
3. **Configuration Validation**: Validate all required variables at application startup
4. **Audit Trail**: Log configuration changes (excluding secret values)
5. **Documentation**: Document any deviations from these templates

---

**License**: MIT License
**Last Updated**: March 22, 2026
