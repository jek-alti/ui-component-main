# TROUBLE_SHOOTING.md — GitHub Pages 게시 · 배포 워크플로 · 문제 해결

정적 HTML/JS 프로젝트(빌드 도구 없음)를 GitHub Pages에 게시하고 `main` 푸시 시 자동 배포하는
절차와, 실제로 겪은 문제·해결법을 정리한 문서. 다른 프로젝트에도 그대로 적용 가능하다.

> 예시 표기: `<OWNER>/<REPO>` = `owner/repo` 형식 (이 프로젝트는 `claude-code-expert/ui-component`).
> 공개 URL 형태: `https://<OWNER>.github.io/<REPO>/`

---

## 0. 사전 요구사항

```bash
gh auth status          # GitHub CLI 로그인 확인 (없으면 gh auth login)
                        # 토큰 scope에 'repo'와 'workflow'가 있어야 워크플로 파일을 푸시할 수 있다
git remote -v           # origin이 GitHub 저장소를 가리키는지
gh repo view --json nameWithOwner,visibility,defaultBranchRef
```

⚠️ **저장소가 PUBLIC이면 커밋된 모든 파일이 공개된다.** 게시 전, 프롬프트 로그·`.env`·내부 메모 등이
추적되고 있지 않은지 확인한다: `git ls-files | grep -iE 'prompt|secret|\.env|handoff'`

---

## 1. 두 가지 게시 방식 — 무엇을 고를까

| 방식 | 설명 | 장점 | 단점 |
|---|---|---|---|
| **A. GitHub Actions(workflow)** ✅권장 | 워크플로가 빌드·업로드한 아티팩트만 게시 | push 자동 배포, **게시 파일 선별 가능**(민감 파일 제외) | 워크플로 파일 필요 |
| B. 브랜치 빌드(legacy) | 지정 브랜치의 폴더를 그대로 서빙 | 설정 단순, 즉시 | **브랜치 루트 전체 노출**, 빌드 단계 없음 |

> 단일 정적 사이트라도 **방식 A를 권장**한다. `_site`에 앱 파일만 담아 올리면
> `Prompt.md` 같은 내부 파일이 repo엔 남아도 공개 사이트(URL)에선 404가 되어 노출을 줄인다.

---

## 2. 게시 절차 (방식 A: Actions 자동 배포)

### 2-1. 루트 진입점 `index.html` 준비
GitHub Pages는 루트 URL에서 `index.html`을 찾는다. 정본 파일명이 다르면(`app.html` 등)
리다이렉트용 `index.html`을 둔다 (정본을 단일 소스로 유지):

```html
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>App</title>
<meta http-equiv="refresh" content="0; url=./ui-kit-playground.html">
<link rel="canonical" href="./ui-kit-playground.html">
</head><body><a href="./ui-kit-playground.html">이동</a></body></html>
```

### 2-2. 배포 워크플로 추가 — `.github/workflows/deploy-pages.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]      # main 푸시 시 자동 배포
  workflow_dispatch:      # 수동 실행도 허용
permissions:              # ← 이 3개가 없으면 deploy 단계가 실패한다
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - name: Stage site files           # 앱 파일만 올린다(내부 파일 제외)
        run: |
          mkdir -p _site
          cp index.html ui-kit-playground.html _site/
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 2-3. 브랜치·기본 브랜치·Pages 소스 정리

```bash
# main 브랜치가 없으면 현재 작업 브랜치에서 생성
git checkout -b main
git add .github/workflows/deploy-pages.yml index.html
git commit -m "ci: GitHub Pages 자동 배포 워크플로 추가"
git push -u origin main

# 기본 브랜치를 main으로 (environment 브랜치 정책 충돌 예방)
gh repo edit --default-branch main

# Pages 소스를 'GitHub Actions'로 전환 (브랜치 빌드였다면 필수)
gh api -X PUT repos/<OWNER>/<REPO>/pages -f build_type=workflow
```

### 2-4. 배포 트리거 & 확인

```bash
# push가 이미 트리거함. 수동 재배포가 필요하면:
gh workflow run deploy-pages.yml --ref main

# 실행 상태
gh run list --workflow=deploy-pages.yml -L 3
gh run watch                              # 진행 중인 run 실시간

# 게시 결과 (CDN 전파에 수 초~1분)
curl -s -o /dev/null -w "%{http_code}\n" https://<OWNER>.github.io/<REPO>/
curl -s https://<OWNER>.github.io/<REPO>/ui-kit-playground.html | grep -o '<title>[^<]*</title>'
```

---

## 3. 배포 워크플로 동작 요약

1. `main`에 push (또는 수동 dispatch) → 워크플로 실행
2. `checkout` → `_site`에 **게시할 앱 파일만** 복사
3. `upload-pages-artifact` → 아티팩트 업로드
4. `deploy-pages` → `github-pages` 환경으로 게시, `page_url` 출력
5. 사이트 갱신 (보통 30초~2분 내 반영)

> **앱에 파일을 추가하면** 워크플로의 `cp` 줄에 그 파일도 더해야 게시된다.

---

## 4. 문제 발생 시 해결방법

### ❶ Pages `status: null` — 배포가 안 됨
- **증상**: `gh api repos/<O>/<R>/pages` 결과 `status: null`. 사이트가 빈 화면/404.
- **원인**: `build_type: workflow`로 설정됐는데 워크플로 파일이 없거나, `source.branch`가
  존재하지 않는 브랜치(예: `main` 미생성)를 가리킴.
- **해결**: ① 워크플로 파일을 해당 브랜치에 추가·푸시, 또는 ② 브랜치 빌드로 임시 전환
  `gh api -X PUT repos/<O>/<R>/pages --input - <<<'{"build_type":"legacy","source":{"branch":"<BRANCH>","path":"/"}}'`

### ❷ 루트 URL이 빈 화면 / 404
- **원인**: 루트에 `index.html`이 없음 (정본 파일명이 다름).
- **해결**: 2-1의 리다이렉트 `index.html` 추가. 직접 접근은
  `https://<O>.github.io/<R>/<정본파일>.html`로도 가능.

### ❸ 내부 파일이 공개 노출됨 (`Prompt.md` 등 200)
- **증상**: `curl …github.io/<R>/Prompt.md` → 200.
- **원인**: 브랜치 빌드(legacy, `path:/`)는 브랜치 루트 전체를 서빙.
- **해결(사이트 차원)**: 방식 A로 전환 + 워크플로에서 `_site`에 앱 파일만 복사.
  전환 후 재검증: `curl -s -o /dev/null -w "%{http_code}" …/Prompt.md` → **404** 기대.
- **해결(repo 차원, 완전 제거)**: 추적 중단 `git rm --cached <파일>` + `.gitignore` 추가.
  과거 커밋 히스토리까지 지우려면 `git filter-repo`로 이력 재작성 후 force-push(영향 큼).

### ❹ `gh`/`git` 복합 명령이 권한 거부됨
- **증상**: `git push && gh api …`처럼 묶은 명령이 막힘.
- **해결**: 상태 변경(push, `gh api -X PUT/POST`) 명령은 **한 줄에 하나씩** 분리 실행한다.

### ❺ 방금 배포했는데 옛 내용 / 일시적 404
- **원인**: GitHub Pages CDN 전파 지연.
- **해결**: 수 초~2분 대기 후 재시도. 폴링 예:
  ```bash
  for i in $(seq 1 6); do
    curl -s -o /dev/null -w "%{http_code}\n" https://<O>.github.io/<R>/
    sleep 5
  done
  ```

### ❻ Actions `deploy` 단계 실패 — 권한/환경
- **원인 A**: 워크플로 `permissions`에 `pages: write` 또는 `id-token: write` 누락.
- **원인 B**: `github-pages` 환경의 deployment branch 정책이 기본 브랜치만 허용 →
  비기본 브랜치에서 배포 시 차단.
- **해결**: permissions 3종 확인. 배포 브랜치를 기본 브랜치로 맞추거나
  (`gh repo edit --default-branch main`), 환경 설정에서 해당 브랜치를 허용.

### ❼ 워크플로 파일 push가 거부됨 (`refusing to allow ... workflow`)
- **원인**: 토큰 scope에 `workflow` 없음.
- **해결**: `gh auth refresh -s workflow` 후 재푸시.

### ❽ 아이콘/폰트 등 외부 CDN 리소스가 안 보임
- **원인**: 페이지가 `unpkg`/Google Fonts 등 CDN에 의존 (오프라인·CDN 장애 시).
- **확인**: 게시본에 스크립트가 포함됐는지
  `curl -s …/ui-kit-playground.html | grep -c 'unpkg.com/lucide'`.
  렌더링 코드는 `if (window.lucide) lucide.createIcons()`처럼 가드 권장.

---

## 5. 검증 체크리스트

```bash
O=<OWNER>; R=<REPO>
gh api repos/$O/$R/pages -q '{build_type:.build_type,status:.status,url:.html_url}'   # 설정·상태
gh run list --workflow=deploy-pages.yml -L 1 --json status,conclusion                  # 최근 배포
curl -s -o /dev/null -w "root %{http_code}\n" https://$O.github.io/$R/                  # 200 기대
curl -s -o /dev/null -w "app  %{http_code}\n" https://$O.github.io/$R/ui-kit-playground.html
curl -s -o /dev/null -w "leak %{http_code}\n" https://$O.github.io/$R/Prompt.md         # 404 기대
```

| 확인 | 기대값 |
|---|---|
| `pages.build_type` | `workflow` |
| 최근 run `conclusion` | `success` |
| 루트 · 앱 파일 | `200` |
| 내부 파일(Prompt.md 등) | `404` |
| 외부 CDN 의존 스크립트 포함 | grep ≥ 1 |
