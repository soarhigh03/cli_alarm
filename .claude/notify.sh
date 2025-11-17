#!/bin/bash

# Claude Code 알람 스크립트
# 사용법: ./notify.sh "제목" "메시지" [소리]

TITLE="${1:-Claude Code}"
MESSAGE="${2:-작업이 완료되었습니다}"
SOUND="${3:-Glass}"  # Glass, Ping, Pop, Purr 등

# 로그 파일에 실행 기록
echo "$(date '+%Y-%m-%d %H:%M:%S') - TITLE: $TITLE, MESSAGE: $MESSAGE, SOUND: $SOUND" >> /tmp/claude_notify.log

# macOS 알림 표시
osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\" sound name \"$SOUND\"" 2>> /tmp/claude_notify.log

# 소리 재생 (추가 알람)
afplay /System/Library/Sounds/${SOUND}.aiff 2>/dev/null || afplay /System/Library/Sounds/Glass.aiff 2>/dev/null

exit 0
