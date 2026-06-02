# Deployment Layer Spec

## Project
- Name: uncannydani
- Type: static_frontend
- Stack: Vite, React, sessionStorage state, Cloudflare Pages hosting

## Runtime Model
- Execution environment: browser only
- State scope: session only
- Persistence layer: sessionStorage
- Backend: none

## Deployment Target
- Provider: Cloudflare Pages
- Artifact directory: `dist`
- Build command: `npm run build`
- Output mode: static site

## Dockerization
- Purpose: deterministic build environment only
- Scope: build and local preview only
- Not for hosting, deployment sync, or runtime orchestration

## Docker Image
- Base: `node:20-alpine`
- Workdir: `/app`

## Build Steps
1. Copy `package*.json`
2. Run `npm install`
3. Copy project source
4. Run `npm run build`
5. Optionally install `serve` for local preview

## Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- Docker is not required for deploy

## Architecture Relationship
- Docker: build normalization layer only
- Cloudflare Pages: deployment and hosting layer
- Browser: runtime execution engine
