# Azure Portfolio Platform

A personal portfolio website deployed on Azure, built entirely with Terraform and automated through GitHub Actions CI/CD. Live at [taiwoipadeola.space](https://taiwoipadeola.space).

This project was built as a hands-on infrastructure-as-code exercise: provisioning cloud infrastructure, wiring up a CDN with custom domains and managed TLS, and automating both infrastructure changes and content deploys through separate, purpose-built pipelines.

---

## Overview

**Stack:** Terraform (IaC) · Azure Storage (static website hosting) · Azure Front Door (CDN, custom domains, TLS) · GitHub Actions (CI/CD) · Namecheap (DNS)

**What it demonstrates:**
- Modular Terraform, with a remote backend for state storage
- A CDN layer (Front Door) in front of static storage, with two custom domains and managed certificates
- Two independent CI/CD pipelines — one for infrastructure changes, one for content deploys — so a copy edit doesn't require a full `terraform plan`/`apply` cycle
- Real-world troubleshooting: state lock recovery, cross-platform line-ending drift between a Windows dev machine and Linux CI runners, Azure CLI auth quirks, and Front Door cache invalidation

### Architecture

```
                              ┌─────────────────────┐
                              │   Visitor's Browser  │
                              └──────────┬───────────┘
                                         │  HTTPS
                                         ▼
                          ┌──────────────────────────────┐
                          │        Azure Front Door       │
                          │  - taiwoipadeola.space (apex) │
                          │  - www.taiwoipadeola.space    │
                          │  - Managed TLS certificates    │
                          │  - Caching + compression       │
                          └──────────────┬─────────────────┘
                                         │  origin
                                         ▼
                          ┌──────────────────────────────┐
                          │   Azure Storage (Static Web)  │
                          │   productioncontainerweb/$web │
                          │   index.html / 404.html / ... │
                          └──────────────────────────────┘

        DNS (Namecheap, unmanaged by Terraform)
        ┌────────────────────────────────────────┐
        │  ALIAS  @   → Front Door endpoint       │
        │  CNAME  www → Front Door endpoint        │
        │  TXT   _dnsauth(.www) → validation token │
        └────────────────────────────────────────┘


        CI/CD (GitHub Actions)
        ┌───────────────────────────┐   ┌───────────────────────────┐
        │      terraform.yml        │   │        deploy.yml         │
        │  triggers on: infra/**    │   │  triggers on: portfolio/** │
        │                            │   │                            │
        │  PR      → plan only      │   │  push main → sync blobs   │
        │  main    → plan + apply   │   │             → purge cache │
        └───────────────────────────┘   └───────────────────────────┘
```

### Repo layout

```
azure-portfolio-platform/
├── .github/workflows/
│   ├── terraform.yml        # infra pipeline: fmt/init/validate/plan/apply
│   └── deploy.yml           # content pipeline: sync portfolio/ to blob storage
├── infrastructure/
│   ├── environments/production/
│   │   ├── main.tf          # root module, calls storage/front-door/custom-domain
│   │   ├── providers.tf     # backend + provider config
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── modules/
│       ├── storage/         # storage account + static website config
│       ├── front-door/      # profile, endpoint, origin, route
│       └── custom-domain/   # apex + www custom domains
├── portfolio/                # the actual site: index.html, style.css, script.js, 404.html, assets/
└── README.md
```

---

## Runbook

### Prerequisites

- Terraform >= 1.9
- Azure CLI, logged in (`az login`) with access to the target subscription
- A GitHub repo with the following secrets configured: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID` (a Service Principal with rights to the target resource group)

### Making an infrastructure change

Infrastructure changes (storage account settings, Front Door config, custom domains, etc.) go through `infrastructure/`.

1. Edit the relevant `.tf` file(s) under `infrastructure/`
2. Open a pull request — `terraform.yml` runs `fmt -check`, `init`, `validate`, and `plan` automatically; review the plan output in the PR checks
3. Merge to `main` — the same workflow re-runs and, because the trigger is a direct push to `main` (`github.event_name == 'push' && github.ref == 'refs/heads/main'`), the `apply` step also runs, applying the plan automatically
4. No manual `terraform apply` from a local machine is required or expected in normal use

**Local commands** (for debugging or manual verification only):

```bash
cd infrastructure/environments/production
terraform init
terraform plan
terraform apply
```

### Making a content change (portfolio edits)

Content changes (HTML/CSS/JS/assets) go through `portfolio/` and are fully decoupled from Terraform — Terraform does not track individual file content or hashes.

1. Edit any file under `portfolio/`
2. Push to `main` — `deploy.yml` triggers automatically (path-filtered to `portfolio/**`, so infra-only pushes won't fire it)
3. The workflow runs `az storage blob sync --delete-destination true`, mirroring `portfolio/` to the `$web` container — new/changed files are uploaded, files removed locally are removed from the container
4. The workflow then purges the Front Door cache (`az afd endpoint purge --content-paths "/*"`) so changes are visible immediately rather than waiting for cache expiry

### Destroying the environment

To tear everything down (e.g. at the end of a learning cycle, to avoid ongoing cost):

```bash
cd infrastructure/environments/production
terraform destroy
```

Note: DNS records at Namecheap are **not** managed by Terraform and will not be removed automatically — remove the ALIAS/CNAME/TXT records manually in Namecheap's Advanced DNS panel if the domain will point elsewhere afterward.

### Troubleshooting notes (from real issues hit on this project)

| Symptom | Cause | Fix |
|---|---|---|
| `terraform plan` shows blob files "must be replaced" in CI but not locally | Windows `core.autocrlf` converts checked-out files to CRLF locally, while Linux CI runners keep LF — different bytes, different content hash | `git config core.autocrlf false`, then `git rm -r --cached . && git reset --hard HEAD` to force a clean LF checkout locally; re-apply once to resync state |
| `Error building ARM Config: Authenticating using the Azure CLI is only supported as a User (not a Service Principal)` | `azure/login` authenticates the CLI, but the `azurerm` Terraform provider does its own separate auth and doesn't inherit that session | Set `ARM_CLIENT_ID` / `ARM_CLIENT_SECRET` / `ARM_SUBSCRIPTION_ID` / `ARM_TENANT_ID` as job-level env vars so the provider authenticates independently |
| `Error acquiring the state lock` that never clears | A prior apply was interrupted mid-run (e.g. network drop) and left a dangling blob lease | `az storage blob lease break --account-name <acct> --container-name <container> --blob-name <key> --lease-break-period 0` |
| `az afd endpoint purge` hangs indefinitely in CI | The `cdn` CLI extension is preview-only; the dynamic-install prompt has no one to answer it in a non-interactive shell | `az config set extension.use_dynamic_install=yes_without_prompt` **and** `az config set extension.dynamic_install_allow_preview=true` before the command |
| Deleting a Front Door custom domain fails: `This resource is still associated with a route` | Terraform tried to destroy the custom domain before detaching it from the route | Two-pass apply: first set `cdn_frontdoor_custom_domain_ids = []` on the route and apply (targeted), then make the real change and apply again |
| Custom domain shows "Validation approved" but HTTPS still errors | Managed certificate issuance happens *after* validation and can lag by minutes to hours | Check the certificate status field specifically on the custom domain's detail page, not just the validation badge; test in an incognito window to avoid stale cert/HSTS caching |

---

## Status

- ✅ Infrastructure (storage, static website hosting)
- ✅ Front Door (CDN, caching, compression)
- ✅ Custom domains (apex + www) with managed TLS
- ✅ CI/CD — infrastructure pipeline (plan on PR, apply on merge to main)
- ✅ CI/CD — content pipeline (portfolio sync + cache purge)
