# Ipadeola O. Taiwo — Cloud & DevOps Portfolio

Personal portfolio website for **Ipadeola O. Taiwo**, a Cloud & DevOps Engineer focused on Microsoft Azure, Terraform, and CI/CD automation. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies.

**Live site:** [taiwoipadeola.space](https://www.taiwoipadeola.space)

---

## What This Site Covers

- **About** — background, approach, and career objective
- **Skills** — technical stack earned through real project work
- **Timeline** — engineering journey from March 2026 to present
- **Projects** — six completed cloud projects with GitHub links
- **Certifications** — Linux Foundation completions and AZ-104 roadmap
- **Articles** — live feed from Dev.to + links to Hashnode
- **Contact** — LinkedIn, GitHub, Dev.to, Hashnode, email

---

## Tech Stack

| Layer | Choice |
|---|---|
| Markup | HTML5 (semantic) |
| Styling | CSS3 (custom design system, dark/light mode) |
| Behaviour | Vanilla JavaScript |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Articles | Dev.to public API |
| Hosting | Azure Blob Storage + Azure CDN |

---

## Features

- **Dark / light mode toggle** — persisted via localStorage
- **Responsive** — mobile, tablet, desktop
- **Live article feed** — pulls latest posts from Dev.to API automatically
- **Smooth scroll navigation** — with active section highlighting
- **Animated terminal card** — in the hero section
- **Accessible** — semantic HTML, ARIA labels, keyboard navigation, reduced motion support

---

## Project Structure

```
portfolio/
├── index.html          # All content and markup
├── style.css           # Design system and component styles
├── script.js           # Theme toggle, nav, Dev.to API fetch
└── assets/
    ├── taiwo-photo.jpg # Profile photo
    └── taiwo-resume.pdf # Downloadable resume
```

---

## Featured Cloud Projects

All projects are deployed in real Azure subscriptions and documented on Dev.to and Hashnode.

| Project | Stack | Repo |
|---|---|---|
| Terraform Enterprise Multi-Environment | Terraform, Azure, Remote State, Modules | [terraform-enterprise](https://github.com/highpee1991/terraform-enterprise) |
| Terraform VM with Remote State | Terraform, Azure VM, State Locking | [terraform-IAC](https://github.com/highpee1991/terraform-IAC) |
| Terraform VM First Deployment | Terraform, HCL, Azure VM, Nginx | [Terraform-Virtual-Machine-Deployment](https://github.com/highpee1991/Terraform-Virtual-Machine-Deployment) |
| Azure CLI Lab | Azure CLI, Bash, Resource Groups | [azure-cli-lab](https://github.com/highpee1991/azure-cli-lab) |
| Azure Secure Infrastructure Lab | VNet, NSG, Bastion, NAT Gateway | [azure-cli-lab](https://github.com/highpee1991/azure-cli-lab) |
| CI/CD Pipeline | GitHub Actions, Terraform, Azure | In Progress |

---

## Writing

Technical articles documenting real builds, real errors, and real fixes:

- **Dev.to:** [dev.to/highpee1991](https://dev.to/highpee1991)
- **Hashnode:** [highpeedev.hashnode.dev](https://highpeedev.hashnode.dev)

---

## Contact

- **LinkedIn:** [linkedin.com/in/ipadeola-taiwo](https://www.linkedin.com/in/ipadeola-taiwo/)
- **GitHub:** [github.com/highpee1991](https://github.com/highpee1991)
- **Email:** ipadeola.it@gmail.com

---

## Local Development

No build step. No package manager. Open directly in a browser:

---

## Deployment

Hosted on **Azure Blob Storage** with static website enabled, served via **Azure CDN** with a custom domain and HTTPS.

```bash
# Upload to Azure Blob Storage
az storage blob upload-batch \
  --source . \
  --destination '$web' \
  --account-name YOUR_STORAGE_ACCOUNT \
  --overwrite

# Purge CDN cache after update
az cdn endpoint purge \
  --resource-group YOUR_RG \
  --profile-name YOUR_CDN_PROFILE \
  --name YOUR_ENDPOINT \
  --content-paths '/*'
```

---

*Built and maintained by Ipadeola O. Taiwo · Cloud & DevOps Engineer · Azure · Terraform · CI/CD*
