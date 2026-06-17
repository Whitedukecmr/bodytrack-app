#!/bin/bash
# Script appelé par cron pour déclencher les rappels BodyTrack
# Usage: ./check-reminders.sh matin|midi|soir

MOMENT=$1
CRON_SECRET_FILE="$HOME/bodytrack/.cron_secret"

if [ ! -f "$CRON_SECRET_FILE" ]; then
  echo "Erreur: fichier .cron_secret introuvable dans ~/bodytrack/"
  exit 1
fi

CRON_SECRET=$(cat "$CRON_SECRET_FILE")

curl -s -X POST "http://localhost:3002/api/cron/check-reminders?moment=${MOMENT}" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  >> "$HOME/bodytrack/cron.log" 2>&1

echo "$(date) - Rappel ${MOMENT} déclenché" >> "$HOME/bodytrack/cron.log"
