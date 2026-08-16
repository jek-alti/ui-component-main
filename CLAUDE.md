# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 이 저장소의 작업 지침은 한글로 작성한다. 코드 식별자·기술 용어는 원문 그대로 둔다.

## 프로젝트 개요

CareerFoundry의 [32 UI Elements 글로서리](https://careerfoundry.com/en/blog/ui-design/ui-element-glossary/)를 기반으로 한 **프런트엔드 UI 컴포넌트 레퍼런스 / 플레이그라운드**다. 최종 산출물은 의존성 없이 브라우저에서 바로 열리는 **단일 self-contained HTML 페이지**다.

목표 UX(요구 사항):

- **좌측**: UI 요소 리스트 + UX 공통 오버레이 컴포넌트(모달·확인·경고·알림·토스트·스낵바·바텀 시트 등 레이어 처리 요소)
- **우측 메인**: 좌측에서 클릭한 항목의 **이름 + 정의/설명**, 그 아래 **Preview / HTML / CSS / JS** 탭
- 각 코드 영역에 **구문 하이라이트**와 **복사 버튼**(붙여넣어 바로 동작하는 코드)

정본 빌드 타깃 파일명은 `ui-kit-playground.html`이다(저장소 루트에 생성). `docs/resource/`의 파일들은 빌드 결과가 아니라 **참고용 레퍼런스**다.

## 실행 / 미리보기

빌드·번들·패키지 매니저가 **없다**(`package.json`·`node_modules`·테스트·린트 없음). 순수 HTML/CSS/vanilla JS다.

```bash
# 정적 서버로 미리보기 (clipboard API 등은 file:// 보다 http:// 에서 안정적)
python3 -m http.server 8000
# → http://localhost:8000/ui-kit-playground.html

# 또는 단일 파일을 바로 브라우저로 열기
open docs/resource/ui-components-32-catalog.html
```

## 아키텍처 — 핵심 데이터 모델

정본 참고 구조는 [docs/resource/ui-components-32-catalog.html](docs/resource/ui-components-32-catalog.html)다. 모든 컴포넌트를 **하나의 데이터 배열**로 정의하고 JS가 카드/패널로 렌더링하는 data-driven 방식이며, 새 빌드도 이 모델을 따른다:

```js
const components = [
  { id, num, name, nameKo, cat,   // cat: 'input' | 'nav' | 'info' | 'container'
    desc,      // 정의·설명 (우측 메인 상단)
    usecase,   // 사용 사례
    feature,   // 핵심 기능 요약
    html, css, js },             // 탭에 그대로 들어가는 소스 문자열
];
```

설계 원칙:

- **CSS는 self-contained 시맨틱 클래스**(`.accordion`, `.btn`, `.modal-box` …)로 작성한다. 학습자가 탭의 코드를 복사해 다른 페이지에 붙이면 그대로 동작하는 이식성이 목적이다. Tailwind 유틸리티 클래스 의존(아래 `ui-component.html` 방식)은 **지양**한다 — 복사·이식성이 떨어진다.
- 탭 전환은 패널의 `display` 토글, 복사 버튼은 해당 컴포넌트의 소스 문자열을 `navigator.clipboard.writeText()`로 복사하고 "복사됨" 상태를 잠깐 표시한다.
- 카테고리 분류 4종: **Input Controls / Navigational / Informational / Containers**.

레이아웃 패러다임은 두 가지 레퍼런스가 다른데, **요구되는 형태는 사이드바 + 단일 메인 영역**(좌측 리스트 클릭 → 우측 메인 재렌더)이다. 즉 **카탈로그의 깔끔한 데이터 모델 + 사이드바 레이아웃**을 결합한다.

## 32개 컴포넌트 + 공통 오버레이 범위

`docs/resource/ui-components-32-catalog.html`에 32종이 카테고리와 함께 모두 정의돼 있다(Accordion·Button·Card·Modal·Dropdown·Toggle … cat: input/nav/info/container). 좌측 리스트에는 이 32종에 더해 `alert-ui-showcase.html`의 **오버레이/알림 패턴**(Toast/Snackbar·Top Banner·Inline Alert·Slide-over·Popover·Full-screen Takeover·Command Bar·Notification List 등)을 공통 컴포넌트로 추가한다.

## 리소스 파일별 역할 (`docs/resource/`)

| 파일 | 무엇을 취할지 |
|---|---|
| `ui-components-32-catalog.html` | **정본 데이터 모델·코드·분류.** 32종 정의와 self-contained CSS의 출처. |
| `ui-component.html` | 사이드바+메인 레이아웃 아이디어. 단 **Tailwind CDN + Lucide 아이콘 + `script:()=>{}` 패턴**이라 코드 이식성은 떨어짐 — 구조만 참고. |
| `alert-ui-showcase.html` | 오버레이/알림 **동작 패턴**의 출처(`demos` 객체: render/fire/code). ⚠️ 시각 스타일은 그라데이션·글로우·backdrop-blur를 써서 아래 디자인 규칙을 **위반**하므로 비주얼은 베끼지 말 것. |
| `label-chip-system.html` | 라벨/칩 시스템 — 17색 팔레트, 크기·상태, 우선순위 배지/Select, COLOR.json 토큰. |
| `colorpicker.html`, `color-personal-card.html`, `ui-elements-demo.html` | 보조 데모. |
| `component-portfolio.html` | **요구 사양에 가장 근접한 정본 prototype.** 32종 데이터 모델(`ELEMENTS =
  [{n,name,ko,cat,desc,html,css,js},…]`)을 카테고리 그룹 사이드바 + 우측 메인(이름·한글명·뱃지·설명 +
  Preview/HTML/CSS/JS 탭)으로 렌더한다. 미리보기는 iframe `srcdoc`으로 컴포넌트 CSS를 페이지와 격리하고, 복사
  버튼은 `navigator.clipboard.writeText()` + "복사됨 ✓" 토스트로 동작한다. 폰트는 Noto Sans KR(본문) /
  JetBrains Mono(코드), 무채색 + `#2563EB` 단일 액센트로 anti-ai-slop 규칙을 준수한다.

  **`ui-kit-playground.html` 빌드는 이 파일의 구조·코드를 시작점으로 삼고, 좌측 리스트에 오버레이/알림 패턴만
  추가한다.** |



## 강제 디자인 규칙 — anti-ai-slop

[.claude/rules/anti-ai-slop.md](.claude/rules/anti-ai-slop.md)는 이 저장소의 모든 이미지·HTML·SVG·슬라이드 생성에 적용되는 **강제 규칙**이며 기본 동작을 override한다. 요지:

- **금지**: 그라데이션 일체, 색 들어간 그림자·글로우·`blur≥20px`, backdrop-filter 글래스모피즘, hover/load 시 transform·fade·키프레임 장식 모션, 배경 워터마크/그리드/광선, 카드 상단 컬러 액센트 바, 이모지 불릿, 마케팅 상투어.
- **강제**: 무채색 베이스 + 액센트 1색(색은 의미에만), 그림자는 중성 회색 1단계(`0 1px 2px rgba(0,0,0,.06)`)만, 구획은 `1px solid border`+여백으로, `border-radius` 0~8px, 위계는 크기·굵기·여백·정렬로, 폰트는 기본값(Inter/Roboto/Arial/system) 수렴 금지하고 목적에 맞게 의도적으로 고르고 이유를 한 줄 밝힘.

**주의**: `alert-ui-showcase.html`과 카탈로그 일부(헤더 숫자·카드 이미지의 `linear-gradient`)는 이 규칙 이전 자료라 위반 요소가 있다. 동작·구조는 참고하되 **비주얼은 규칙에 맞게 다시 작성**한다. 출력 전 `anti-ai-slop.md`의 자가 점검 체크리스트(그라데이션/컬러 그림자/장식 모션/배경 장식 등)를 통과시킨다.

## 프롬프트 기록 훅

`.claude/settings.local.json`에 **Stop 훅**이 걸려 있어, 세션 종료 시 `extract-my-prompts.sh`가 이 폴더의 Claude Code 세션에서 사용자가 입력한 프롬프트만 뽑아 [Prompt.md](Prompt.md)에 append한다. `settings.local.json`은 개인/머신 전용이라 `.gitignore` 처리돼 있다(커밋되지 않음).
