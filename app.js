const PLAYLIST_URL = "https://raw.githubusercontent.com/iptv-org/iptv/master/countries/de.m3u";
const content = document.getElementById("content");
const player = document.getElementById("player");
const search = document.getElementById("search");

let channels = [];
let allChannels = [];
let favorites = JSON.parse(localStorage.getItem("fav") || "[]");
let lastChannel = localStorage.getItem("last");

fetch(PLAYLIST_URL)
  .then(r => r.text())
  .then(parseM3U);

function parseM3U(data) {
  let current = {};
  data.split("\n").forEach(line => {
    line = line.trim();
    if (line.startsWith("#EXTINF")) {
      current = {
        name: line.split(",").pop(),
        logo: getAttr(line, "tvg-logo"),
        group: getAttr(line, "group-title") || "Sonstiges",
        id: getAttr(line, "tvg-id")
      };
    } else if (line.startsWith("http")) {
      current.url = line;
      channels.push(current);
    }
  });
  allChannels = channels;
  render();
  if (lastChannel) play(lastChannel);
}

function getAttr(line, attr) {
  const m = line.match(new RegExp(`${attr}="([^"]*)"`));
  return m ? m[1] : "";
}

function render() {
  content.innerHTML = "";
  const groups = {};
  channels.forEach(c => { if (!groups[c.group]) groups[c.group]=[]; groups[c.group].push(c); });
  for (const group in groups) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<h2>${group}</h2><div class="cards"></div>`;
    const cards = row.querySelector(".cards");
    groups[group].forEach(c => {
      const card = document.createElement("div");
      card.className = "card";
      card.tabIndex = 0;
      card.style.backgroundImage = c.logo ? `url(${c.logo})` : "linear-gradient(#333,#111)";
      card.innerHTML = `<div class="favorite">${favorites.includes(c.url)?"★":"☆"}</div>`;
      card.onclick = ()=>play(c.url);
      card.onfocus = ()=>preview(c.url);
      card.onkeydown = e=>{ if(e.key==="Enter") toggleFav(c.url); };
      cards.appendChild(card);
    });
    content.appendChild(row);
  }
}

function play(url){
  localStorage.setItem("last",url);
  player.muted=false;
  if(Hls.isSupported()){ const hls=new Hls(); hls.loadSource(url); hls.attachMedia(player); } else player.src=url;
  player.onended=playNext;
  player.requestFullscreen?.();
}

function preview(url){ player.muted=true; play(url); }

function toggleFav(url){
  favorites=favorites.includes(url)?favorites.filter(f=>f!==url):[...favorites,url];
  localStorage.setItem("fav",JSON.stringify(favorites));
  render();
}

function playNext(){
  const index=allChannels.findIndex(c=>c.url===lastChannel);
  if(index>=0&&allChannels[index+1]) play(allChannels[index+1].url);
}

search.oninput=()=>{ const q=search.value.toLowerCase(); channels=allChannels.filter(c=>c.name.toLowerCase().includes(q)); render(); };
