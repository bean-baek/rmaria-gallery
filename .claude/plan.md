# r.maria — 블랙앤화이트 갤러리 미니멀리즘 사이트

## Context

작가 **r.maria**의 사진 31장(사막·별·해풍·선인장·아바야 등 한글 제목)을 전시하는 정적 웹사이트를 새로 구축한다.

- **톤**: 심플 & 모던 브루탈리즘 → "갤러리 미니멀리즘"으로 조정. 강한 시스템 폰트와 그리드 무시 같은 거친 브루탈리즘이 아니라, 직각·하드 룰·블랙앤화이트만의 절제된 갤러리 벽 느낌. 작품이 주인공.
- **현재 상태**: `포폴/main_portfolio/` 루트는 비어 있고, `r.maria/src/` 하위에 풀해상도 JPG 31장(840KB~6MB, 총 ~120MB)이 존재. 메타데이터·README 없음.
- **결과물**: Vite + 바닐라 ESM 정적 사이트. 그리드 인덱스 + 작품 상세(prev/next). About 페이지는 v1에서 제외.

## 사용자 확정 결정사항

| 항목 | 결정 |
|---|---|
| 위치 | `c:\Users\suhyu\OneDrive\바탕 화면\포폴\main_portfolio\` 루트 |
| 스택 | Vite + 바닐라 JS/HTML/CSS, `sharp`로 이미지 사전 처리 |
| 스타일 톤 | 갤러리 미니멀리즘 (B&W, 하드 룰, 그림자/모서리 둥글림 없음) |
| 라우팅 | 해시 기반 SPA (`#/`, `#/work/:slug`) |
| 작품 제목 | **한글 + 영문 병기** (한글 메인, 영문 보조) |
| About 페이지 | **v1에서 제외**. 인덱스 그리드 + 작품 상세만 |
| 전시 타이틀/소개문 | 임시 텍스트(placeholder)로 마크업 자리 잡고 나중에 교체 |
| 이미지 커밋 | **`public/works/`는 .gitignore**. 빌드/로컬에서 `npm run images` 재생성 |
| 이미지 포맷 | 최적화된 JPG만 (WebP는 v2 이후) |

## 폴더 구조 (`main_portfolio/`)

```
main_portfolio/
├── package.json
├── vite.config.js          # base: './' (정적 호스팅 호환)
├── .gitignore              # node_modules/, dist/, public/works/
├── index.html              # <div id="app"> 마운트
├── public/
│   └── works/              # .gitignore (스크립트로 생성)
│       ├── thumb/          # ≤800px, q78 mozjpeg
│       └── full/           # ≤2000px, q84 mozjpeg
├── scripts/
│   └── optimize-images.mjs # sharp 파이프라인
├── src/
│   ├── main.js             # 부트스트랩 + 라우터 와이어링
│   ├── style.css           # 모든 토큰 + 레이아웃
│   ├── works.js            # 31개 메타데이터 단일 소스 (런타임 + 이미지 스크립트 공유)
│   ├── router.js           # ~30줄 해시 라우터
│   └── views/
│       ├── index-view.js   # 그리드 렌더러
│       └── work-view.js    # 상세 렌더러
└── r.maria/src/*.jpg       # 원본 — 손대지 않음
```

## 핵심 파일

| 경로 | 역할 |
|---|---|
| `main_portfolio/src/works.js` | 31개 작품 메타데이터의 단일 소스. 런타임 그리드/상세와 이미지 최적화 스크립트가 모두 참조. |
| `main_portfolio/scripts/optimize-images.mjs` | `works.js`의 `source`(한글 원본 파일명)를 읽어 `image`(ASCII 슬러그)로 thumb/full을 생성. Idempotent. |
| `main_portfolio/src/main.js` | 라우터 와이어업, 초기 렌더, `hashchange` 리스너. |
| `main_portfolio/src/style.css` | 모든 디자인 토큰. 미학이 여기서 결정됨. |
| `main_portfolio/index.html` | 마스트헤드 + `#app` 셸. 폰트 링크(Noto Serif KR 등). |

## 작품 메타데이터 (`src/works.js`)

```js
export const works = [
  {
    slug: 'lemon-tree-riyadh',     // URL-safe ASCII
    image: 'lemon-tree-riyadh',    // 출력 파일명 (thumb/full에서 공유)
    title: '레몬트리',              // 한글 메인
    titleEn: 'Lemon Tree',         // 영문 병기 (캡션 보조)
    year: null,                    // 추후 입력
    location: 'Saudi Riyadh',
    series: 'desert',              // starry-night | sea-wind | cactus | abaya | mugwort | desert | place | emotive
    source: '1.레몬트리(Saudi Riyadh).jpg', // r.maria/src/ 내 원본 파일명 (스크립트가 사용)
  },
  // … 30개 더 (해풍 1~7, 별 헤는 밤 1~5, 선인장 1~3, 아바야 1~2, 카타르/두바이 쑥, 그리움/낯선/익숙한/하울링, DESERT 1·2, 멜버른/몽고메리 등)
];
```

영문 제목(`titleEn`)은 시리즈명 매핑표를 기준으로 일관되게 부여: `별 헤는 밤 N → Counting Stars N`, `해풍 N → Sea Wind N`, `선인장 N → Cactus N`, `아바야 N → Abaya N`, `그리움 → Longing`, `낯선… → Unfamiliar`, `익숙한… → Familiar`, `하울링 → Howling`, `레몬트리 → Lemon Tree`, `기다림(사막의 봄) → Waiting (Spring in the Desert)`, `카타르/두바이 쑥 → Qatar/Dubai Mugwort`, `멜버른 벡 비치 → Melbourne Bay Beach`, `몽고메리골프클럽 → Montgomery Golf Club`.

## 디자인 토큰 (`src/style.css`)

```css
:root {
  --bg: #ffffff;
  --ink: #000000;
  --rule: #000000;        /* 1px 하드 룰 */
  --mute: #8a8a8a;        /* 메타·카운터 전용 */

  --font-display: "EB Garamond", "Noto Serif KR", Georgia, "Apple SD Gothic Neo", serif;
  --font-mono:    ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;

  --fs-xs: 11px;  --fs-sm: 14px;  --fs-base: 16px;
  --fs-lg: 22px;  --fs-xl: 36px;  --fs-xxl: 56px;

  --space-1: 4px;  --space-2: 8px;   --space-3: 16px;  --space-4: 24px;
  --space-5: 32px; --space-6: 48px;  --space-7: 80px;  --space-8: 120px;
}
```

**불변 규칙**: `border-radius` 0, `box-shadow` 없음, 그라데이션 없음. 유일한 색상은 순수 흑백 + `--mute`(연도/카운터 전용). 호버 시 배경 반전 금지 — 텍스트 언더라인(`text-underline-offset: 4px`)만. 컨테이너 외곽 패딩 `clamp(24px, 5vw, 80px)`.

## 페이지 마크업

### 인덱스 (`#/`)
- 마스트헤드: `r.maria` / 전시명(placeholder) / `31 works · B&W` / (About 링크 없음)
- 그리드: CSS Grid, 모바일 1col → 640px 2col → 1024px 3col, 행 갭 `--space-6`, 열 갭 `--space-5`
- 셀: 원본 종횡비 보존(`aspect-ratio`로 cropping 금지). 이미지 아래 한글 제목 + 영문 부제 + `위치 · NN / 31` mono 캡션
- 이미지: `loading="lazy"`, `load` 이벤트에 `.is-loaded` 클래스로 opacity 0→1, 400ms

### 작품 상세 (`#/work/:slug`)
- 헤더: `← Index` / 우측 `NN / 31` 카운터
- 본문: 풀 이미지(max-width ~1100px, 중앙) → 캡션 블록(한글 타이틀, 영문 부제, `dl`로 Series/Location/Year)
- 하단 prev/next: `← 이전 작품명` / `다음 작품명 →` (마지막→첫번째 순환)
- 키보드: `← / →` 이동, `Esc / Backspace` 인덱스 복귀
- `<link rel="prefetch">`로 다음 작품 풀이미지 선행 로드

## 이미지 처리 (`scripts/optimize-images.mjs`)

```js
// 의사 코드
import sharp from 'sharp';
import { works } from '../src/works.js';

for (const w of works) {
  const src = `r.maria/src/${w.source}`;
  await sharp(src).resize({ width: 800,  withoutEnlargement: true })
                  .jpeg({ quality: 78, mozjpeg: true })
                  .toFile(`public/works/thumb/${w.image}.jpg`);
  await sharp(src).resize({ width: 2000, withoutEnlargement: true })
                  .jpeg({ quality: 84, mozjpeg: true })
                  .toFile(`public/works/full/${w.image}.jpg`);
}
```

- Idempotent: 출력이 소스보다 새로우면 스킵
- 결과: thumb ≈ 150KB, full ≈ 500KB → 총 ~16MB
- `npm run images`로 수동 실행. `public/works/`는 `.gitignore`

## 라우터 (`src/router.js`)

- `hashchange` + 초기 로드 리스너 단일 진입점
- `parseRoute(hash) → { name: 'index' | 'work', params: { slug? } }`
- 각 뷰 모듈은 `render(container, params)` 노출, `#app` 내부를 갈아끼움
- 라우트 변경 시 `scrollTo(0,0)`, 인덱스→상세 진입 직전에 `lastIndexScroll = scrollY`, 인덱스 복귀 시 복원
- 키보드 핸들러는 뷰 진입에서 바인드, 이탈에서 언바인드 (메모리 누수 방지)

## 구현 순서 (검증 가능한 단위로 분할)

1. **스캐폴딩** — `package.json`(`vite`, `sharp` devDep), `vite.config.js`(`base: './'`), `.gitignore`, 빈 `index.html`/`main.js`/`style.css`. `npm run dev`로 빈 페이지 확인.
2. **`src/works.js` 작성** — 31개 엔트리 모두. 슬러그·`source`(원본 파일명 정확히)·시리즈 태그·영문 제목 매핑 적용.
3. **`scripts/optimize-images.mjs` 작성 + `npm run images`** — `public/works/thumb/`·`full/`에 62개 파일 생성 확인, 총 용량 ~16MB 확인.
4. **디자인 토큰 + 마스트헤드** — `:root` 변수, body 기본, 타이포, `.mono` 클래스. `index.html`에 임시 마스트헤드 마크업 작성. 한글/영문 폰트 폴백 확인.
5. **인덱스 그리드 뷰** — `src/views/index-view.js`. 31개 카드 렌더, `loading="lazy"`, `load`→fade-in. 640/1024 브레이크포인트 검증.
6. **해시 라우터** — `src/router.js` + `main.js` 와이어업. 카드 클릭→URL 변경→상세 뷰 컨테이너 갈아끼움. 뒤로가기 동작 확인.
7. **작품 상세 뷰** — `src/views/work-view.js`. 풀 이미지, 한글+영문 캡션, 메타(`dl`), prev/next 순환, 카운터, prefetch.
8. **키보드 내비게이션 + 스크롤 복원** — ←/→/Esc, `lastIndexScroll` 저장·복원. 뷰 전이 시 바인드/언바인드.
9. **프로덕션 빌드 검증** — `npm run build` → `dist/` 생성. `npm run preview`에서 31개 썸네일 + 무작위 상세 3개 콘솔 에러 없이 동작. Lighthouse Performance ≥ 90.

## 검증 (Verification)

**개발 서버 (5단계 이후)**
- `npm run dev` 에러 없이 시작
- 인덱스에서 31개 썸네일 모두 표시. 네트워크 탭: 썸네일 ≤200KB, 풀해상도 미요청
- 한글 글리프 깨짐 없음 (Noto Serif KR 또는 시스템 한글 폰트 폴백 확인)
- DevTools 디바이스 툴바로 1/2/3열 전환 확인

**라우팅 (6–7단계 이후)**
- `localhost:5173/#/work/abaya` 직접 진입 시 상세 뷰 렌더 (404 없음)
- 브라우저 뒤로/앞으로 정상 동작
- 카운터(`07 / 31`)가 배열 인덱스와 정확히 일치
- prev/next 순환(첫 작품의 prev = 31번째, 마지막의 next = 1번째)
- 인덱스 복귀 시 이전 스크롤 위치 복원

**키보드 (8단계 이후)**
- 상세 뷰에서 → 다음, ← 이전, Esc 인덱스 복귀
- 인덱스 뷰에서 화살표는 일반 스크롤 (캡처 안 됨)

**모바일**
- iPhone SE 폭(375px)에서 단일 열, 가로 스크롤 없음, 캡션 오버플로우 없음
- 탭 타깃 ≥ 44px

**프로덕션 빌드 (9단계)**
- `npm run build` 종료 코드 0
- `npm run preview` 정상 동작
- `dist/index.html`을 `file://`로 직접 열어도 동작 (해시 라우팅 + `base: './'`)
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95

**미학 (주관 검증)**
- 페이지가 웹사이트보다 갤러리 벽처럼 느껴짐. 흰색이 압도, 검정 잉크는 텍스트와 이미지에만
- DevTools에서 `border-radius`·`box-shadow` 0건
- 컴파일된 CSS grep `shadow` → 결과 0
- 썸네일 호버 시 움직임 없음, 제목만 언더라인

## 추후 확장 여지 (v2+)

- About 페이지 추가 (작가 소개문 확정 후)
- WebP 출력 + `<picture>` 듀얼 포맷
- 시리즈 필터(`?series=sea-wind`) 토글
- GitHub Pages 자동 배포 워크플로 (이미지 재생성 포함)
