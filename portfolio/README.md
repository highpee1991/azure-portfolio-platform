# Azure Portfolio Platform

A personal portfolio website deployed on Azure, built entirely with Terraform and automated through two independent GitHub Actions pipelines. Live at [taiwoipadeola.space](https://taiwoipadeola.space).

This project was built as a hands on infrastructure as code exercise: provisioning cloud infrastructure, wiring up a CDN with custom domains and managed TLS, and automating both infrastructure changes and content deploys through separate, purpose built pipelines, each one owning a different part of the system.

Full build story with every bug hit and fixed:
- Dev.to: https://dev.to/highpee1991/building-and-automating-my-portfolio-website-on-azure-with-terraform-and-github-actions-4f54
- Hashnode: https://highpeedev.hashnode.dev/building-and-automating-my-portfolio-website-on-azure-with-terraform-and-github-actions

---

## Overview

**Stack:** Terraform (IaC) · Azure Storage (static website hosting) · Azure Front Door (CDN, custom domains, TLS) · GitHub Actions (CI/CD) · Namecheap (DNS)

**What it demonstrates:**
- Modular Terraform with a remote backend kept in its own isolated resource group, separate from the resources it manages
- A CDN layer (Front Door) in front of static storage, with two custom domains and managed certificates
- Two fully independent CI/CD pipelines, one for infrastructure, one for content, so a copy edit deploys in under a minute without touching Terraform at all
- A deliberate ownership split: Terraform owns infrastructure only, a separate pipeline owns file content, avoiding the two systems fighting over the same resource
- Real world troubleshooting: state lock recovery, cross platform line ending drift between a Windows dev machine and Linux CI runners, Azure CLI authentication quirks, and a hanging preview extension

### Architecture

```
                              Visitor's Browser
                                     |
                                  HTTPS
                                     |
                              Azure Front Door
                        portfolio-frontdoor-profile
                (taiwoipadeola.space + www custom domains)
                        (managed TLS, caching, compression)
                                     |
                                  origin
                                     |
                       Azure Storage Static Website
                     productioncontainerweb / $web container
                    index.html, style.css, script.js, 404.html


        DNS (Namecheap, unmanaged by Terraform)
        --------------------------------------------
          ALIAS   @    -> Front Door endpoint
          CNAME   www  -> Front Door endpoint
          TXT   _dnsauth(.www) -> validation token


        Terraform state backend (isolated, separate resource group)
        --------------------------------------------
          portfolio-tfstate-rg
            -> portfoliotfstatestorage
                 -> portfolio-tfstate-container
                      -> production.tfstate


        CI/CD (GitHub Actions, split by what changed)
        -------------------------------------------------------------
          terraform.yml                    deploy.yml
          trigger: infrastructure/**        trigger: portfolio/**

          fmt -> init -> validate -> plan   az storage blob sync
          PR: plan only                       --delete-destination true
          push to main: plan + apply        az afd endpoint purge
                                             no terraform involved at all
```

Two resource groups exist on purpose. `static-web-production-rg` holds everything that actually serves the live site (storage account, Front Door profile, endpoint, routes). `portfolio-tfstate-rg` holds only the storage account Terraform uses for its own state file. If the production resource group is ever destroyed and rebuilt, the state itself is never at risk, since it lives somewhere Terraform never touches as a managed resource.

### Repo layout

```
azure-portfolio-platform/
├── .github/workflows/
│   ├── terraform.yml        # infra pipeline: fmt/init/validate/plan/apply
│   └── deploy.yml           # content pipeline: sync portfolio/ + purge cache
├── infrastructure/
│   ├── environments/production/
│   │   ├── main.tf          # root module, wires storage + front-door + custom-domain
│   │   ├── backend.tf       # remote state backend config
│   │   ├── providers.tf     # provider config
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── modules/
│       ├── storage/         # storage account + static website config only
│       ├── front-door/      # profile, endpoint, origin group, origin, route
│       └── custom-domain/   # apex + www custom domains, managed TLS
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

Infrastructure changes (storage account settings, Front Door config, custom domains, etc.) go through `infrastructure/` and are owned entirely by Terraform.

1. Edit the relevant `.tf` file(s) under `infrastructure/`
2. Open a pull request. `terraform.yml` runs `fmt -check`, `init`, `validate`, and `plan` automatically. Review the plan output in the PR checks before merging
3. Merge to `main`. The same workflow re-runs, and because the trigger is a direct push to `main`, the `apply` step also runs automatically:

```yaml
- name: Terraform Apply
  working-directory: ${{ env.WORKING_DIR }}
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: terraform apply -input=false -auto-approve tfplan
```

That condition is what keeps pull requests safe. Both `github.event_name == 'push'` and `github.ref == 'refs/heads/main'` have to be true for apply to run, so a PR only ever gets as far as plan, and shows the apply step as skipped rather than executed.

No manual `terraform apply` from a local machine is required or expected in normal use. For debugging only:

```bash
cd infrastructure/environments/production
terraform init
terraform plan
terraform apply
```

### Making a content change (portfolio edits)

Content changes (HTML/CSS/JS/assets) go through `portfolio/` and are fully decoupled from Terraform. Terraform does not track individual file content, hashes, or blob resources at all, only the storage account and static website configuration.

1. Edit any file under `portfolio/`
2. Push to `main`. `deploy.yml` triggers automatically, path filtered to `portfolio/**`, so a push that only touches `infrastructure/` will not fire it

```yaml
- name: Sync portfolio files to Blob Storage
  run: |
    az storage blob sync \
      --account-name productioncontainerweb \
      --container '$web' \
      --source portfolio \
      --delete-destination true

- name: Purge Front Door cache
  run: |
    az config set extension.use_dynamic_install=yes_without_prompt
    az config set extension.dynamic_install_allow_preview=true
    az afd endpoint purge \
      --resource-group static-web-production-rg \
      --profile-name portfolio-frontdoor-profile \
      --endpoint-name portfolio-frontdoor-endpoint \
      --content-paths "/*"
```

`az storage blob sync` compares the local `portfolio/` folder against the `$web` container and only uploads what actually changed, it does not blindly re-upload everything on every run. `--delete-destination true` makes the container an exact mirror, meaning a file removed locally is also removed from the container. The purge step exists because Front Door caches responses at the edge, so without it a deployed change can be invisible to visitors until the cache naturally expires.

### Why Terraform no longer manages portfolio file content

Early in the project, the storage module used a `fileset()` call plus an `azurerm_storage_blob` resource with `content_md5` to upload every portfolio file directly through `terraform apply`. This caused a real conflict once both a human (running Terraform locally) and a pipeline (running Terraform in CI) could touch the same files, along with a cross platform line ending bug (see troubleshooting table below). The fix was to remove Terraform's ownership of file content entirely and hand that job to `deploy.yml`.

If you're setting up something similar and need to detach Terraform from resources it currently manages without destroying them, the process is:

1. Delete the resource block and any supporting `locals` from the `.tf` file
2. Check `outputs.tf` and `variables.tf` in the same module for any reference to the removed resource, and remove those too, or `terraform validate` will fail on an undefined resource
3. Run `terraform state rm` for each resource instance, which tells Terraform to forget about it without touching anything live:

```bash
terraform state rm 'module.storage_account.azurerm_storage_blob.portfolio["index.html"]'
# repeat for each file
```

4. Run `terraform plan` and confirm it comes back clean, meaning Terraform no longer thinks it owns those resources and will not try to delete them on the next apply

### Destroying the environment

To tear everything down (e.g. at the end of a learning cycle, to avoid ongoing cost):

```bash
cd infrastructure/environments/production
terraform destroy
```

Note: DNS records at Namecheap are **not** managed by Terraform and will not be removed automatically. Remove the ALIAS/CNAME/TXT records manually in Namecheap's Advanced DNS panel if the domain will point elsewhere afterward.

### Troubleshooting notes (from real issues hit on this project)

| Symptom | Cause | Fix |
|---|---|---|
| `terraform plan` shows blob files "must be replaced" in CI but not locally | Windows `core.autocrlf` silently converts checked out files to CRLF on disk locally, while Linux CI runners keep the LF stored in the repo, so the two environments hash different bytes for the same file | `git config core.autocrlf false`, then `git rm -r --cached . && git reset --hard HEAD` to force a clean LF checkout locally, then apply once to resync state to the LF based hash |
| `Error building ARM Config: Authenticating using the Azure CLI is only supported as a User (not a Service Principal)` | `azure/login` authenticates the CLI session on the runner, but the `azurerm` Terraform provider does its own separate authentication and does not inherit that session | Set `ARM_CLIENT_ID` / `ARM_CLIENT_SECRET` / `ARM_SUBSCRIPTION_ID` / `ARM_TENANT_ID` as job level env vars so the provider authenticates independently of the CLI login |
| `Error acquiring the state lock` that never clears | A prior apply was interrupted mid-run (e.g. network drop) and left a dangling blob lease on the state file | `az storage blob lease break --account-name <acct> --container-name <container> --blob-name <key> --lease-break-period 0` |
| `az afd endpoint purge` hangs indefinitely in CI with no error | The `cdn` CLI extension is preview only, so the dynamic install prompt has no stable path and no one to answer it in a non interactive shell | `az config set extension.use_dynamic_install=yes_without_prompt` **and** `az config set extension.dynamic_install_allow_preview=true` before the purge command, both are required, one alone is not enough for a preview only extension |
| `az storage blob upload-batch --delete-destination` fails with `unrecognized arguments` | `--delete-destination` is not a valid flag on `upload-batch`, it belongs to a different command entirely | Use `az storage blob sync` instead, which supports `--delete-destination` and does real content comparison rather than a blind one way push |
| Deleting a Front Door custom domain fails: `This resource is still associated with a route` | Terraform tried to destroy the custom domain before detaching it from the route | Two pass apply: first set `cdn_frontdoor_custom_domain_ids = []` on the route and apply, then make the real change and apply again |
| Custom domain shows "Validation approved" but HTTPS still errors | Managed certificate issuance happens after validation and can lag by minutes to hours | Check the certificate status field specifically on the custom domain's detail page, not just the validation badge, and test in an incognito window to avoid stale cert or HSTS caching |
| `terraform apply` wants to delete portfolio blobs after removing the blob resource from code | Deleting a resource block from `.tf` files only changes the code, Terraform's state still remembers the resource and interprets "missing from config" as "delete it" | Run `terraform state rm` for every instance first (see above) before applying, this removes Terraform's memory of the resource without touching the real blob |

---

## Status

- ✅ Infrastructure (storage, static website hosting)
- ✅ Front Door (CDN, caching, compression)
- ✅ Custom domains (apex + www) with managed TLS
- ✅ CI/CD, infrastructure pipeline (plan on PR, apply on merge to main)
- ✅ CI/CD, content pipeline (portfolio sync + cache purge, fully decoupled from Terraform)