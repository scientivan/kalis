## Preview aplikasi

Draf aplikasi terbaru tersedia di [app/index.html](app/index.html). Buka langsung di browser untuk meninjau Workspace, Marketplace, Community, Activity, Balance dan dropdown akun. Petunjuk serta batas implementasi ada di [app/README.md](app/README.md). Landing page tetap tersedia di kalis-hero.html.

## Revisi aktif 53.8

Three.js lokal aktif melalui kalis-cycle-3d.js dengan SVG fallback. Caption kalis-caption memakai normal flow untuk menghindari konflik CSS lama. Kontrol dan caption berada di bidang solid. Rendering WebGL belum diverifikasi. WCAG reference https://www.w3.org/WAI/WCAG22/quickref/ .

## Revisi aktif 53.7

Hero kini berisi enam ilustrasi objek vektor dengan satu kalimat per tahap. Navigasi kartu terpisah dihapus. Kontrol ada di hero, autoplay tujuh detik, navigasi manual menjeda, reduced motion manual. SVG berada dalam HTML, CSS dan JavaScript ada di kalis-story.css dan kalis-story.js. Render browser belum diverifikasi. Catatan di bawah mendokumentasikan versi sebelumnya bila berbeda.

# Kalis hero preview

Open `kalis-hero.html` directly in a browser. It needs no server, installation or API credentials. Refresh the file after an edit.

## Active implementation

The hero uses six concrete product-story panels in `kalis-story.css` and `kalis-story.js`. Stages show publication, purchase, private execution, a buyer result, payment/fund flow and an accepted improvement. Choose any stage, use previous/next, or play the sequence. Playback is opt-in and stops when the page is hidden. Reduced motion uses manual navigation.

The reviewed supporting sections use `kalis-sections.css` and `kalis-sections.js`. The shared base stylesheet is `kalis-hero.css`.

## Background

The original generated landscape is `assets/kalis-landscape-v1.webp`. Its exact prompt and provenance are in `assets/kalis-landscape-v1.prompt.md`. It was created with the built-in imagegen tool, converted with cwebp and visually inspected. No HelloNear artwork, character, branding or source code is included.

## Product truth

This is a design illustration of the intended product cycle. It makes no API calls, connects no wallet and submits no transaction. The portfolio result uses synthetic case C03 from the historical sealed-probe test. Evidence links refer to that run. The marketplace, payment distribution, DAO bounty and proposed v2 are not a completed integrated workflow. Percentages are not finalized. Private cases require separate owner permission for improvement testing.

## Verification

JavaScript syntax, local assets, unique IDs, ARIA links and six-panel state logic passed local checks. Checks cover direct navigation, previous/next boundaries, playback completion, hidden-page pause and reduced-motion manual controls. Browser launch and localhost binding were denied by the sandbox. Integrated desktop/mobile rendering still needs visual review. This draft is not approved.

## Historical drafts

The rejected batik hero is `kalis-hero-v1.html`. The earlier 3D scenes remain in `kalis-hero.js` and `kalis-hero-orbit-v1.js`. Three.js is no longer loaded by the active HTML. The retained vendor library uses MIT, with its license in `vendor/THREE-LICENSE.txt`.
