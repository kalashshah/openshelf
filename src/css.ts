/** The app stylesheet: Penny's design system (warm white, hairline cards, pill buttons) plus the shop pieces. */
export const CSS = `
:root{--bg:#FFFFFF;--bg2:#FCFCFA;--bg3:#F2F1EE;--card:#FFFFFF;--ink:#1C1C1C;--ink2:#474644;--muted:#838180;--line:#ECEAE7;--line2:#DCD9D4;--lime:#CDF034;--green:#0B6E77;--green2:#2FA84F;--green-soft:#E6F4EA;--red:#C8433B;--red-soft:#FBE7E5;--amber:#B5730E;--amber-soft:#FFF3DA;--r:16px;color-scheme:light;
--duration-quick:150ms;--duration-fast:250ms;--duration-medium:350ms;--duration-slow:400ms;--duration-very-slow:500ms;--ease-smooth-out:cubic-bezier(0.22,1,0.36,1);--ease-bounce-strong:cubic-bezier(0.34,3.85,0.64,1);}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"General Sans",Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15.5px;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit}button,input,select{font-family:inherit}
.wrap{max-width:1280px;margin:0 auto;padding:0 24px 64px;min-width:0}
h1,h2,h3{margin:0;font-weight:500;letter-spacing:-.02em;line-height:1.15}
h1{font-size:clamp(28px,3vw,36px);letter-spacing:-.025em}h2{font-size:17px}h3{font-size:16px}
.sub{color:var(--ink2);margin:8px 0 0;max-width:620px;line-height:1.7}.muted{color:var(--muted)}.small{font-size:13px}
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
.head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:40px 0 24px}

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
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:24px;margin:16px 0}
.card h2{margin-bottom:12px}.card>p:first-of-type{margin-top:0}
.cardhead{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}.cardhead h2{margin:0}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0}
@media(max-width:900px){.kpis{grid-template-columns:repeat(2,1fr)}}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:20px}
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

/* hero two-column */
.container.hero2{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;padding-top:72px;padding-bottom:72px}
@media(max-width:960px){.container.hero2{grid-template-columns:1fr;gap:36px;padding-top:44px;padding-bottom:48px}}
/* ---- site system (header, sections, type, pills) after medifly.ai: 1280 container, 56px header, 64px sections ---- */
.container{max-width:1280px;margin:0 auto;padding:0 24px}
.hdr{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.9);backdrop-filter:saturate(1.4) blur(12px);-webkit-backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--line)}
.hdr .in{max-width:1280px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;gap:28px}
.hdr .logo{font-size:19px}
.hdr nav{display:flex;gap:24px}.hdr nav a{font-size:14px;color:var(--ink2);text-decoration:none;transition:color .15s}.hdr nav a:hover,.hdr nav a.on{color:var(--ink)}
.hdr .end{margin-left:auto;display:flex;gap:10px;align-items:center}
@media(max-width:860px){.hdr nav{display:none}.hdr .in{gap:12px}}
@media(max-width:520px){.hdr .end .lime,.hdr .end .hide-sm{display:none}.hdr .logo{font-size:17px}}
.pb{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:44px;padding:0 20px;border-radius:999px;font-size:14.5px;font-weight:500;text-decoration:none;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer;white-space:nowrap;transition:transform .35s var(--ease-bounce-strong),box-shadow .25s,background .15s}
.pb:hover{transform:translateY(-1px);box-shadow:0 10px 24px -16px rgba(28,28,28,.5);transition:transform .25s var(--ease-smooth-out),box-shadow .25s}
.pb.dark{background:var(--ink);color:#fff;border-color:var(--ink)}.pb.sm{height:38px;padding:0 16px;font-size:13.5px}
.pb.lime{border:1.5px solid var(--lime);background:#FBFEF0}
.pb .dot{width:7px;height:7px;border-radius:50%;background:#34D27B;box-shadow:0 0 0 3px rgba(52,210,123,.18)}
.pb .two{display:flex;flex-direction:column;line-height:1.15;text-align:left}.pb .two small{font-size:11.5px;font-weight:400;opacity:.75;display:flex;align-items:center;gap:5px}
.badge-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border:1px solid var(--line);border-radius:999px;background:var(--bg2);font-size:12.5px;color:var(--ink2)}
.badge-pill .ck{color:#2FA84F;font-weight:600}
.h1x{font-size:clamp(36px,4.4vw,52px);font-weight:500;letter-spacing:-.025em;line-height:1.06;margin:22px 0 18px}
.mark{background:#F1FBC6;border-radius:10px;padding:0 .14em;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.lead{font-size:16px;line-height:1.75;color:var(--ink2);max-width:560px;margin:0}
.cap{font-size:12.5px;color:var(--muted);margin:16px 0 0}
.h2x{font-size:clamp(28px,3vw,36px);font-weight:500;letter-spacing:-.025em;line-height:1.15;margin:0}
.sec-lead{font-size:16.5px;color:var(--ink2);margin:12px 0 0;line-height:1.6}
.section{padding:64px 0}.section.alt{background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.center{text-align:center}.center .sec-lead{margin-left:auto;margin-right:auto}
.statband{background:var(--ink);color:#fff}
.statband .container{display:grid;grid-template-columns:repeat(4,1fr)}
.statband .cell{padding:30px 24px;border-left:1px solid rgba(255,255,255,.12)}.statband .cell:first-child{border-left:0;padding-left:0}
.statband b{display:block;font-weight:500;font-size:15.5px}.statband span{display:block;font-size:13.5px;color:rgba(255,255,255,.55);margin-top:6px;line-height:1.5}
@media(max-width:900px){.statband .container{grid-template-columns:1fr 1fr}.statband .cell:nth-child(3){border-left:0;padding-left:0}.statband .cell{border-top:1px solid rgba(255,255,255,.12)}.statband .cell:nth-child(-n+2){border-top:0}}
@media(max-width:520px){.statband .container{grid-template-columns:1fr}.statband .cell{border-left:0;padding-left:0}.statband .cell:nth-child(2){border-top:1px solid rgba(255,255,255,.12)}}
.how{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:44px;text-align:left}
@media(max-width:1000px){.how{grid-template-columns:1fr 1fr}}@media(max-width:560px){.how{grid-template-columns:1fr}.frame .vis{aspect-ratio:4/3}}
.frame{border:1px solid var(--line);border-radius:16px;padding:6px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.frame .vis{position:relative;border-radius:11px;aspect-ratio:1/1;overflow:hidden;background:linear-gradient(160deg,#F7F6F2,#EFEDE7);display:flex;align-items:center;justify-content:center;padding:18px}
.stepnum{position:absolute;top:12px;left:12px;width:22px;height:22px;border-radius:6px;background:var(--ink);color:#fff;font-size:11.5px;font-weight:600;display:flex;align-items:center;justify-content:center}
.how h3{font-size:17px;font-weight:500;margin:18px 0 6px;letter-spacing:-.01em}.how p{font-size:14.5px;color:var(--ink2);margin:0;line-height:1.6}
.mock{width:100%;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;font-size:12px;box-shadow:0 12px 30px -20px rgba(0,0,0,.3)}
.mock .r{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--line)}.mock .r:first-of-type{border-top:0}
.mock .ic{width:22px;height:22px;border-radius:6px;background:var(--bg3);display:inline-flex;align-items:center;justify-content:center;font-size:11px;flex:none}
.mock .ok{margin-left:auto;color:#2FA84F}
.bub{border-radius:12px;padding:8px 10px;margin:6px 0;max-width:92%;width:fit-content;line-height:1.45}.bub.a{background:var(--ink);color:#fff;margin-left:auto;border-bottom-right-radius:4px}.bub.b{background:#F1FBC6;border-bottom-left-radius:4px}
.dark{background:var(--ink);color:#fff}
.eyeline{display:flex;align-items:center;gap:16px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.6)}.eyeline::before{content:"";width:40px;height:1px;background:var(--lime)}
.eyeline.ink{color:var(--muted)}
.split{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:end;padding-bottom:36px;border-bottom:1px solid rgba(255,255,255,.12)}
@media(max-width:860px){.split{grid-template-columns:1fr;gap:20px}}
.dark .h2x{color:#fff;font-size:clamp(30px,3.6vw,44px);margin-top:18px}
.dark .sec-lead{color:rgba(255,255,255,.65)}
.cols{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:36px}@media(max-width:900px){.cols{grid-template-columns:1fr 1fr}}@media(max-width:520px){.cols{grid-template-columns:1fr}}
.cols .it{border-top:1px solid rgba(255,255,255,.15);padding-top:16px}.cols .it:first-child{border-top-color:var(--lime)}
.cols .k{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.5)}.cols .it:first-child .k{color:var(--lime)}
.cols .t{margin:10px 0 6px;font-size:15.5px;line-height:1.45}.cols .d{font-size:13.5px;color:rgba(255,255,255,.5);line-height:1.55}
.lime-btn{display:inline-flex;align-items:center;gap:10px;height:46px;padding:0 22px;border-radius:999px;background:#EAF9A6;color:var(--ink);font-weight:500;text-decoration:none;border:0;cursor:pointer}
.codebox{background:#262626;border:1px solid #333;border-radius:14px;padding:14px 16px;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--lime);word-break:break-all;display:flex;gap:12px;align-items:center;justify-content:space-between}
.codebox button{flex:none;border:0;border-radius:999px;padding:7px 14px;background:#fff;color:var(--ink);font:500 13px "General Sans",system-ui,sans-serif;cursor:pointer}
.foot{border-top:1px solid var(--line);background:#fff}
.foot .container{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:32px;padding-top:56px;padding-bottom:40px}
@media(max-width:860px){.foot .container{grid-template-columns:1fr 1fr}}
.foot a.logo{display:flex;margin:0}.foot h4{margin:0 0 18px;font-size:13px;font-weight:500;color:var(--muted)}.foot a{display:block;font-size:14.5px;color:var(--ink2);text-decoration:none;margin:0 0 14px}.foot a:hover{color:var(--ink)}
.foot p{font-size:14.5px;color:var(--ink2);line-height:1.7;margin:16px 0 0;max-width:300px}
.foot .bar{border-top:1px solid var(--line);padding-top:20px;padding-bottom:28px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px;color:var(--muted)}
.foot:has(~ .float) .bar{padding-bottom:96px}
.chips2{display:flex;gap:8px;flex-wrap:wrap}.chips2 span{border:1px solid var(--line);border-radius:8px;padding:6px 10px;font-size:13px;color:var(--ink2)}
.float{position:fixed;right:20px;bottom:20px;z-index:40;display:inline-flex;align-items:center;gap:12px;padding:8px 18px 8px 8px;border-radius:999px;background:#fff;border:1px solid var(--line);box-shadow:0 18px 40px -18px rgba(0,0,0,.35);text-decoration:none;color:var(--ink)}
.float .av{width:36px;height:36px;border-radius:50%;background:var(--ink);color:var(--lime);display:inline-flex;align-items:center;justify-content:center;font-weight:600}
.float b{display:block;font-weight:500;font-size:14.5px}.float small{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}.float small::before{content:"";width:6px;height:6px;border-radius:50%;background:#34D27B}
@media(max-width:640px){.section{padding:48px 0}.container,.hdr .in{padding:0 16px}.float{right:12px;bottom:12px}}
`;
