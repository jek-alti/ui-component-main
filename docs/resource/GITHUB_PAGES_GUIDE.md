# GitHub Pages 개설 & 게시 — 웹 화면 클릭 절차

> 상황: `test` 같은 **저장소만 막 만든 상태**. GitHub 웹 화면에서 버튼을 눌러 Pages를 켜고(개설),
> 페이지(HTML)를 올리는(게시) 전체 절차다. (메뉴 라벨은 화면에 보이는 영문 그대로 적는다.)
> 막히면 → [TROUBLE_SHOOTING.md](./TROUBLE_SHOOTING.md)

흐름: **① 페이지 파일 올리기 → ② Settings에서 Pages 개설 → ③ 주소로 접속 → ④ 이후엔 push만**

---

## ① 올릴 페이지 준비 — `index.html`

GitHub Pages는 맨 위 폴더의 **`index.html`** 을 첫 화면으로 연다. 먼저 저장소에 이 파일이 있어야 한다.

**방법 A. 웹에서 바로 만들기 (git 없이)**
1. 저장소(`test`) 메인 화면에서 **`Add file`** 버튼 ▾ → **`Create new file`** 클릭
2. 파일 이름 칸에 **`index.html`** 입력
3. 내용 칸에 HTML 입력 (예: `<h1>Hello Pages</h1>`)
4. 오른쪽 위 **`Commit changes…`** 버튼 클릭 → 다시 **`Commit changes`** 클릭

**방법 B. 로컬에서 만들어 푸시**
```bash
# index.html 을 만든 뒤
git add index.html
git commit -m "add index.html"
git push origin main
```

> 여러 파일을 한꺼번에 올리려면: 웹에서 **`Add file`** → **`Upload files`** → 파일 끌어다 놓기 → **`Commit changes`**.

---

## ② Pages 개설 — Settings 화면 클릭 순서

1. 저장소 상단 탭에서 **`Settings`** 클릭 (안 보이면 **`⋯`(More)** 안에 있음)
2. 왼쪽 사이드바 **`Code and automation`** 묶음 아래 **`Pages`** 클릭
3. **`Build and deployment`** 영역의 **`Source`** 드롭다운에서 **`Deploy from a branch`** 선택
4. 그 아래 **`Branch`** 드롭다운에서 페이지가 들어 있는 브랜치(보통 **`main`**) 선택
5. 폴더 드롭다운에서 **`/ (root)`** 선택
   - `index.html`이 저장소 맨 위에 있으면 `/(root)`, `docs` 폴더 안에 있으면 `/docs`
6. **`Save`** 버튼 클릭

> `Branch` 드롭다운에 `main`이 보이려면 저장소에 커밋이 **하나라도** 있어야 한다(①을 먼저 한 이유).

---

## ③ 게시 주소 확인 & 접속

- **Save** 후 1~2분 기다렸다 **`Pages`** 화면을 새로고침하면 위쪽에 배너가 뜬다:
  **“Your site is live at `https://<사용자명>.github.io/test/`”** + **`Visit site`** 버튼
- 그 주소가 게시된 사이트다. **`Visit site`** 를 누르거나 주소창에 직접 입력해 접속한다.
  - 프로젝트 페이지: `https://<사용자명>.github.io/test/`
  - 특정 파일 직접: `https://<사용자명>.github.io/test/about.html`

> 처음 게시는 반영까지 길게는 몇 분 걸릴 수 있다. 404가 떠도 잠시 후 다시 시도.

---

## ④ 이후 페이지 올리기 / 수정 = push 만

한 번 개설(②)해두면, 그 브랜치(`main`)에 **파일을 push할 때마다 자동으로 사이트에 반영**된다.
Settings를 다시 만질 필요 없다.

```bash
# 페이지 추가/수정 후
git add .
git commit -m "update pages"
git push origin main      # ← push 하면 사이트가 자동 갱신 (30초~2분)
```

- 새 페이지 `about.html`을 push → `https://<사용자명>.github.io/test/about.html` 로 접속.
- 웹에서 수정해도 동일(파일 편집 → `Commit changes` = 커밋/푸시 효과).

---

## (대안) “GitHub Actions” 방식

②-3의 **`Source`** 드롭다운에서 **`Deploy from a branch`** 대신 **`GitHub Actions`** 를 고르면,
워크플로(빌드 스크립트)로 배포한다. React·Vue처럼 **빌드가 필요한** 사이트에 쓴다.
순수 HTML/CSS/JS만 올릴 거면 위의 **`Deploy from a branch`** 가 가장 간단하다.
