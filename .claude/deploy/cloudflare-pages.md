# Cloudflare Pages 배포 가이드 — r.maria

자동 검증(`rmaria-qa-auditor`)이 v5 빌드를 통과했습니다. 이제 사용자가 직접 처리할 단계만 남았습니다.

## 0. 사전 점검

| 항목 | 상태 | 조치 |
|---|---|---|
| 빌드 | ✓ 통과 (22 KB JS / 10 KB CSS gzipped 7 KB / 2.5 KB) | — |
| `dist/` 산출물 | ✓ index.html · robots.txt · sitemap.xml · _headers · favicon.svg · og-cover.jpg · site.webmanifest | — |
| `functions/api/inquire.js` | ✓ Cloudflare Pages Function 준비됨 | — |
| **git 저장소** | ✗ **`main_portfolio/`가 git repo가 아님** | 아래 1단계에서 초기화 |
| `r.maria/src/` 원본 | 117 MB, `.gitignore`에 없음 → 커밋 가능 | 아래 1단계에서 커밋 |
| `public/works/` 최적화본 | 19 MB, `.gitignore`에 있음 (생성물) | CI에서 `npm run images`로 재생성 |

---

## 1. Git 저장소 초기화 + GitHub 푸시

`main_portfolio`에서:

```bash
git init
git branch -M main
git add .
git commit -m "feat: r.maria gallery v5 — ready for Cloudflare Pages"
```

GitHub에 새 repo 생성 (private 권장 — 원본 사진 117 MB 포함이라 public이면 노출 신경 쓸 점 있음):

1. https://github.com/new
2. Repo 이름: 예 `rmaria-gallery` (Cloudflare 프로젝트명과 별개)
3. Visibility: Private 권장
4. README/license 추가 안 함 (이미 로컬에 있으므로)

GitHub에 푸시:

```bash
git remote add origin https://github.com/{사용자명}/{repo}.git
git push -u origin main
```

**참고**: `r.maria/src/`의 31장 원본(117 MB) 때문에 첫 푸시가 느릴 수 있음. Git LFS 없이도 정상 동작하지만 GitHub의 single-file 100 MB 제한은 안 넘는지 (개별 jpg 최대 ~6 MB이므로 안전).

---

## 2. Cloudflare Pages 프로젝트 생성

1. https://dash.cloudflare.com → 좌측 메뉴 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. GitHub 계정 연결 (처음이면 OAuth 권한 부여)
3. Repo 선택: `{사용자명}/rmaria-gallery`
4. **Set up builds and deployments** 화면에서:

| 항목 | 값 |
|---|---|
| Project name | `rmaria` (결과 URL: `https://rmaria.pages.dev`) |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build:full` |
| Build output directory | `dist` |
| Root directory (advanced) | 비워둠 (또는 모노레포 경우 `main_portfolio`) |

5. **Environment variables** (`Add variable` 클릭, 두 개 추가):

| 키 | 값 | 비고 |
|---|---|---|
| `NODE_VERSION` | `22` | sharp 호환성 |
| `INQUIRY_EMAIL` | `사용자의-실제-이메일@example.com` | 인콰이어리 수신 주소 |

6. **Save and Deploy** 클릭. 첫 빌드 ~2분 소요.

---

## 3. 첫 배포 검증

빌드 성공 시 `https://rmaria.pages.dev` URL이 발급됩니다. 다음을 확인:

- [ ] 페이지 로드 시 8개 시리즈 가로 캐러셀 표시
- [ ] 휠로 캐러셀 가로 스크롤 동작 (작품 수 많은 시리즈)
- [ ] 작품 클릭 → 라이트박스 풀스크린, ← → 키 동작
- [ ] 라이트박스 하단 "INQUIRE ABOUT THIS WORK" 링크 보임
- [ ] 링크 클릭 → `#/inquire?work=…` 페이지, "Work of interest"가 미리 선택됨
- [ ] `https://rmaria.pages.dev/robots.txt` 접근 가능
- [ ] `https://rmaria.pages.dev/sitemap.xml` 33개 URL
- [ ] `https://rmaria.pages.dev/favicon.svg` 접근 가능
- [ ] OG 카드 미리보기: https://www.opengraph.xyz/url/https%3A%2F%2Frmaria.pages.dev

---

## 4. 인콰이어리 폼 동작 확인 (선택)

폼이 실제로 이메일을 보내는지 시험:

1. `https://rmaria.pages.dev/#/inquire`에서 본인 이메일 + 테스트 메시지로 제출
2. 약 5초 이내 `INQUIRY_EMAIL` 받은편지함 도착 확인

### ⚠ MailChannels 발신 도메인 이슈

MailChannels는 2024년 중반부터 무료 정책을 종료했고, 발신 도메인(`From: noreply@rmaria.pages.dev`) DNS에 SPF·DKIM 인증이 필요합니다.

- **`.pages.dev` 도메인은 DNS를 제어할 수 없음** → 첫 발송이 5xx로 실패할 가능성이 큼
- 해결: 커스텀 도메인 연결 후 SPF·_mailchannels TXT 레코드 등록
- 대안: Resend (https://resend.com), Web3Forms, Formspree 등의 무료 API로 교체. 교체 시 `functions/api/inquire.js`의 MailChannels POST 부분만 변경

첫 발송 실패 시 `rmaria-commerce-engineer`를 호출해 Resend 등으로 교체하면 됩니다.

---

## 5. 커스텀 도메인 연결 (선택, 추후)

도메인 취득 후:

1. Cloudflare Pages 대시보드 → 프로젝트 → **Custom domains** → **Set up a custom domain**
2. 도메인 입력 (예: `rmaria.kr`)
3. Cloudflare가 안내하는 CNAME 또는 A/AAAA 레코드를 도메인 DNS에 추가
4. HTTPS 자동 발급 (수 분 ~ 수 시간)
5. 연결 후 `index.html`의 `canonical`, `og:url`, `sitemap.xml`을 새 도메인으로 업데이트 (`rmaria-deployment-engineer`에 위임)

---

## 6. og-cover.jpg 교체 (선택)

현재 `public/og-cover.jpg`는 `starry-night-3` 썸네일(800×?, 95 KB)의 placeholder입니다. 1200×630 정식 소셜 카드로 교체 권장:

- Figma / 포토샵에서 1200×630 캔버스 생성
- 작품 사진 + "r.maria" 텍스트 합성 (B&W 톤 유지)
- JPG 또는 WebP, 200 KB 이하
- `public/og-cover.jpg`에 덮어쓰기 후 커밋·푸시 → 자동 재배포

---

## 7. Phase 2 (결제 연동) 진입 조건

다음 3가지가 모두 갖춰지면 `rmaria-commerce-engineer`에 Phase 2 시작 지시:

1. 사업자 등록 완료
2. 통신판매업 신고 완료
3. 커스텀 도메인 연결 + 위 5단계 완료

Phase 2 첫 단계는 PortOne vs Stripe Checkout 비교 정책 문서 작성 → 사용자 승인 → 가격 데이터 스키마 → 결제 흐름 구현입니다.

---

## 요약 — 사용자가 지금 할 일

1. `git init` + GitHub repo 생성 + `git push`
2. Cloudflare Pages 대시보드에서 repo 연결
3. Build command `npm run build:full`, Output `dist`
4. 환경 변수 2개 설정: `NODE_VERSION=22`, `INQUIRY_EMAIL=...`
5. 배포 후 인콰이어리 폼 시험 (실패 시 MailChannels 교체)

문의·이슈 있을 때마다 `rmaria-deployment-engineer` 또는 `rmaria-commerce-engineer` 에이전트 호출.
