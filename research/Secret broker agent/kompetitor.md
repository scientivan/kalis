# Validasi kompetitor: Secret broker untuk agent coding

Tanggal riset: 2026-11-11. Ide yang diuji: agent coding hanya melihat handle seperti `{{secret:AWS_KEY}}`, nilai asli disimpan di TEE dengan kunci per pengguna, disisipkan di TEE saat perintah atau panggilan API dijalankan, output disaring (termasuk bentuk ter-encode), izin dibatasi, dan setiap pelepasan dicatat publik di NEAR.

## Jawaban singkat

[Fakta] Ya, produk yang membuat agent tidak bisa membaca nilai secret sudah ada dan cukup banyak. Polanya sama: agent memegang placeholder, lalu proxy menukar placeholder dengan nilai asli di lapisan jaringan. Contohnya Claude Code sendiri (`sandbox.credentials` mode `mask`), Infisical Agent Vault, varlock, OneCLI, SIGIL, Aegis, dan AgentSecrets (sumber di bagian detail).

[Fakta] Bahkan sintaks handle-nya sudah dipakai. SIGIL menulis: "The agent never sees the secret", dengan placeholder `{{secret:path}}` dan `sigil exec` (https://github.com/jedarden/SIGIL).

[Fakta] Versi berbasis TEE juga sudah ada: Lit Agent Keychain (Intel TDX, attestation diverifikasi SDK), OutLayer secrets di NEAR, dan submission hackathon ini sendiri, KeyLease ("Agents call through a pinned TEE proxy").

[Inferensi] Yang belum kutemukan dalam satu produk adalah gabungan tiga hal: penyaringan output yang menangani bentuk ter-encode, log pelepasan per panggilan yang publik di blockchain, dan dukungan perintah shell (bukan hanya HTTP) untuk agent coding. Dasarnya: tidak ada satu pun sumber di bawah yang mengklaim ketiganya sekaligus.

## Metode

[Fakta] 23 pencarian web dan 14 halaman sumber dibuka. Semua kutipan di bawah berupa cuplikan dari halaman yang dibuka atau dari ringkasan hasil pencarian (ditandai "ringkasan pencarian" kalau halamannya tidak kubuka langsung). Harga hanya ditulis kalau sumber menyebutnya.

[Fakta] File `hasil-riset/near-submissions-2026-11-08/projects.json` (431 proyek) dan `new-projects-2026-11-10.json` (145 proyek) disaring dengan kata kunci secret, api key, credential, vault, .env, keyless, broker.

## Tabel ringkas

[Fakta] Isi tabel diringkas dari bagian detail. "Tidak disebut" artinya sumber yang dibuka tidak membahasnya, bukan berarti fiturnya pasti tidak ada.

| Produk | Agent bisa baca nilai? | Saring output | Bukti hardware / log publik |
|---|---|---|---|
| Claude Code `mask` | Tidak (sentinel), ada pengecualian | Tidak disebut | Tidak |
| Infisical Agent Vault | Tidak (proxy HTTP) | Tidak disebut | Log terenkripsi, privat |
| varlock proxy | Tidak (placeholder) | Ya, scrub respons | Log lokal, privat |
| OneCLI | Tidak (placeholder) | Tidak disebut | Tidak |
| SIGIL | Tidak (`{{secret:path}}`) | Ya, tanpa detail encode | Tidak |
| Lit Agent Keychain | Tidak, kecuali `export`/`run` | Tidak disebut | TDX attestation, tanpa log |
| OutLayer secrets | Tidak (hanya WASM di TEE) | Tidak | TEE, log derivasi on-chain |
| KeyLease (NEAR) | Tidak (proxy TEE) | Tidak disebut | TEE, log tidak disebut |
| Aembit Gateway | Tidak (MCP) | Tidak disebut | Log privat |
| 1Password `op run` | Ya (env var) | Tidak | Tidak |
| Doppler `doppler run` | Ya (env var) | Tidak | Audit privat |
| HashiCorp Vault MCP | Ya, bisa terekspos | Tidak | Audit privat |
| GitGuardian AI hook | Dicegah setelah bocor | Ya, pola | Tidak |

## Detail per kompetitor

### Claude Code (bawaan)

- [Fakta] Mode `mask`: "Claude Code shows sandboxed commands a per-session placeholder called the sentinel, and the sandbox proxy substitutes the real value on outbound requests to hosts you allow." (https://code.claude.com/docs/en/sandboxing)
- [Fakta] "The command and anything it logs never hold the real credential, but its requests still authenticate." (sumber sama)
- [Fakta] Pengecualian yang diakui dokumen: default `onExtractNoMatch` bernilai `warn` sehingga "sandboxed commands can read the real file unmasked"; "A `denyRead` entry doesn't stop the Read tool"; hook dan MCP server lokal "run with your full access". Dokumen juga menulis "Don't rely on any of the sandbox's restrictions ... to stop a malicious command."
- [Fakta] "There is no built-in credential deny list, so only the files and variables you list are restricted."
- [Fakta] Penyaringan output tidak disebut di halaman itu. Tidak ada TEE atau log publik. Gratis sebagai bagian Claude Code.

### OpenAI Codex

- [Fakta] Di Codex cloud, secret hanya tersedia saat fase setup script lalu dihapus sebelum fase agent (ringkasan pencarian dari balasan staf OpenAI di community.openai.com thread "Codex (Cloud) Secret Injection" dan https://codex.danielvaughan.com). Halaman resmi https://developers.openai.com/codex/cloud/environments tidak kubuka penuh.
- [Inferensi] Ini mencegah agent membaca secret, tapi juga membuat agent tidak bisa memakainya saat bekerja. Jadi ini bukan broker.

### Infisical Agent Vault dan Agent Proxy

- [Fakta] "attaches the real credentials or logs in with them, so the agents never see them." (https://infisical.com/docs/documentation/platform/agent-vault/overview)
- [Fakta] Ada "Session logs ... A record of every request an AI agent makes, stored encrypted." (sumber sama). Tidak menyebut TEE atau attestation.
- [Fakta] Blog Infisical tentang env injection biasa: "that process and its children can read it." Log proxy mencatat "the method, host, path, status code, and whether a credential was attached", tanpa menyebut scrubbing respons. Status "in preview now". (https://infisical.com/blog/dont-give-ai-agents-your-env)
- [Fakta] Agent Proxy "is part of any Infisical Secrets Management and available on any plan" (https://infisical.com/blog/agent-proxy, dipublikasikan 2026-07-30).

### varlock

- [Fakta] "run coding agents, MCP servers, and any untrusted tool so they only ever see placeholder secrets" dan "the agent never holds a real secret, even if it re-runs `varlock load` or reads its own environment." (https://varlock.dev/)
- [Fakta] Nilai asli "injected at the network boundary against a cryptographically verified upstream", nilai asli di-scrub dari respons, dan setiap request dicatat tanpa nilai secret. Perintahnya `varlock proxy run -- claude`. (sumber sama)
- [Fakta] Lisensi MIT, gratis. Broker dijalankan sendiri di host yang sama dengan agent. Tidak ada TEE.

### OneCLI

- [Fakta] Gateway open source (Rust) yang memberi agent kunci placeholder lalu menukarnya dengan kredensial asli saat request HTTP lewat proxy. Didukung YC batch Summer 2026 dan terdaftar di 1Password Marketplace (ringkasan pencarian: https://github.com/onecli/onecli, https://www.ycombinator.com/launches/RoJ-onecli-your-ai-agents-shouldn-t-be-holding-raw-secrets, https://onecli.sh/blog/onecli-1password-marketplace).
- [Fakta] Satu sumber pihak ketiga menyebut injeksi hanya untuk HTTP(S) (https://dev.co/ai/mcp/onecli, belum kuverifikasi di README).

### SIGIL

- [Fakta] "The agent never sees the secret." Placeholder `{{secret:path}}` diselesaikan oleh `sigil exec`, ada `sigil-shell` yang mencegat perintah dan `sigil-proxy` untuk injeksi auth HTTP. Hook disebut "scrub inputs/outputs", tanpa detail base64 atau hex. Dukungan Claude Code "Comprehensive", Codex CLI "Strong". (https://github.com/jedarden/SIGIL)
- [Fakta] 3 bintang, versi 0.4.0, lisensi Apache-2.0/MIT. Tidak menyebut audit log atau TEE.

### Aegis dan AgentSecrets

- [Fakta] Aegis (`@getaegis/cli`) adalah proxy isolasi kredensial lokal yang menyisipkan secret di batas jaringan, dengan integrasi MCP dan pembatasan domain (ringkasan pencarian: https://socket.dev/npm/package/@getaegis/cli).
- [Fakta] AgentSecrets adalah proxy kredensial dengan injeksi dari OS keychain yang hanya menampilkan nama kunci, bukan nilai (ringkasan pencarian: https://www.hnshowcase.com/post/47167691/agentsecrets-zero-knowledge-credential-proxy-for-ai-agents).

### Lit Agent Keychain (Lit Protocol)

- [Fakta] "Each secret is encrypted in the owner's browser to its own immutable Lit Action." Kunci diturunkan di enclave Intel TDX. (https://keychain.litprotocol.com/llms.txt)
- [Fakta] "`export` delivers the plaintext encrypted to the agent." Aksi lain "uses the credential only inside the enclave for one fixed upstream call" dan "the credential is not returned to the agent". Ada juga `run` untuk memasukkan secret ke env satu perintah. (sumber sama)
- [Fakta] "The SDK attests the Lit endpoint" dan "fails closed on check failure", dengan cek TDX quote dan whitelist on-chain di Base. Ada MCP lokal (`claude mcp add`). Audit log dan harga tidak disebut. (sumber sama)

### OutLayer secrets (NEAR)

- [Fakta] "Decryption happens in TEE workers with attestation verification, so plaintext exists only inside the enclave." Secret "injected as environment variables when your WASM code executes". (https://app.outlayer.ai/docs/secrets)
- [Fakta] "All key derivation requests are logged on-chain for auditability", tapi ini untuk permintaan kunci, bukan tiap pemakaian secret. Penyimpanan secret untuk agent sekitar 0,1 NEAR. Penyaringan output tidak dijelaskan; dokumen memperingatkan kode yang "prints or sends it has leaked it". (sumber sama)
- [Inferensi] Ini infrastruktur, bukan produk untuk Claude Code atau Codex. Tapi ini bahan bangunan paling dekat yang bisa dipakai ide ini di NEAR.

### Aembit MCP Identity Gateway

- [Fakta] "the AI agent never holds any credential, not even the short-lived token". "Aembit logs every AI agent request with both verified user identity and AI agent workload identity." Agent yang disebut: Claude Desktop, Gemini CLI, klien MCP kustom. Penyaringan respons dan harga tidak dibahas. (https://docs.aembit.io/get-started/use-cases/ai-agents/)

### 1Password

- [Fakta] Environments MCP Server mengelola Environments "without returning secrets to the agent". Untuk NVIDIA OpenShell, agent "works with placeholders and never sees secret values", tanpa penjelasan mekanisme. (https://www.1password.dev/security-for-ai)
- [Fakta] Untuk Claude Code, `op run` menyuplai secret ke perintah yang membutuhkannya (ringkasan pencarian dari https://www.1password.community/developers-blog-53/why-claude-code-and-1password-are-the-perfect-match-25455). 1Password for Claude (16 Juli 2026) membuat Claude tidak melihat password, tapi untuk login browser, bukan terminal (ringkasan pencarian dari https://thenextweb.com/news/1password-claude-credential-zero-exposure-agentic-mode).
- [Inferensi] `op run` memasukkan nilai ke env var proses, sehingga agent yang menjalankan perintah itu masih bisa mencetaknya. Dasarnya: prinsip yang sama ditulis Infisical ("that process and its children can read it").

### Doppler

- [Fakta] "use doppler run to inject those secrets as environment variables into the agent process at launch." MCP server memberi "read-only access to projects and configs". Ada "Full audit trail". Tidak ada proxy atau redaksi. Service Account Identity (OIDC) adalah "Team plan feature". (https://www.doppler.com/agents)
- [Inferensi] Karena disuntik ke proses agent, agent bisa membaca nilainya.

### HashiCorp Vault MCP

- [Fakta] HashiCorp memperingatkan server MCP-nya bisa mengekspos data Vault, termasuk secret, ke klien MCP dan LLM, dan menyarankan tidak dipakai dengan LLM yang tidak dipercaya (ringkasan pencarian dari https://developer.hashicorp.com/vault/docs/mcp-server/overview).

### Bitwarden

- [Fakta] Agent Access SDK: kredensial "is injected directly into the agent process, never exposed in plaintext", dengan akses just-in-time dan persetujuan manusia (ringkasan pencarian dari https://bitwarden.com/blog/shadow-ai-agents-how-to-secure-credential-access-with-agent-access-sdk/).
- [Inferensi] "Disuntik ke proses agent" berarti proses agent memegang nilai, jadi tidak setara dengan "agent tidak bisa membaca".

### Akeyless dan Astrix

- [Fakta] Akeyless memasarkan "secretless access" berupa izin berbasis identitas yang berumur pendek, plus Runtime Authority (Maret 2026) yang memutuskan izin saat aksi (ringkasan pencarian dari https://www.akeyless.io/press-release/akeyless-launches-secretlessai-pioneering-approach-to-secure-ai-agents/ dan https://startwithidentity.com/blog/2026-03-31-akeyless-launches-runtime-authority-for-ai-agents/).
- [Fakta] Astrix Agent Control Plane (September 2025) memberi tiap agent kredensial berumur pendek dan terbatas (ringkasan pencarian dari https://www.helpnetsecurity.com/2025/09/17/astrix-security-ai-agent-control-plane-acp/).
- [Inferensi] Keduanya menyasar enterprise IAM. Token pendek tetap bisa dibaca agent selama masih berlaku.

### GitGuardian ggshield AI hook

- [Fakta] Hook memindai prompt, tool call, dan output tool. Sejak 25 Sep 2026, output tool yang bocor di Claude Code diganti pesan ggshield, tapi output MCP "still reach the model" (ringkasan pencarian dari https://docs.gitguardian.com/releases/saas/2026/09/07/changelog dan https://docs.gitguardian.com/endpoint-protection/ai-hooks).
- [Inferensi] Ini deteksi pola setelah nilai sudah ada di output, bukan pencegahan akses.

### dotenvx dan Teller

- [Fakta] dotenvx mengenkripsi nilai di file `.env` dan mendekripsi dengan `.env.keys` lokal. Klaim flag `--redact` hanya dari agregator, tidak kutemukan di dokumen resmi (ringkasan pencarian). Tentang Teller tidak ditemukan sumber yang relevan untuk agent.

### Riset: CaMeL (Google DeepMind dan ETH Zurich)

- [Fakta] CaMeL memisahkan alur kontrol dan data, dengan "tracking the provenance and allowed readers of every value via capabilities". Hasilnya 77% tugas AgentDojo dengan keamanan terbukti di satu versi abstrak. Kode di https://github.com/google-research/camel-prompt-injection. (https://arxiv.org/abs/2503.18813, ringkasan pencarian; teks lengkap tidak kubaca)
- [Inferensi] CaMeL mengatur ke mana data boleh mengalir, bukan menyembunyikan secret dari agent coding. Konsepnya bisa jadi dasar teori untuk aturan "secret hanya boleh ke domain X".

### Bukti bahwa penyaringan output berbasis pola mudah ditembus

- [Fakta] Laporan forum Cursor: transformasi seperti "od -c, xxd, base64, hexdump" lolos dari filter, sedangkan echo biasa tersaring (https://forum.cursor.com/t/agent-was-able-to-print-runtime-secret/161553, ringkasan pencarian).
- [Fakta] Kasus OpenHands: token disembunyikan di output, tapi prompt injection membuat agent mengirim token dalam Base64 ke server (https://embracethered.com/blog/posts/2025/openhands-the-lethal-trifecta-strikes-again, ringkasan pencarian).
- [Fakta] NVIDIA OpenShell: "even with perfect redaction, your secrets can still leak verbatim to the model", dan agent bisa "encode sensitive data in a form that slips past filters". Usulan mereka adalah redaksi saat data masuk sesi. (https://nvidia.github.io/OpenShell-Research/dev-notes/posts/2026-09-26-network-redaction-is-not-enough/)

## Submission NEAR Hackathon 2026 yang mirip

[Fakta] Hasil saring `projects.json` dan `new-projects-2026-11-10.json`:

- **KeyLease (#134)**, track swarms, security, agents: "Seal an API key once. Share leases (N calls, endpoints, expiry). Agents call through a pinned TEE proxy; revoke and the next call is refused." 0 likes, diposting 5 Nov 2026. Repo tidak ada di data.
- **Budget Broker MCP (#199)**: beberapa agent memakai satu wallet NEAR "and none of them holds the key". Fokus kunci wallet, bukan API key atau perintah shell.
- **cipherwork (#357)**: "verify the TEE, send the secret encrypted, check signed results". Fokus data rahasia untuk komputasi, bukan kredensial agent coding.
- Banyak proyek lain (Semilla1 Guard, Leash, AgentGuard, Agent Vault #428, Veto, VetoAgent, Banbo) menyasar batas belanja wallet agent, bukan secret developer.

[Inferensi] KeyLease adalah tabrakan paling langsung di hackathon ini: konsep "agent memakai API key lewat proxy TEE tanpa melihatnya" sudah diklaim submission lain.

## Celah yang masih kosong

Semua poin di bagian ini adalah **[Inferensi]**, berdasarkan tidak adanya klaim tersebut di sumber yang kubuka.

1. **Log pelepasan publik per panggilan.** Tidak ada kompetitor yang mencatat tiap pemakaian secret di blockchain publik. Log Infisical, Aembit, Doppler, dan varlock bersifat privat. OutLayer hanya mencatat derivasi kunci. Lit hanya memverifikasi attestation.
2. **Penyaringan output untuk bentuk ter-encode.** varlock dan SIGIL mengklaim scrub, tapi tidak menyebut base64 atau hex. Bukti dari Cursor, OpenHands, dan NVIDIA menunjukkan ini lubang nyata.
3. **Perintah shell, bukan hanya HTTP.** Hampir semua broker bekerja di lapisan proxy HTTP. Hanya SIGIL (`sigil exec`) dan Lit (`run`) yang menyentuh perintah, dan Lit `run` memasukkan nilai ke env.
4. **Gabungan TEE dan agent coding umum.** Lit dan OutLayer punya TEE tapi tidak dirancang untuk Claude Code atau Codex sebagai pengguna utama. Yang dirancang untuk agent coding (Claude Code `mask`, varlock, SIGIL) tidak memakai TEE.

## Risiko yang perlu diakui sebelum mengklaim celah

Semua poin di bagian ini adalah **[Inferensi]**.

- **Nilai jual "agent tidak bisa membaca" sudah gratis.** Claude Code punya `mask` bawaan dan varlock gratis (MIT). Juri bisa bertanya kenapa butuh TEE dan blockchain kalau proxy lokal sudah cukup.
- **Menjalankan perintah di TEE berarti perintah tidak jalan di laptop.** Perintah seperti `aws s3 sync ./dist` butuh file lokal. Kalau perintahnya tetap lokal, nilai asli harus ada di mesin lokal dan TEE tidak melindungi apa pun di titik itu. Ini masalah arsitektur, bukan detail.
- **Penyaringan output tidak bisa sempurna.** Agent yang mengendalikan perintah bisa membuat transformasi baru (misalnya XOR dengan kunci acak). Yang lebih kuat adalah allowlist tujuan (secret hanya dikirim ke domain tertentu), yang sudah dimiliki Claude Code `mask`, Aegis, dan Lit. Klaim "output disaring termasuk bentuk ter-encode" harus ditulis sebagai mitigasi, bukan jaminan.
- **Log publik bisa membocorkan metadata** (siapa memakai layanan apa dan kapan). Perlu dijelaskan kenapa log publik lebih baik dari audit privat bagi pengguna.

## Nilai originality

[Inferensi] **Rendah untuk inti ide, sedang untuk gabungannya.** Dasarnya:

- Inti ide (agent hanya melihat handle, nilai ditukar di luar jangkauan agent) sudah ada di minimal tujuh produk, termasuk sintaks `{{secret:...}}` yang identik di SIGIL.
- Varian TEE sudah ada di Lit Agent Keychain, OutLayer, dan KeyLease (submission di hackathon yang sama).
- Pembeda yang tersisa adalah log pelepasan publik di NEAR dan penanganan perintah shell plus output ter-encode. Itu cukup untuk disebut "sedang" hanya kalau ide memimpin dengan pembeda itu, bukan dengan klaim "agent tidak bisa membaca secret".
