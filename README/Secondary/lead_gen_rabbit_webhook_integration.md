# Lead Gen Rabbit Webhook Integration Guide

This document outlines how to test and implement webhook callback integration with Lead Gen Rabbit using the Webhook Callback Test node.

## Overview

The Webhook Callback Test node allows you to send test webhooks to Lead Gen Rabbit with different progress states and data. This is useful for testing the integration before deployment.

## Webhook URL Format

Lead Gen Rabbit should send webhooks to the following URL:

- **Production Webhook URL**: `https://lead-rabbit.replit.app/api/webhooks/workflow/6/node/webhook_trigger-1`
- **Development Webhook URL**: `https://358f51b5-fd9b-4fb9-82f8-7cf56a3f18d6-00-161sbihgzmt13.worf.replit.dev/api/webhooks/workflow/6/node/webhook_trigger-1`

## Authentication

Lead Gen Rabbit should include the following authentication in webhook requests:

- **API Key**: `LGR-API-ff82c91d7184d5eeb3f3a142`
- **Header Format**: `Authorization: Bearer LGR-API-ff82c91d7184d5eeb3f3a142`

## Progress Milestones

The Lead Gen Rabbit integration supports the following progress milestones:

1. **10% - Initial Search**: First stage of company search
2. **35% - Company Overview**: Basic company information gathered
3. **70% - Decision Maker Discovery**: Contact information for key decision makers found
4. **100% - Email Discovery**: Email addresses verified and complete results ready

## Webhook Payload Structure

Lead Gen Rabbit should send webhooks with the following payload structure:

```json
{
  "searchId": "unique-search-identifier",
  "status": "in_progress | completed",
  "stage": "COMPANY_OVERVIEW | DECISION_MAKER | EMAIL_DISCOVERY",
  "progress": 10 | 35 | 70 | 100,
  "timestamp": "2025-04-24T00:00:00.000Z",
  "results": {
    "companies": [
      {
        "name": "Company Name",
        "website": "https://company-website.com",
        "industry": "Industry",
        "score": 85
      }
    ],
    "contacts": [
      {
        "name": "Contact Name",
        "title": "Job Title",
        "company": "Company Name",
        "email": "contact@company.com",
        "score": 82
      }
    ],
    "metadata": {
      "moduleType": "COMPANY_OVERVIEW | DECISION_MAKER | EMAIL_DISCOVERY",
      "completedSearches": ["initial", "detailed", "validation"],
      "validationScores": {
        "companyScore": 85,
        "contactScore": 82,
        "emailScore": 79
      }
    }
  }
}
```

## Test Workflow

A test workflow named "Webhook Test Workflow" has been created to demonstrate the integration. This workflow:

1. Sends a 10% progress webhook
2. Waits 2 seconds
3. Sends a 35% progress webhook
4. Waits 2 seconds
5. Sends a 70% progress webhook
6. Waits 2 seconds
7. Sends a 100% progress webhook (completion)

To run the test workflow:

1. Navigate to the Workflows page
2. Find "Webhook Test Workflow" and click "Run"
3. Monitor the execution of each node and the results

## Sample Curl Commands for Lead Gen Rabbit Developers

Lead Gen Rabbit developers can test the webhook integration using these curl commands:

### 10% Progress Update
```bash
curl -X POST "https://lead-rabbit.replit.app/api/webhooks/workflow/6/node/webhook_trigger-1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LGR-API-ff82c91d7184d5eeb3f3a142" \
  -d '{
    "searchId": "test-123456",
    "status": "in_progress",
    "stage": "COMPANY_OVERVIEW",
    "progress": 10,
    "timestamp": "2025-04-24T12:00:00.000Z",
    "results": {
      "companies": [],
      "metadata": {
        "moduleType": "COMPANY_OVERVIEW",
        "completedSearches": [],
        "validationScores": {}
      }
    }
  }'
```

### 35% Progress Update
```bash
curl -X POST "https://lead-rabbit.replit.app/api/webhooks/workflow/6/node/webhook_trigger-1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LGR-API-ff82c91d7184d5eeb3f3a142" \
  -d '{
    "searchId": "test-123456",
    "status": "in_progress",
    "stage": "COMPANY_OVERVIEW",
    "progress": 35,
    "timestamp": "2025-04-24T12:01:00.000Z",
    "results": {
      "companies": [
        {
          "name": "Test Company 1",
          "website": "https://testcompany1.com",
          "industry": "Technology",
          "score": 85
        }
      ],
      "metadata": {
        "moduleType": "COMPANY_OVERVIEW",
        "completedSearches": ["initial"],
        "validationScores": {
          "companyScore": 85
        }
      }
    }
  }'
```

### 70% Progress Update
```bash
curl -X POST "https://lead-rabbit.replit.app/api/webhooks/workflow/6/node/webhook_trigger-1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LGR-API-ff82c91d7184d5eeb3f3a142" \
  -d '{
    "searchId": "test-123456",
    "status": "in_progress",
    "stage": "DECISION_MAKER",
    "progress": 70,
    "timestamp": "2025-04-24T12:02:00.000Z",
    "results": {
      "companies": [
        {
          "name": "Test Company 1",
          "website": "https://testcompany1.com",
          "industry": "Technology",
          "score": 85
        },
        {
          "name": "Test Company 2",
          "website": "https://testcompany2.com",
          "industry": "Software",
          "score": 78
        }
      ],
      "contacts": [
        {
          "name": "John Doe",
          "title": "CEO",
          "company": "Test Company 1",
          "score": 82
        }
      ],
      "metadata": {
        "moduleType": "DECISION_MAKER",
        "completedSearches": ["initial", "detailed"],
        "validationScores": {
          "companyScore": 85,
          "contactScore": 82
        }
      }
    }
  }'
```

### 100% Progress Update (Completion)
```bash
curl -X POST "https://lead-rabbit.replit.app/api/webhooks/workflow/6/node/webhook_trigger-1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LGR-API-ff82c91d7184d5eeb3f3a142" \
  -d '{
    "searchId": "test-123456",
    "status": "completed",
    "stage": "EMAIL_DISCOVERY",
    "progress": 100,
    "timestamp": "2025-04-24T12:03:00.000Z",
    "results": {
      "companies": [
        {
          "name": "Test Company 1",
          "website": "https://testcompany1.com",
          "industry": "Technology",
          "score": 85
        },
        {
          "name": "Test Company 2",
          "website": "https://testcompany2.com",
          "industry": "Software",
          "score": 78
        }
      ],
      "contacts": [
        {
          "name": "John Doe",
          "title": "CEO",
          "company": "Test Company 1",
          "email": "john.doe@testcompany1.com",
          "score": 82
        },
        {
          "name": "Jane Smith",
          "title": "CTO",
          "company": "Test Company 1",
          "email": "jane.smith@testcompany1.com",
          "score": 75
        },
        {
          "name": "Alex Johnson",
          "title": "VP of Marketing",
          "company": "Test Company 2",
          "email": "alex.johnson@testcompany2.com",
          "score": 79
        }
      ],
      "metadata": {
        "moduleType": "EMAIL_DISCOVERY",
        "completedSearches": ["initial", "detailed", "validation"],
        "validationScores": {
          "companyScore": 85,
          "contactScore": 82,
          "emailScore": 79
        }
      }
    }
  }'
```

## Troubleshooting

If you encounter issues with the webhook integration:

1. **Authentication Errors**: Ensure the API key is correctly formatted in the Authorization header
2. **Payload Format Errors**: Validate the JSON structure against the examples above
3. **CORS Errors**: These should be handled by the server, but contact support if issues persist
4. **Timeout Errors**: Webhook requests have a 10-second timeout - ensure responses are sent quickly