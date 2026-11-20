// Type-ahead dropdown for the header search box. Pressing Enter without
// choosing a suggestion still submits the form to /search/.
(function () {
  var form = document.querySelector(".masthead form");
  if (!form) return;
  var input = form.querySelector("input[type=search]");
  var box = document.createElement("ul");
  box.className = "suggest";
  box.id = "suggest-list";
  box.setAttribute("role", "listbox");
  box.hidden = true;
  form.appendChild(box);
  input.setAttribute("autocomplete", "off");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "suggest-list");
  input.setAttribute("aria-expanded", "false");

  var index = null, loading = null, items = [], active = -1;
  function load() {
    if (index || loading) return loading;
    loading = fetch("/search-index.json").then(function (r) { return r.json(); }).then(function (d) { index = d; });
    return loading;
  }
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  // Index rows: [slug, name, aka, keywords, colors, intentions, hasImage]
  function search(q) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return index.map(function (e) {
      var name = e[1].toLowerCase(), hay = (e[1] + " " + e[2] + " " + e[3] + " " + e[4] + " " + e[5]).toLowerCase(), s = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (hay.indexOf(w) < 0) return null;
        if (name.indexOf(w) === 0) s += 10;
        else if (name.indexOf(" " + w) >= 0) s += 8;
        else if (name.indexOf(w) >= 0) s += 6;
        else s += 1;
      }
      return { e: e, s: s };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s || a.e[1].length - b.e[1].length || a.e[1].localeCompare(b.e[1]); });
  }
  function close() {
    box.hidden = true;
    active = -1;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  function highlight(i) {
    var lis = box.querySelectorAll("li");
    for (var k = 0; k < lis.length; k++) lis[k].classList.toggle("on", k === i);
    active = i;
    if (lis[i]) input.setAttribute("aria-activedescendant", lis[i].id);
    else input.removeAttribute("aria-activedescendant");
  }
  function render() {
    var q = input.value.trim();
    if (!q || !index) return close();
    var res = search(q);
    items = res.slice(0, 8);
    var html = items.map(function (r, i) {
      var e = r.e;
      var img = e[6] ? "/img/crystals/" + e[0] + "-sm.webp" : "/img/placeholder.svg";
      return '<li id="sg-' + i + '" role="option"><a href="/crystals/' + e[0] + '/"><img src="' + img + '" alt="" width="36" height="36"><span><b>' + esc(e[1]) + "</b><small>" + esc(e[3].split(" ").slice(0, 3).join(" · ")) + "</small></span></a></li>";
    }).join("");
    html += '<li class="all" id="sg-' + items.length + '" role="option"><a href="/search/?q=' + encodeURIComponent(q) + '">' + (res.length ? "See all " + res.length + " results for &ldquo;" + esc(q) + "&rdquo; &raquo;" : "No crystals match &ldquo;" + esc(q) + "&rdquo;") + "</a></li>";
    box.innerHTML = html;
    box.hidden = false;
    input.setAttribute("aria-expanded", "true");
    active = -1;
  }

  input.addEventListener("focus", load);
  input.addEventListener("input", function () {
    if (index) render();
    else load().then(render);
  });
  input.addEventListener("keydown", function (ev) {
    if (box.hidden) return;
    var n = box.querySelectorAll("li").length;
    if (ev.key === "ArrowDown") { ev.preventDefault(); highlight((active + 1) % n); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); highlight((active - 1 + n) % n); }
    else if (ev.key === "Escape") { ev.preventDefault(); close(); }
    else if (ev.key === "Enter" && active >= 0) {
      var a = box.querySelectorAll("li")[active].querySelector("a");
      if (a) { ev.preventDefault(); location.href = a.href; }
    }
  });
  box.addEventListener("mousemove", function (ev) {
    var li = ev.target.closest("li");
    if (li) highlight(Array.prototype.indexOf.call(box.children, li));
  });
  document.addEventListener("click", function (ev) { if (!form.contains(ev.target)) close(); });
})();
