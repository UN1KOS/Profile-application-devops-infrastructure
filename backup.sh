#!/bin/bash

# ========== НАСТРОЙКИ ==========
BACKUP_DIR="/home/gleb/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
PROJECT_NAME="profile-app"
RETENTION_DAYS=7

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Создаём папку для бэкапов
mkdir -p $BACKUP_DIR/{db,images,configs}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Начинаем бэкап проекта $PROJECT_NAME${NC}"
echo -e "${GREEN}========================================${NC}"

# ========== 1. БЭКАП БАЗЫ ДАННЫХ ==========
echo -e "${YELLOW}📦 Бэкап PostgreSQL...${NC}"

# Создаём дамп БД через pg_dump (более надёжно чем просто volume)
docker exec postgres pg_dump -U gleb app_db > $BACKUP_DIR/db/${PROJECT_NAME}_db_${DATE}.sql

# Бэкапим volume с данными (на всякий случай)
docker run --rm \
  -v pgdata:/data \
  -v $BACKUP_DIR/db:/backup \
  alpine tar czf /backup/${PROJECT_NAME}_pgdata_${DATE}.tar.gz -C /data .

echo -e "${GREEN}✅ БД сохранена в: $BACKUP_DIR/db/${PROJECT_NAME}_db_${DATE}.sql${NC}"
echo -e "${GREEN}✅ Volume сохранён в: $BACKUP_DIR/db/${PROJECT_NAME}_pgdata_${DATE}.tar.gz${NC}"

# ========== 2. БЭКАП DOCKER ОБРАЗОВ ==========
echo -e "${YELLOW}📦 Бэкап Docker образов...${NC}"

# Сохраняем все используемые образы
docker save project-backend:latest -o $BACKUP_DIR/images/backend_${DATE}.tar
docker save project-frontend:latest -o $BACKUP_DIR/images/frontend_${DATE}.tar
docker save postgres:17 -o $BACKUP_DIR/images/postgres_${DATE}.tar
docker save nginx:alpine -o $BACKUP_DIR/images/nginx_${DATE}.tar
docker save httpd:2.4 -o $BACKUP_DIR/images/apache_${DATE}.tar

# Сжимаем для экономии места
gzip $BACKUP_DIR/images/*.tar

echo -e "${GREEN}✅ Образы сохранены в: $BACKUP_DIR/images/${NC}"

# ========== 3. БЭКАП КОНФИГОВ ==========
echo -e "${YELLOW}📦 Бэкап конфигурационных файлов...${NC}"

tar czf $BACKUP_DIR/configs/${PROJECT_NAME}_configs_${DATE}.tar.gz \
  docker-compose.yml \
  .env \
  nginx/ \
  apache/ \
  backend/ \
  frontend/

echo -e "${GREEN}✅ Конфиги сохранены в: $BACKUP_DIR/configs/${PROJECT_NAME}_configs_${DATE}.tar.gz${NC}"

# ========== 4. УДАЛЕНИЕ СТАРЫХ БЭКАПОВ ==========
echo -e "${YELLOW}🧹 Очистка бэкапов старше $RETENTION_DAYS дней...${NC}"

find $BACKUP_DIR/db -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR/images -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR/configs -type f -mtime +$RETENTION_DAYS -delete

# ========== 5. ИТОГ ==========
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Бэкап завершён успешно!${NC}"
echo -e "${GREEN}📁 Папка с бэкапами: $BACKUP_DIR${NC}"
echo -e "${GREEN}========================================${NC}"

# Показываем размер бэкапов
du -sh $BACKUP_DIR
