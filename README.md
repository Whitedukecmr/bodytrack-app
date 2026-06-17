# BodyTrack 🏋️

Application de suivi de perte de poids et recomposition corporelle, sans saisie manuelle. Tout passe par photo : repas, écrans de santé, balance connectée — analysés par IA (Claude via AWS Bedrock).

## Stack
- Frontend : React + Vite
- Backend : Node.js + Express + PostgreSQL
- IA : AWS Bedrock (Claude 3.5 Sonnet)
- Infra : EC2 + ECR + Terraform + GitHub Actions + Nginx + Let's Encrypt

## Variables d'environnement requises (secrets GitHub)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `ECR_REGISTRY`, `EC2_HOST`, `EC2_SSH_KEY`
- `DB_PASSWORD` : mot de passe PostgreSQL
- `JWT_SECRET` : secret pour signer les tokens (générer avec `openssl rand -hex 32`)

## Déploiement
```bash
git push origin main
```
