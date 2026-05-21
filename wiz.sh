#!/bin/bash
# ad-ai-wiz control script
# 用法: ./wiz.sh start|stop|restart|logs|status|rebuild

APP_DIR="/root/.openclaw/workspace/ad-ai-wiz"

action() {
  case "$1" in
    start)
      cd "$APP_DIR" && pm2 start ecosystem.config.cjs
      sleep 2
      curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000
      ;;
    stop)
      pm2 stop ad-ai-wiz 2>&1
      ;;
    restart)
      cd "$APP_DIR" && pm2 restart ad-ai-wiz 2>&1
      sleep 2
      curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000
      ;;
    logs)
      pm2 logs ad-ai-wiz --lines 20 --nostream 2>&1
      ;;
    status)
      pm2 status ad-ai-wiz 2>&1
      ;;
    rebuild)
      cd "$APP_DIR" && npm run build 2>&1 && npx prisma migrate deploy 2>&1
      pm2 restart ad-ai-wiz 2>&1
      sleep 2
      curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000
      ;;
    *)
      echo "用法: $0 start|stop|restart|logs|status|rebuild"
      ;;
  esac
}

action "$1"