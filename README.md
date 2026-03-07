# DevOps Social Profiles — Production-like Infrastructure

Проект демонстрирует production-like инфраструктуру с контейнерами, CI/CD, мониторингом и reverse proxy. Развёртывание возможно одной командой, а архитектура соответствует подходам промышленного DevOps.

![Docker](https://img.shields.io/badge/docker-ready-blue)
![Monitoring](https://img.shields.io/badge/monitoring-prometheus%20%2B%20grafana-orange)
![CI/CD](https://img.shields.io/badge/CI/CD-gitlab-green)
![Infrastructure](https://img.shields.io/badge/infrastructure-containerized-brightgreen)

---
<p align="center">
  <img src="assets/ui.png" alt="Project UI" width="900">
</p>

<p align="center">
  <i>Главная страница приложения</i>
</p>
## 🚀 Быстрый старт

Для локального запуска (без GitLab registry и CI/CD):

```bash
git clone https://github.com/UN1KOS/Profile-application-devops-infrastructure.git
cd Profile-application-devops-infrastructure

cp .env.example .env

docker compose -f docker-compose.github.yml up -d --build
```
___

### После запуска:

- Frontend: http://localhost  
- API: http://localhost/api  
- Grafana: http://localhost:3001  
- Prometheus: http://localhost:9090  
- Cadvisor: http://localhost:8080
---

## 🏗 Архитектура

User → Nginx (Reverse Proxy) → Apache → FastAPI → PostgreSQL  

Мониторинг:

Prometheus → Grafana  
Node Exporter  
cAdvisor  
Postgres Exporter  

Watchtower автоматически обновляет контейнеры при появлении новых образов.

---

## 🧰 Стек технологий

- FastAPI  
- PostgreSQL  
- Nginx  
- Apache  
- Docker Compose  
- Prometheus  
- Grafana  
- Watchtower  
- GitLab CI/CD

---

## 🚀 Возможности инфраструктуры

Проект моделирует production-like DevOps стек:

✔ контейнеризация всего окружения  
✔ reverse proxy архитектура  
✔ мониторинг и метрики  
✔ автообновление контейнеров  
✔ изолированные Docker сети  
✔ готовый CI/CD pipeline  
✔ Infrastructure as code  

---

## ⚙ GitLab CI/CD

В проекте присутствует GitLab CI pipeline, который позволяет:

✔ тестировать backend и frontend  
✔ билдить Docker образы  
✔ пушить образы в registry  
✔ автоматически деплоить новые образы через Watchtower  
✔ хранить CI/CD конфигурацию в репозитории

