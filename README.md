# opeonclaw_home_server

OpenClaw + Cursor + home server 기반 자동화 개발 워크스페이스.

## 목표
- 서버에서 장시간 자동화 작업 실행
- 노트북에서는 Cursor로 중간 확인 및 수정
- 작업 지시 기반으로 개발 흐름 정리
- 로그와 문서를 남기면서 반복 가능한 구조 만들기

## 기본 구조
- `tasks/` : 작업 요청, 할 일, 실행 대상
- `logs/` : 실행 로그 및 결과 기록
- `scripts/` : 자동화 실행 스크립트
- `prompts/` : Cursor/OpenClaw용 프롬프트 템플릿
- `src/` : 실제 코드
- `config/` : 설정 파일
- `docs/` : 운영 문서와 워크플로우

## 기본 운영 방식
1. `tasks/`에 작업 내용을 작성
2. OpenClaw가 구조 설계 및 코드 작업 진행
3. 결과를 `logs/`와 코드 변경사항으로 남김
4. 노트북에서 Cursor로 확인 및 수정
5. 필요 시 GitHub로 push/pull

## 1차 방향
이 저장소는 우선 다음을 목표로 함:
- 자동 코딩 워크플로우 뼈대 만들기
- Cursor 연동용 작업 지시 구조 만들기
- 반복 작업 자동화를 위한 스크립트 기반 마련

## 다음 작업 추천
- `docs/workflow.md` 작성
- `tasks/inbox.md` 작성
- `scripts/bootstrap.sh` 추가
- 자동화할 첫 프로젝트 범위 정의
