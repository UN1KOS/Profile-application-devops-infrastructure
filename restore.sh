#!/bin/bash

# ========== ВОССТАНОВЛЕНИЕ ==========
BACKUP_DIR="/home/gleb/backups"
DATE=$1  # передаём дату как аргумент

if [ -z "$DATE" ]; then
    echo "Укажите дату бэкапа (например: 2026-03-02_15-30-00)"
    exit 1
fi

echo "🔄 Восстанавливаем бэкап от $DATE..."

# Останавливаем контейнеры
docker-compose down

# Удаляем старый volume
docker volume rm project_pgdata || true

# Создаём новый volume
docker volume create project_pgdata

# Восстанавливаем данные БД из volume backup
docker run --rm \
  -v project_pgdata:/data \
  -v $BACKUP_DIR/db:/backup \
  alpine tar xzf /backup/profile-app_pgdata_${DATE}.tar.gz -C /data

# ИЛИ восстанавливаем из SQL дампа (если нужно)
docker run --rm \
  -v project_pgdata:/data \
  -v $BACKUP_DIR/db:/backup \
  alpine sh -c "cat /backup/profile-app_db_${DATE}.sql > /data/restore.sql"

# Запускаем контейнеры
docker-compose up -d

echo "✅ Восстановление завершено!"
