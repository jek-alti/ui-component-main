# Claude Code 프롬프트 모음

- 프로젝트: `/Users/codevillain/Claude-Code-Expert/ui-component`
- 범위: cwd 전체 합본
- 추출 시각: 2026-06-19 18:27:01

---

## 클로드 데스크탑 최초 프롬프트 (html 프로토타입 생성용)
https://careerfoundry.com/en/blog/ui-design/ui-element-glossary/

32가지 프론트엔드 UI 엘리먼트 사전집 사이트입니다.
해당 요소를 각각 UI로 표현해서 미리보기와 함께 소스를 확인하는 프론트엔드 포트폴리오 및 데모 사이트를 구축해야 합니다. 
다음의 사항을 기준으로 html 데모 사이트를 만들어주세요

좌측은 32가지 요소 리스트업 메뉴
우측은 좌측메뉴 클릭시 보여지는 메인 컨텐츠로 해당 클릭한 element 의 미리보기를 제공해야 하며, 탭으로 html, css, javascript 소스들을 각각 확인할 수 있어야 함
Anti ai slop 기법을 적용하여 디자인, 폰트, 아이콘 등의 요소에 AI 전형 디자인이나 컬러를 제외
사이트 배경 컬러는 밝은 배경 색으로 하며 폰트는 블랙 계열로 화면에 선명하게 보여야 합니다.

---

### 1. 2026-06-18

https://careerfoundry.com/en/blog/ui-design/ui-element-glossary/ 를 기반으로 32가지 UI 컴포넌트와 컴포넌트의 미리보기, HTML, CSS, Javascript(있을경우) 코드 영역에 해당 코드들이 로드되어야 하고, 코드 하일라이트 기본적인 기능들이 적용되어야 해. 각 소스마다 복사하기 버튼을 통해 해당 요소를 복사해서 내 사이트에 붙여넣기 하는 컴포넌트 페이지를 만드는거야.

촤측에는 UI  요소 리스트와 UX에 필요한 기본적인 공통 모달(경고, 확인, 알림, 토스트, 스낵바, 바텀 시트 등 사이트에 꼭 필요한 알림등 레이어 처리 관련 컴포넌트)들을 포함해서 해당 리스트를 누르면 우측 메인 컨텐츠 영역에 클릭한 컴포넌트 명 - 정의와 설명이 나오고 하단에는 미리보기 html, css, js 탭들이 나와서 각각의 기능을 수항하면 돼 

참고해야 할 리소스는 @docs/resource/component-portfolio.html 구조를 비롯해서 @docs/resource/ui-component.html  @docs/resource/ui-components-32-catalog.html  이고 @docs/resource/label-chip-system.html @docs/resource/alert-ui-showcase.html 이고 @docs/resource/ 에 참고할 자료들들을 업로드 해놨어. 

이를 바탕으로 /init 을 실행해서 기본적인 CLAUDE.md를 비롯한 초기화 작업 진행하고 CLAUDE.md는 한글로 작성해

### 2. 2026-06-18

handoff 스킬을 만들거야. 

# handoff — 세션 인계

세션을 넘길 때 아래를 한 파일(`.handoff.md` 또는 STATE)에 적는다.

- ✅ **무엇이 됐나** (검증된 증거와 함께)
- ❌ **무엇을 시도했고 실패했나** (반복 방지)
- ⏳ **다음 할 일 + 아직 안 한 것**

체크리스트 형태로 만들어줘

### 3. 2026-06-18

핸드오프 스킬 검증해봐

### 4. 2026-06-19

분석한 결과를 바탕으로 @CLAUDE.md 를 다시 참조해서 ui-kit-playground.html 파일을 프로젝트 루트에 생성해줘

### 5. 2026-06-19

결과를 확인해보니 두가지 문제가 있어. 
- 좌측 메뉴 선택시 테두리의 컬러 및 라디우스 효과, 색씌우기 금지 
- <button class="accordion-header">결제는 어떻게 하나요?</button> 아코디언 메뉴 화면의 경우 너비가 클릭 전, 클릭 후 사이즈가 다른데 사이즈가 일정하도록 보정을 해야 하고 아코디언 바와 같은 동작이 없이 클릭 후 펼침, 접힘 기능만 되고 있으니 아코디언 바 처럼 수정해야함

### 6. 2026-06-19

@ui-kit-playground.html 에 나오는 모든 이모지, 아이콘이나 뱃지는 lucide.dev 를  참고해서 아이콘으로 룩앤필을 통일해줘

### 7. 2026-06-19

github pages에 현재 개발된 버전을 게시해줘

### 8. 2026-06-19

main 브랜치에 푸시하면 자동으로 github pages에 자동으로 배포되도록 해줘

### 9. 2026-06-19

핸드오프를 다른 프로젝트에서 쓸수있도록 HANDOFF_TEMPLATE.md와 github pages 게시 절차 및 배포 워크플로우, 문제 발생시 해결방법을 정리한 TROUBLE_SHOOTING.md 를 만들어줘

### 10. 2026-06-19

@extract-my-prompts.sh 로 프롬프트 내역 @Prompt.md  에 추가해줘


### 11. 2026-06-19
 현재 프로젝트를 한장으로 export 하는 스크립트를 만들어서 외부 프로젝트에서도 사용할 수 있도록 해주고, js, css, html 이 하나의 경로에 있어서
  참조시 깨지지 않도록 해. 그대로 복사해서 프로젝트에 넣은뒤 사용할거야. ultrathink

