const CA = "0xd4f3bd0abf52415c50ca2c80362fd1ff667a1b77";
const PAIR = "0x8c6766affe5a8301d47df1ac73551e749e139c4e874047c35f4f0d0872e4a3ae";

const toast = document.getElementById("toast");
const glow = document.getElementById("cursor-glow");
const seek = document.getElementById("seek");
const bar = document.getElementById("capbar");
const fold = document.querySelector(".fold");
const lanes = document.getElementById("lanes");

function note(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  window.clearTimeout(note.tid);
  note.tid = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.getAttribute("data-copy") || CA;
    try {
      await navigator.clipboard.writeText(value);
      note("Contract copied");
    } catch {
      note("Copy failed");
    }
  });
});

fold?.addEventListener("click", () => {
  const open = bar.classList.toggle("open");
  fold.setAttribute("aria-expanded", String(open));
});

lanes?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    bar.classList.remove("open");
    fold?.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("pointermove", (event) => {
  glow?.style.setProperty("--mx", `${event.clientX}px`);
  glow?.style.setProperty("--my", `${event.clientY}px`);
});

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  if (seek) seek.style.width = `${ratio * 100}%`;
  bar?.classList.toggle("tight", window.scrollY > 20);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in");
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".rise").forEach((node, index) => {
  node.style.animationDelay = `${Math.min(index % 4, 3) * 90}ms`;
  io.observe(node);
});

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toPrecision(3)}`;
}

async function loadMeters() {
  const box = document.getElementById("meters");
  if (!box) return;
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/arc/${PAIR}`);
    const data = await res.json();
    const pair = data?.pairs?.[0];
    if (!pair) return;
    document.getElementById("m-price").textContent = money(pair.priceUsd);
    document.getElementById("m-mcap").textContent = money(pair.marketCap || pair.fdv);
    document.getElementById("m-liq").textContent = money(pair.liquidity?.usd);
    const chg = Number(pair.priceChange?.h24);
    const node = document.getElementById("m-chg");
    node.textContent = Number.isFinite(chg) ? `${chg.toFixed(1)}%` : "—";
    node.style.color = chg >= 0 ? "#7cffb2" : "#ff8ea0";
    box.hidden = false;
  } catch {
    box.hidden = true;
  }
}

loadMeters();

document.getElementById("add-arc")?.addEventListener("click", async () => {
  const eth = window.ethereum;
  if (!eth) {
    note("No wallet found");
    return;
  }
  try {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x13b2",
          chainName: "Arc",
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          rpcUrls: ["https://rpc.mainnet.arc.io"],
          blockExplorerUrls: ["https://explorer.arc.io"],
        },
      ],
    });
    note("Arc added");
  } catch {
    note("Wallet rejected Arc");
  }
});

(function orbs() {
  const canvas = document.getElementById("orbfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dots = [];
  let w = 0;
  let h = 0;
  let raf = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function seed() {
    dots.length = 0;
    const count = Math.min(28, Math.floor((w * h) / 52000));
    for (let i = 0; i < count; i += 1) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 18 + Math.random() * 70,
        a: 0.04 + Math.random() * 0.08,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.12,
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    dots.forEach((dot) => {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x < -dot.r) dot.x = w + dot.r;
      if (dot.x > w + dot.r) dot.x = -dot.r;
      if (dot.y < -dot.r) dot.y = h + dot.r;
      if (dot.y > h + dot.r) dot.y = -dot.r;
      const g = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.r);
      g.addColorStop(0, `rgba(110, 168, 255, ${dot.a})`);
      g.addColorStop(1, "rgba(24, 86, 255, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    });
    raf = window.requestAnimationFrame(tick);
  }

  resize();
  seed();
  tick();
  window.addEventListener("resize", () => {
    resize();
    seed();
  });
  window.addEventListener("pagehide", () => window.cancelAnimationFrame(raf));
})();
