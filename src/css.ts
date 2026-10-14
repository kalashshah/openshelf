/** The app stylesheet: Penny's design system (warm white, hairline cards, pill buttons) plus the shop pieces. */
export const CSS = `
:root{--bg:#FAF8F7;--bg2:#F4F2EF;--bg3:#EEEBE7;--card:#FFFFFF;--ink:#1C1C1C;--ink2:#474644;--muted:#838180;--line:#E6E2DE;--line2:#D6D1CB;--lime:#CDF034;--green:#0B6E77;--green2:#2FA84F;--green-soft:#E6F4EA;--red:#C8433B;--red-soft:#FBE7E5;--amber:#B5730E;--amber-soft:#FFF3DA;--r:16px;color-scheme:light;
--duration-quick:150ms;--duration-fast:250ms;--duration-medium:350ms;--duration-slow:400ms;--duration-very-slow:500ms;--ease-smooth-out:cubic-bezier(0.22,1,0.36,1);--ease-bounce-strong:cubic-bezier(0.34,3.85,0.64,1);}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"General Sans",Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15.5px;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit}button,input,select{font-family:inherit}
.wrap{max-width:1200px;margin:0 auto;padding:0 24px 56px;min-width:0}
h1,h2,h3{margin:0;font-weight:500;letter-spacing:-.02em;line-height:1.15}
h1{font-size:clamp(28px,3.4vw,38px)}h2{font-size:17px}h3{font-size:16px}
.sub{color:var(--ink2);margin:6px 0 0;max-width:620px}.muted{color:var(--muted)}.small{font-size:13px}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.num{font-variant-numeric:tabular-nums}

/* nav */
nav.app{display:flex;align-items:center;gap:22px;height:66px}
.logo{display:flex;align-items:center;gap:9px;font-weight:600;font-size:18px;letter-spacing:-.02em;text-decoration:none}
.logo .mk{width:22px;height:22px;border-radius:7px;background:var(--ink);display:inline-flex;align-items:center;justify-content:center;color:var(--lime);font-size:13px;font-weight:700}
nav.app .links{display:flex;gap:18px;font-size:14px;font-weight:500}nav.app .links a{text-decoration:none;color:var(--ink2);transition:color var(--duration-quick)}nav.app .links a:hover{color:var(--ink)}
nav.app .right{margin-left:auto;display:flex;gap:10px;align-items:center}
@media(max-width:820px){nav.app .links{display:none}}

/* page header */
.head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:22px 0 20px}

/* buttons, chips */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:10px 18px;border-radius:999px;font-weight:500;font-size:14.5px;text-decoration:none;border:1px solid var(--line2);background:var(--card);color:var(--ink);cursor:pointer;transition:transform var(--duration-medium) var(--ease-bounce-strong),box-shadow var(--duration-medium) var(--ease-smooth-out),background var(--duration-quick),opacity var(--duration-quick)}
.btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px -14px rgba(28,28,28,.5);transition:transform var(--duration-fast) var(--ease-smooth-out),box-shadow var(--duration-fast) var(--ease-smooth-out)}
.btn.dark{background:var(--ink);color:#fff;border-color:var(--ink)}.btn.dark:hover{background:#000}
.btn.danger{color:var(--red)}.btn.sm{padding:7px 13px;font-size:13.5px}.btn.lg{padding:13px 22px;font-size:15.5px}.btn.block{width:100%}
.btn:disabled{opacity:.45;cursor:default;transform:none;box-shadow:none}
.btn .dot{width:7px;height:7px;border-radius:50%;background:var(--green2);display:inline-block}
.chip{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:500;background:var(--bg3);color:var(--ink2);white-space:nowrap}
.chip.ok{background:var(--green-soft);color:var(--green)}.chip.warn{background:var(--amber-soft);color:var(--amber)}.chip.bad{background:var(--red-soft);color:var(--red)}
.chip .dot{width:6px;height:6px;border-radius:50%;background:currentColor}

/* cards, tiles, tables */
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:20px 22px;margin:14px 0}
.card h2{margin-bottom:12px}.card>p:first-of-type{margin-top:0}
.cardhead{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}.cardhead h2{margin:0}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0}
@media(max-width:900px){.kpis{grid-template-columns:repeat(2,1fr)}}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:14px 16px}
.kpi .l{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}.kpi .n{font-size:26px;font-weight:600;letter-spacing:-.02em;margin-top:4px;font-variant-numeric:tabular-nums}.kpi .s{font-size:12.5px;color:var(--muted)}
.kpi.ok .n{color:var(--green)}.kpi.warn .n{color:var(--amber)}.kpi.bad .n{color:var(--red)}
table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}
th{text-align:left;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);font-weight:500;padding:0 8px 8px}
td{padding:9px 8px;border-top:1px solid var(--line);vertical-align:top}th.r,td.r{text-align:right}
td a{text-decoration:none;border-bottom:1px solid var(--line2)}td a:hover{border-color:var(--ink)}
.empty{color:var(--muted);margin:0;padding:6px 0}

/* alerts and proposals */
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.right{margin-left:auto}
.msg{padding:10px 12px;border-radius:10px;background:var(--bg2);margin:8px 0;font-size:14px}.msg b{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:500;margin-bottom:2px}
.facts td:first-child{color:var(--muted);width:160px}

/* forms */
label.f{display:block;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
.fld{margin-top:16px}
input.f,select.f{width:100%;padding:10px 13px;border:1px solid var(--line2);border-radius:12px;background:var(--card);color:var(--ink);font-size:15px;outline:none;transition:border-color var(--duration-quick),box-shadow var(--duration-quick)}
input.f:focus,select.f:focus{border-color:var(--ink);box-shadow:0 0 0 3px rgba(28,28,28,.08)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;align-items:end}@media(max-width:640px){.grid2{grid-template-columns:1fr}}
.note{border:1px solid var(--line);border-left:3px solid var(--green2);background:var(--card);border-radius:12px;padding:12px 14px;margin:14px 0}.note.err{border-left-color:var(--red);color:var(--red)}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;background:var(--bg3);padding:2px 6px;border-radius:6px}

/* login */
.auth{max-width:420px;margin:56px auto 0}
.auth .logo{justify-content:center;margin-bottom:18px}.auth h1{text-align:center;font-size:30px}.auth .sub{text-align:center;margin:8px auto 26px}
.auth .or{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:13px;margin:14px 0}.auth .or::before,.auth .or::after{content:"";flex:1;height:1px;background:var(--line)}
.otp{font-size:28px;letter-spacing:10px;text-align:center;font-variant-numeric:tabular-nums}
.gmark{width:18px;height:18px}

/* motion */
.rise{animation:rise var(--duration-very-slow) var(--ease-smooth-out) both;animation-delay:var(--d,0s)}@keyframes rise{from{opacity:0;transform:translateY(10px);filter:blur(3px)}to{opacity:1;transform:none;filter:blur(0)}}
/* shop pieces */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin:14px 0}
.prod{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column;scroll-margin-top:20px}
.prod:target{box-shadow:0 0 0 3px var(--lime)}
.prod .img{aspect-ratio:4/3;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:600;color:var(--ink2);letter-spacing:-.03em;overflow:hidden}
.prod .img img{width:100%;height:100%;object-fit:cover}
.prod .body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:8px;flex:1}
.prod .price{font-weight:600;font-variant-numeric:tabular-nums}
.prod .desc{font-size:13.5px;color:var(--ink2);margin:0}
.prod form{margin-top:auto;display:flex;flex-direction:column;gap:8px}
select.f.sm,input.f.sm{padding:7px 10px;font-size:14px;border-radius:10px}
textarea.f{width:100%;padding:10px 13px;border:1px solid var(--line2);border-radius:12px;background:var(--card);color:var(--ink);font:inherit;font-size:15px;outline:none;min-height:96px;resize:vertical}
textarea.f:focus{border-color:var(--ink);box-shadow:0 0 0 3px rgba(28,28,28,.08)}
.agentbox{background:var(--ink);color:#fff;border-radius:var(--r);padding:18px 20px;margin:14px 0}
.agentbox .mono{color:#b9b6b2}.agentbox code{background:#2b2b2b;color:var(--lime);font-size:13px;word-break:break-all}
.agentbox a{color:var(--lime)}
.chat{display:flex;flex-direction:column;gap:8px;max-height:420px;overflow:auto;margin:10px 0}
.bubble{padding:10px 13px;border-radius:14px;max-width:85%;font-size:14.5px;white-space:pre-wrap}
.bubble.me{align-self:flex-end;background:var(--ink);color:#fff;border-bottom-right-radius:4px}
.bubble.them{align-self:flex-start;background:var(--bg2);border-bottom-left-radius:4px}
.bubble .recs{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 4px}
.feed{list-style:none;margin:0;padding:0}.feed li{display:flex;gap:12px;padding:10px 0;border-top:1px solid var(--line);align-items:flex-start}.feed li:first-child{border-top:0}
.feed .who{width:62px;flex:none}
.hero{padding:56px 0 24px;max-width:780px}.hero h1{font-size:clamp(36px,5.4vw,60px);letter-spacing:-.035em}.hero .sub{font-size:18px;max-width:640px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0}@media(max-width:820px){.steps{grid-template-columns:1fr}}
.steps.four{grid-template-columns:repeat(4,1fr)}@media(max-width:1060px){.steps.four{grid-template-columns:repeat(2,1fr)}}@media(max-width:640px){.steps.four{grid-template-columns:1fr}}
.step{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px}.step .k{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--muted)}
pre.convo{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;font:13.5px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre;margin:14px 0;overflow:auto}
pre.convo b{color:var(--green)}pre.convo i{color:var(--muted);font-style:normal}
@media(max-width:640px){.wrap{padding:0 16px 48px}.card{padding:16px}}
`;
