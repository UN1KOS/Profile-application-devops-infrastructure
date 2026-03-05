# DevOps Social Profiles — Production-like Infrastructure

Проект демонстрирует production-like инфраструктуру с контейнерами, CI/CD, мониторингом и reverse proxy. Развёртывание возможно одной командой, а архитектура соответствует подходам промышленного DevOps.

![Docker](https://img.shields.io/badge/docker-ready-blue)
![Monitoring](https://img.shields.io/badge/monitoring-prometheus%20%2B%20grafana-orange)
![CI/CD](https://img.shields.io/badge/CI/CD-gitlab-green)
![Infrastructure](https://img.shields.io/badge/infrastructure-containerized-brightgreen)

---

## 🚀 Quick Start (Simple mode)

Для локального запуска (без GitLab registry и CI/CD):

```bash
git clone https://github.com/UN1KOS/Profile-application-devops-infrastructure.git
cd Profile-application-devops-infrastructure

cp .env.example .env

docker compose -f docker-compose.github.yml up -d --build
