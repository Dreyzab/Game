#!/bin/bash

# Configuration
# Replace these with your desired values
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT_NAME="github-actions-deployer"
POOL_NAME="github-actions-pool"
PROVIDER_NAME="github-actions-provider"
REPO_NAME="<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>" # e.g., "johndoe/grezwanderer3"

echo "Using Project ID: $PROJECT_ID"
echo "Make sure to update REPO_NAME in this script before running!"
echo "Current REPO_NAME: $REPO_NAME"

# 1. Enable APIs
echo "Enabling required APIs..."
gcloud services enable iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  artifactregistry.googleapis.com \
  run.googleapis.com

# 2. Create Service Account
echo "Creating Service Account..."
gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
  --display-name="GitHub Actions Deployer" || echo "Service account likely exists"

# 3. Grant Permissions
echo "Granting permissions..."
# Grant Artifact Registry Admin and Cloud Run Admin
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 4. Create Workload Identity Pool
echo "Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create "${POOL_NAME}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool" || echo "Pool likely exists"

# 5. Create Workload Identity Provider
echo "Creating Workload Identity Provider..."
gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_NAME}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_NAME}" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" || echo "Provider likely exists"

# 6. Allow GitHub Actions to impersonate Service Account
echo "Binding Service Account to Workload Identity..."
gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${REPO_NAME}"

# 7. Output Configuration for GitHub Actions
WORKLOAD_IDENTITY_PROVIDER="projects/$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo ""
echo "===================================================="
echo "SETUP COMPLETE!"
echo "===================================================="
echo "Update your .github/workflows/deploy.yml with the following:"
echo ""
echo "      - name: Google Auth"
echo "        id: auth"
echo "        uses: google-github-actions/auth@v2"
echo "        with:"
echo "          workload_identity_provider: '${WORKLOAD_IDENTITY_PROVIDER}'"
echo "          service_account: '${SERVICE_ACCOUNT_EMAIL}'"
echo "===================================================="
